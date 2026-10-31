import os
import shutil
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import set_key

from config import Config
from models.database import init_db, SessionLocal, Dataset, AnalysisActivity, UserPreference
from services.dataset_service import save_dataset_record
from routes.upload import upload_bp
from routes.datasets import datasets_bp
from routes.analytics import analytics_bp
from routes.chat import chat_bp
from routes.insights import insights_bp
from routes.export import export_bp

def create_app():
    dist_dir = Config.BASE_DIR.parent / "frontend" / "dist"
    app = Flask(__name__, static_folder=str(dist_dir) if dist_dir.exists() else None, static_url_path="")
    app.config.from_object(Config)

    # Enable CORS for React frontend
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Register Blueprints
    app.register_blueprint(upload_bp)
    app.register_blueprint(datasets_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(insights_bp)
    app.register_blueprint(export_bp)

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        if dist_dir.exists():
            if path and (dist_dir / path).exists():
                from flask import send_from_directory
                return send_from_directory(dist_dir, path)
            from flask import send_from_directory
            return send_from_directory(dist_dir, "index.html")
        return jsonify({
            "status": "online",
            "message": "InsightFlow AI Backend is running. Frontend dev server runs on http://localhost:5173"
        })

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "InsightFlow AI Backend",
            "version": "1.0.0"
        }), 200

    @app.route("/api/settings", methods=["GET"])
    def get_settings():
        db = SessionLocal()
        try:
            prefs = {p.key: p.value for p in db.query(UserPreference).all()}
            gemini_key = os.getenv("GEMINI_API_KEY") or Config.GEMINI_API_KEY
            openai_key = os.getenv("OPENAI_API_KEY") or Config.OPENAI_API_KEY
            
            return jsonify({
                "gemini_api_key_set": bool(gemini_key),
                "openai_api_key_set": bool(openai_key),
                "gemini_key_masked": (gemini_key[:4] + "..." + gemini_key[-4:]) if gemini_key and len(gemini_key) > 8 else ("Configured" if gemini_key else ""),
                "openai_key_masked": (openai_key[:4] + "..." + openai_key[-4:]) if openai_key and len(openai_key) > 8 else ("Configured" if openai_key else ""),
                "provider": prefs.get("llm_provider", "deterministic" if not (gemini_key or openai_key) else ("gemini" if gemini_key else "openai")),
                "theme": prefs.get("theme", "light")
            }), 200
        finally:
            db.close()

    @app.route("/api/settings", methods=["POST"])
    def update_settings():
        data = request.get_json() or {}
        gemini_key = data.get("gemini_api_key")
        openai_key = data.get("openai_api_key")
        provider = data.get("provider")

        env_path = Config.BASE_DIR / ".env"
        if not env_path.exists():
            env_path.touch()

        if gemini_key is not None:
            os.environ["GEMINI_API_KEY"] = gemini_key
            set_key(env_path, "GEMINI_API_KEY", gemini_key)
        if openai_key is not None:
            os.environ["OPENAI_API_KEY"] = openai_key
            set_key(env_path, "OPENAI_API_KEY", openai_key)

        db = SessionLocal()
        try:
            if provider:
                pref = db.query(UserPreference).filter(UserPreference.key == "llm_provider").first()
                if not pref:
                    pref = UserPreference(key="llm_provider", value=provider)
                    db.add(pref)
                else:
                    pref.value = provider
                db.commit()
            return jsonify({"message": "Settings updated successfully"}), 200
        finally:
            db.close()

    return app

def seed_sample_data():
    db = SessionLocal()
    try:
        # Check if any datasets exist
        count = db.query(Dataset).count()
        if count == 0:
            print("Seeding initial sample datasets...")
            sample_sales = Config.SAMPLE_DATA_FOLDER / "sales.csv"
            sample_ecom = Config.SAMPLE_DATA_FOLDER / "ecommerce_sales_2025.csv"

            seed_target = Config.UPLOAD_FOLDER / "sample_sales_initial.csv"
            if sample_sales.exists():
                shutil.copy(sample_sales, seed_target)
                ds1 = save_dataset_record(db, "Global_Sales_Q4.csv", seed_target, is_sample=True)

            if sample_ecom.exists():
                seed_ecom = Config.UPLOAD_FOLDER / "sample_ecommerce_initial.csv"
                shutil.copy(sample_ecom, seed_ecom)
                save_dataset_record(db, "Ecommerce_Transactions_2025.csv", seed_ecom, is_sample=True)

            # Seed authentic analysis activity entries for weekly analytics card
            days_data = [
                ("Monday", "What is the average sales value?", 125.4),
                ("Monday", "Top 5 products by revenue", 140.2),
                ("Tuesday", "Find correlation between price and units", 180.5),
                ("Wednesday", "Detect outliers in Customer_Age", 95.8),
                ("Wednesday", "Show regional sales breakdown", 110.1),
                ("Thursday", "Identify missing values across all columns", 85.0),
                ("Friday", "Show monthly revenue timeline trend", 155.3),
                ("Friday", "What are the most important insights?", 210.0),
                ("Saturday", "Compare electronics vs furniture category", 130.4),
                ("Sunday", "Summary statistics for sales dataset", 92.6)
            ]
            for day, q, t in days_data:
                act = AnalysisActivity(
                    dataset_id=1,
                    question=q,
                    operation="auto_seed",
                    execution_time_ms=t,
                    day_of_week=day
                )
                db.add(act)
            db.commit()
            print("Initial sample data and activity successfully seeded.")
    except Exception as e:
        print(f"Error seeding sample data: {e}")
        db.rollback()
    finally:
        db.close()

app = create_app()

if __name__ == "__main__":
    init_db()
    seed_sample_data()
    print(f"InsightFlow AI Backend running on http://{Config.HOST}:{Config.PORT}")
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
