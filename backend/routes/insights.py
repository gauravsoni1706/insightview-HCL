from flask import Blueprint, request, jsonify
from models.database import SessionLocal, Dataset, Insight
from services.dataset_service import load_dataframe, profile_dataset

insights_bp = Blueprint("insights", __name__, url_prefix="/api/insights")

@insights_bp.route("/<int:dataset_id>", methods=["GET"])
def get_insights(dataset_id):
    db = SessionLocal()
    try:
        insights = db.query(Insight).filter(Insight.dataset_id == dataset_id).order_by(Insight.created_at.desc()).all()
        return jsonify([i.to_dict() for i in insights]), 200
    finally:
        db.close()

@insights_bp.route("/all", methods=["GET"])
def get_all_recent_insights():
    limit = int(request.args.get("limit", 6))
    db = SessionLocal()
    try:
        insights = db.query(Insight).order_by(Insight.created_at.desc()).limit(limit).all()
        return jsonify([i.to_dict() for i in insights]), 200
    finally:
        db.close()

@insights_bp.route("/toggle-save/<int:insight_id>", methods=["POST"])
def toggle_save_insight(insight_id):
    db = SessionLocal()
    try:
        insight = db.query(Insight).filter(Insight.id == insight_id).first()
        if not insight:
            return jsonify({"error": "Insight not found"}), 404
        insight.is_saved = not insight.is_saved
        db.commit()
        return jsonify({"message": "Insight bookmark updated", "insight": insight.to_dict()}), 200
    finally:
        db.close()

@insights_bp.route("/refresh/<int:dataset_id>", methods=["POST"])
def refresh_insights(dataset_id):
    db = SessionLocal()
    try:
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            return jsonify({"error": "Dataset not found"}), 404

        df = load_dataframe(dataset.filepath)
        profile = profile_dataset(df, dataset.original_name, dataset.file_size_bytes)

        # Clear existing unsaved insights for this dataset
        db.query(Insight).filter(Insight.dataset_id == dataset_id, Insight.is_saved == False).delete()
        
        created = []
        for ins in profile["insights"]:
            insight_obj = Insight(
                dataset_id=dataset.id,
                title=ins["title"],
                explanation=ins["explanation"],
                category=ins.get("category", "trend"),
                severity=ins.get("severity", "info"),
                metric_value=ins.get("metric_value", "")
            )
            db.add(insight_obj)
            created.append(insight_obj)
        db.commit()

        return jsonify([c.to_dict() for c in created]), 200
    finally:
        db.close()
