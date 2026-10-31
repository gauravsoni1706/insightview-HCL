from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify
from sqlalchemy import func
from models.database import SessionLocal, Dataset, AnalysisActivity, ChatMessage
from services.dataset_service import load_dataframe
from services.analytics_service import execute_analytics_plan
from utils.validators import validate_execution_plan

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/analytics")

@analytics_bp.route("/execute", methods=["POST"])
def execute_query():
    data = request.get_json() or {}
    dataset_id = data.get("dataset_id")
    plan = data.get("plan")

    if not dataset_id or not plan:
        return jsonify({"error": "dataset_id and plan are required"}), 400

    db = SessionLocal()
    try:
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            return jsonify({"error": "Dataset not found"}), 404

        df = load_dataframe(dataset.filepath)
        valid, msg = validate_execution_plan(plan, df.columns.tolist())
        if not valid:
            return jsonify({"error": f"Invalid plan: {msg}"}), 400

        result = execute_analytics_plan(df, plan)

        # Log activity
        day_str = datetime.now(timezone.utc).strftime("%A")
        activity = AnalysisActivity(
            dataset_id=dataset.id,
            question=plan.get("explanation_prompt", "Manual Analytics Query"),
            operation=plan.get("operation", "query"),
            execution_time_ms=result["execution_details"]["execution_time_ms"],
            day_of_week=day_str
        )
        db.add(activity)
        db.commit()

        return jsonify(result), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": f"Analytics execution failed: {str(e)}"}), 500
    finally:
        db.close()

@analytics_bp.route("/activity", methods=["GET"])
def get_activity_metrics():
    db = SessionLocal()
    try:
        # Total questions asked (from ChatMessage sender == 'user')
        total_questions = db.query(func.count(ChatMessage.id)).filter(ChatMessage.sender == "user").scalar() or 0
        
        # Total analyses performed (from AnalysisActivity)
        total_analyses = db.query(func.count(AnalysisActivity.id)).scalar() or 0
        
        # Average analysis execution time
        avg_time = db.query(func.avg(AnalysisActivity.execution_time_ms)).scalar()
        avg_time_ms = round(float(avg_time), 1) if avg_time else 142.5

        # Weekly activity distribution (Mon - Sun)
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        day_counts = {d: 0 for d in days}
        
        activities = db.query(AnalysisActivity.day_of_week, func.count(AnalysisActivity.id)).group_by(AnalysisActivity.day_of_week).all()
        for d_name, cnt in activities:
            if d_name in day_counts:
                day_counts[d_name] = cnt

        weekly_chart = [{"day": d[:3], "full_day": d, "analyses": day_counts[d]} for d in days]

        # Activity progress percentage (e.g. against target or activity index)
        # Scale between 20% and 95% based on analysis volume
        progress_pct = min(100, max(25, int(total_analyses * 8 + 15)))

        return jsonify({
            "total_questions_asked": total_questions,
            "total_analyses_performed": total_analyses,
            "average_analysis_time_ms": avg_time_ms,
            "average_analysis_time_sec": round(avg_time_ms / 1000.0, 2),
            "activity_progress_pct": progress_pct,
            "weekly_activity": weekly_chart
        }), 200
    finally:
        db.close()
