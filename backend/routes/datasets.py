from pathlib import Path
from flask import Blueprint, request, jsonify
from models.database import SessionLocal, Dataset, Insight, Conversation
from services.dataset_service import load_dataframe

datasets_bp = Blueprint("datasets", __name__, url_prefix="/api/datasets")

@datasets_bp.route("", methods=["GET"])
def get_datasets():
    db = SessionLocal()
    try:
        datasets = db.query(Dataset).order_by(Dataset.created_at.desc()).all()
        return jsonify([d.to_dict() for d in datasets]), 200
    finally:
        db.close()

@datasets_bp.route("/<int:dataset_id>", methods=["GET"])
def get_dataset(dataset_id):
    db = SessionLocal()
    try:
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            return jsonify({"error": "Dataset not found"}), 404
        return jsonify(dataset.to_dict()), 200
    finally:
        db.close()

@datasets_bp.route("/<int:dataset_id>/preview", methods=["GET"])
def get_dataset_preview(dataset_id):
    limit = int(request.args.get("limit", 20))
    offset = int(request.args.get("offset", 0))

    db = SessionLocal()
    try:
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            return jsonify({"error": "Dataset not found"}), 404

        df = load_dataframe(dataset.filepath)
        total_rows = len(df)
        slice_df = df.iloc[offset:offset + limit]

        # Convert NaNs to None for clean JSON serialization
        records = slice_df.fillna("").to_dict(orient="records")

        return jsonify({
            "total_rows": total_rows,
            "columns": df.columns.tolist(),
            "rows": records,
            "limit": limit,
            "offset": offset
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to preview dataset: {str(e)}"}), 500
    finally:
        db.close()

@datasets_bp.route("/<int:dataset_id>", methods=["DELETE"])
def delete_dataset(dataset_id):
    db = SessionLocal()
    try:
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            return jsonify({"error": "Dataset not found"}), 404

        # Remove local file if exists
        p = Path(dataset.filepath)
        if p.exists():
            try:
                p.unlink()
            except Exception:
                pass

        db.delete(dataset)
        db.commit()
        return jsonify({"message": "Dataset deleted successfully"}), 200
    finally:
        db.close()

@datasets_bp.route("/compare", methods=["POST"])
def compare_datasets():
    data = request.get_json() or {}
    id_a = data.get("dataset_id_a")
    id_b = data.get("dataset_id_b")

    if not id_a or not id_b:
        return jsonify({"error": "Both dataset_id_a and dataset_id_b are required"}), 400

    db = SessionLocal()
    try:
        ds_a = db.query(Dataset).filter(Dataset.id == id_a).first()
        ds_b = db.query(Dataset).filter(Dataset.id == id_b).first()

        if not ds_a or not ds_b:
            return jsonify({"error": "One or both datasets not found"}), 404

        dict_a = ds_a.to_dict()
        dict_b = ds_b.to_dict()

        cols_a = set(c["name"].lower() for c in dict_a["column_details"])
        cols_b = set(c["name"].lower() for c in dict_b["column_details"])

        shared_cols = list(cols_a.intersection(cols_b))
        diff_a = list(cols_a - cols_b)
        diff_b = list(cols_b - cols_a)

        comparison = {
            "dataset_a": {
                "id": ds_a.id,
                "name": ds_a.original_name,
                "row_count": ds_a.row_count,
                "col_count": ds_a.col_count,
                "data_quality_score": ds_a.data_quality_score,
                "missing_cells": ds_a.missing_cells_count,
                "unique_columns": diff_a
            },
            "dataset_b": {
                "id": ds_b.id,
                "name": ds_b.original_name,
                "row_count": ds_b.row_count,
                "col_count": ds_b.col_count,
                "data_quality_score": ds_b.data_quality_score,
                "missing_cells": ds_b.missing_cells_count,
                "unique_columns": diff_b
            },
            "shared_columns": shared_cols,
            "row_count_diff": ds_b.row_count - ds_a.row_count,
            "quality_diff": round(ds_b.data_quality_score - ds_a.data_quality_score, 1)
        }
        return jsonify(comparison), 200
    finally:
        db.close()
