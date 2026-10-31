import os
from pathlib import Path
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from models.database import SessionLocal, Dataset
from services.dataset_service import save_dataset_record
from utils.validators import allowed_file
from utils.security import sanitize_filename
from config import Config

upload_bp = Blueprint("upload", __name__, url_prefix="/api/upload")

@upload_bp.route("", methods=["POST"])
def upload_dataset():
    if "file" not in request.files:
        return jsonify({"error": "No file part in request"}), 400
        
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Only CSV files are supported"}), 400

    original_name = file.filename
    safe_name = sanitize_filename(original_name)
    timestamp = Path(original_name).stem
    stored_filename = f"{timestamp}_{os.urandom(4).hex()}.csv"
    dest_path = Config.UPLOAD_FOLDER / stored_filename

    file.save(dest_path)

    db = SessionLocal()
    try:
        dataset = save_dataset_record(db, original_name=original_name, filepath=dest_path, is_sample=False)
        return jsonify({
            "message": "Dataset uploaded and analyzed successfully",
            "dataset": dataset.to_dict()
        }), 201
    except Exception as e:
        db.rollback()
        if dest_path.exists():
            dest_path.unlink()
        return jsonify({"error": f"Failed to process CSV file: {str(e)}"}), 500
    finally:
        db.close()

@upload_bp.route("/sample/<sample_name>", methods=["POST"])
def load_sample_dataset(sample_name):
    # Map sample name to file
    sample_files = {
        "sales": "sales.csv",
        "ecommerce": "ecommerce_sales_2025.csv",
        "employees": "employees.csv",
        "compensation": "employee_compensation.csv",
        "students": "student_performance.csv"
    }

    filename = sample_files.get(sample_name.lower(), "sales.csv")
    sample_path = Config.SAMPLE_DATA_FOLDER / filename

    if not sample_path.exists():
        return jsonify({"error": f"Sample dataset '{filename}' not found"}), 404

    # Copy to uploads
    stored_filename = f"sample_{sample_name}_{os.urandom(4).hex()}.csv"
    dest_path = Config.UPLOAD_FOLDER / stored_filename
    
    with open(sample_path, "rb") as src, open(dest_path, "wb") as dst:
        dst.write(src.read())

    db = SessionLocal()
    try:
        dataset = save_dataset_record(db, original_name=filename, filepath=dest_path, is_sample=True)
        return jsonify({
            "message": f"Sample dataset '{filename}' loaded successfully",
            "dataset": dataset.to_dict()
        }), 201
    except Exception as e:
        db.rollback()
        if dest_path.exists():
            dest_path.unlink()
        return jsonify({"error": f"Failed to load sample dataset: {str(e)}"}), 500
    finally:
        db.close()
