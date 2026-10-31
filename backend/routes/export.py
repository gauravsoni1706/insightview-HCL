import io
from pathlib import Path
from datetime import datetime
from flask import Blueprint, request, jsonify, send_file
from models.database import SessionLocal, Dataset, Insight
from services.cleaning_service import clean_dataset
from services.dataset_service import load_dataframe
from config import Config

# ReportLab imports
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

export_bp = Blueprint("export", __name__, url_prefix="/api/export")

@export_bp.route("/clean", methods=["POST"])
def clean_dataset_route():
    data = request.get_json() or {}
    dataset_id = data.get("dataset_id")
    missing_strategy = data.get("missing_strategy", "none")
    remove_duplicates = bool(data.get("remove_duplicates", False))
    outlier_strategy = data.get("outlier_strategy", "none")
    target_columns = data.get("target_columns")

    if not dataset_id:
        return jsonify({"error": "dataset_id is required"}), 400

    db = SessionLocal()
    try:
        result = clean_dataset(
            db=db,
            dataset_id=dataset_id,
            missing_strategy=missing_strategy,
            remove_duplicates=remove_duplicates,
            outlier_strategy=outlier_strategy,
            target_columns=target_columns
        )
        return jsonify(result), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": f"Cleaning failed: {str(e)}"}), 500
    finally:
        db.close()

@export_bp.route("/download/<path:filename>", methods=["GET"])
def download_file(filename):
    file_path = (Config.UPLOAD_FOLDER / filename).resolve()
    if not file_path.exists() or not str(file_path).startswith(str(Config.BASE_DIR)):
        return jsonify({"error": "File not found"}), 404

    return send_file(
        file_path,
        as_attachment=True,
        download_name=filename,
        mimetype="text/csv"
    )

@export_bp.route("/pdf-report/<int:dataset_id>", methods=["GET"])
def generate_pdf_report(dataset_id):
    db = SessionLocal()
    try:
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            return jsonify({"error": "Dataset not found"}), 404

        insights = db.query(Insight).filter(Insight.dataset_id == dataset_id).limit(6).all()
        ds_dict = dataset.to_dict()

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom styles matching SaaS palette
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Heading1"],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor("#20232B"),
            spaceAfter=4
        )
        subtitle_style = ParagraphStyle(
            "DocSubTitle",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#858B98"),
            spaceAfter=12
        )
        h2_style = ParagraphStyle(
            "SectionH2",
            parent=styles["Heading2"],
            fontSize=14,
            leading=18,
            textColor=colors.HexColor("#465CF5"),
            spaceBefore=12,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            "BodyDark",
            parent=styles["Normal"],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#20232B")
        )
        insight_title = ParagraphStyle(
            "InsTitle",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#20232B"),
            fontName="Helvetica-Bold"
        )

        story = []

        # Header
        story.append(Paragraph("<b>InsightFlow AI</b> &mdash; Executive Dataset Report", title_style))
        story.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')} | Dataset: <b>{dataset.original_name}</b>", subtitle_style))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#EAECF0"), spaceAfter=14))

        # KPI Metrics Table
        story.append(Paragraph("Dataset Quality & Overview", h2_style))
        kpi_data = [
            ["Metric", "Value", "Status / Details"],
            ["Total Records", f"{dataset.row_count:,}", "Active data points"],
            ["Total Columns", f"{dataset.col_count}", "Analyzed attributes"],
            ["Missing Cells", f"{dataset.missing_cells_count:,}", "Null data values"],
            ["Duplicate Rows", f"{dataset.duplicate_rows_count:,}", "Redundant records"],
            ["Data Quality Score", f"{dataset.data_quality_score}%", "Certified health grade"]
        ]
        t = Table(kpi_data, colWidths=[150, 120, 250])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E9EDFF")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#465CF5")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#EAECF0")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ]))
        story.append(t)
        story.append(Spacer(1, 14))

        # Key AI Insights
        story.append(Paragraph("Key AI-Powered Discoveries & Behavioral Signals", h2_style))
        if insights:
            for ins in insights:
                sev_color = "#42B994" if ins.severity == "success" else ("#F4B65E" if ins.severity == "warning" else "#465CF5")
                story.append(Paragraph(f"• <font color='{sev_color}'><b>[{ins.category.upper()}]</b></font> {ins.title}", insight_title))
                story.append(Paragraph(ins.explanation, body_style))
                story.append(Spacer(1, 4))
        else:
            story.append(Paragraph("No specific anomalies or alerts generated for this clean dataset.", body_style))

        story.append(Spacer(1, 14))

        # Column Schema & Distributions
        story.append(Paragraph("Schema & Column Distributions", h2_style))
        col_headers = ["Column Name", "Type", "Missing %", "Distinct", "Sample / Range"]
        col_rows = [col_headers]
        
        for col in ds_dict.get("column_details", [])[:12]:
            range_info = f"[{col.get('min', '')} to {col.get('max', '')}]" if col.get("type") == "numeric" and "min" in col else ", ".join(col.get("sample_values", [])[:2])
            col_rows.append([
                col["name"][:20],
                col["type"],
                f"{col['missing_percentage']}%",
                str(col["unique_count"]),
                range_info[:30]
            ])

        col_table = Table(col_rows, colWidths=[130, 80, 70, 70, 170])
        col_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F3F5F9")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#EAECF0")),
        ]))
        story.append(col_table)
        story.append(Spacer(1, 16))

        # Footer note
        story.append(Paragraph("InsightFlow AI &mdash; Autonomous Conversational Data Analysis Platform. Confidential & Proprietary.", subtitle_style))

        doc.build(story)
        buffer.seek(0)

        filename = f"InsightFlow_Report_{dataset.id}_{datetime.now().strftime('%Y%m%d')}.pdf"
        return send_file(
            buffer,
            as_attachment=True,
            download_name=filename,
            mimetype="application/pdf"
        )
    except Exception as e:
        return jsonify({"error": f"Failed to generate PDF: {str(e)}"}), 500
    finally:
        db.close()
