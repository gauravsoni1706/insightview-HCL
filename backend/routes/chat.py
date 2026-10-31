import json
import time
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from models.database import SessionLocal, Dataset, Conversation, ChatMessage, AnalysisActivity
from services.dataset_service import load_dataframe
from services.analytics_service import execute_analytics_plan
from services.llm_service import parse_nl_query, generate_business_explanation
from utils.validators import validate_execution_plan

chat_bp = Blueprint("chat", __name__, url_prefix="/api/chat")

@chat_bp.route("/conversations/<int:dataset_id>", methods=["GET"])
def get_conversations(dataset_id):
    db = SessionLocal()
    try:
        convos = db.query(Conversation).filter(Conversation.dataset_id == dataset_id).order_by(Conversation.updated_at.desc()).all()
        return jsonify([c.to_dict() for c in convos]), 200
    finally:
        db.close()

@chat_bp.route("/conversations", methods=["POST"])
def create_conversation():
    data = request.get_json() or {}
    dataset_id = data.get("dataset_id")
    title = data.get("title", "New Analysis Session")

    if not dataset_id:
        return jsonify({"error": "dataset_id is required"}), 400

    db = SessionLocal()
    try:
        convo = Conversation(dataset_id=dataset_id, title=title)
        db.add(convo)
        db.commit()
        db.refresh(convo)
        return jsonify(convo.to_dict()), 201
    finally:
        db.close()

@chat_bp.route("/messages/<int:conversation_id>", methods=["GET"])
def get_messages(conversation_id):
    db = SessionLocal()
    try:
        messages = db.query(ChatMessage).filter(ChatMessage.conversation_id == conversation_id).order_by(ChatMessage.id.asc()).all()
        return jsonify([m.to_dict() for m in messages]), 200
    finally:
        db.close()

@chat_bp.route("/message", methods=["POST"])
def send_message():
    start_time = time.perf_counter()
    data = request.get_json() or {}
    conversation_id = data.get("conversation_id")
    dataset_id = data.get("dataset_id")
    question = (data.get("question") or "").strip()

    if not question:
        return jsonify({"error": "question cannot be empty"}), 400

    db = SessionLocal()
    try:
        # Resolve or auto-create conversation
        if not conversation_id:
            if not dataset_id:
                # pick most recent active dataset
                ds = db.query(Dataset).order_by(Dataset.id.desc()).first()
                if not ds:
                    return jsonify({"error": "No active dataset found"}), 404
                dataset_id = ds.id

            convo = Conversation(dataset_id=dataset_id, title=question[:40] + ("..." if len(question) > 40 else ""))
            db.add(convo)
            db.commit()
            db.refresh(convo)
            conversation_id = convo.id
        else:
            convo = db.query(Conversation).filter(Conversation.id == conversation_id).first()
            if not convo:
                return jsonify({"error": "Conversation not found"}), 404
            dataset_id = convo.dataset_id

        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            return jsonify({"error": "Dataset not found"}), 404

        # Save User Message
        user_msg = ChatMessage(
            conversation_id=conversation_id,
            sender="user",
            content=question
        )
        db.add(user_msg)
        db.commit()

        # Load DataFrame
        df = load_dataframe(dataset.filepath)
        sample_records = df.head(3).fillna("").to_dict(orient="records")

        # 1. Parse question to structured plan
        plan = parse_nl_query(question, df.columns.tolist(), sample_records)

        # 2. Validate plan
        is_valid, validation_msg = validate_execution_plan(plan, df.columns.tolist())
        if not is_valid:
            # Fallback to summary if validation fails
            plan = {"operation": "summary", "explanation_prompt": f"Summary fallback for: {question}"}

        # 3. Execute deterministic Pandas calculations
        calc_result = execute_analytics_plan(df, plan)

        # 4. Generate professional business takeaway
        explanation = generate_business_explanation(question, plan, calc_result)

        exec_duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

        # 5. Save AI ChatMessage
        ai_msg = ChatMessage(
            conversation_id=conversation_id,
            sender="ai",
            content=explanation,
            execution_plan_json=json.dumps(plan),
            numerical_results_json=json.dumps(calc_result.get("numerical_results", {})),
            chart_config_json=json.dumps(calc_result.get("chart_config")),
            table_data_json=json.dumps(calc_result.get("table_data")),
            execution_time_ms=exec_duration_ms
        )
        db.add(ai_msg)

        # 6. Record Analysis Activity
        day_str = datetime.now(timezone.utc).strftime("%A")
        activity = AnalysisActivity(
            dataset_id=dataset.id,
            question=question,
            operation=plan.get("operation", "query"),
            execution_time_ms=exec_duration_ms,
            day_of_week=day_str
        )
        db.add(activity)

        # Update conversation timestamp & title if first message
        convo.updated_at = datetime.now(timezone.utc)
        if convo.title == "New Analysis Session":
            convo.title = question[:40] + ("..." if len(question) > 40 else "")

        db.commit()
        db.refresh(ai_msg)

        return jsonify({
            "conversation_id": conversation_id,
            "user_message": user_msg.to_dict(),
            "ai_message": ai_msg.to_dict()
        }), 200

    except Exception as e:
        db.rollback()
        return jsonify({"error": f"Failed to process chat message: {str(e)}"}), 500
    finally:
        db.close()
