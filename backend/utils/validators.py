import os
import csv
from pathlib import Path

ALLOWED_EXTENSIONS = {".csv"}
MAX_FILE_SIZE = 100 * 1024 * 1024 # 100 MB

def allowed_file(filename: str) -> bool:
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS

def detect_encoding_and_delimiter(filepath: Path):
    """
    Detect encoding and delimiter of a CSV file safely.
    """
    encodings = ["utf-8", "utf-8-sig", "latin1", "cp1252", "iso-8859-1"]
    detected_encoding = "utf-8"
    sample_text = ""
    
    for enc in encodings:
        try:
            with open(filepath, "r", encoding=enc, errors="strict") as f:
                sample_text = f.read(16384)
            detected_encoding = enc
            break
        except UnicodeDecodeError:
            continue
            
    if not sample_text:
        detected_encoding = "latin1"
        with open(filepath, "r", encoding="latin1", errors="replace") as f:
            sample_text = f.read(16384)

    # Sniff delimiter
    detected_delimiter = ","
    try:
        sniffer = csv.Sniffer()
        dialect = sniffer.sniff(sample_text, delimiters=",\t;|")
        detected_delimiter = dialect.delimiter
    except Exception:
        # Fallback counting
        counts = {
            ",": sample_text.count(","),
            "\t": sample_text.count("\t"),
            ";": sample_text.count(";"),
            "|": sample_text.count("|"),
        }
        detected_delimiter = max(counts, key=counts.get)
        if counts[detected_delimiter] == 0:
            detected_delimiter = ","

    return detected_encoding, detected_delimiter

def validate_execution_plan(plan: dict, available_columns: list) -> tuple[bool, str]:
    """
    Validates a structured execution plan against dataset schema.
    """
    if not isinstance(plan, dict):
        return False, "Execution plan must be a JSON object"
        
    op = plan.get("operation")
    if not op:
        return False, "Missing 'operation' in execution plan"

    valid_ops = {
        "summary", "aggregate", "group_by", "filter", "top_n", "bottom_n",
        "correlation", "distribution", "trend_time_series", "outliers",
        "missing_values", "value_counts", "comparison"
    }
    if op not in valid_ops:
        return False, f"Unsupported operation: {op}"

    col_lookup = {c.lower(): c for c in available_columns}

    # Validate target column if provided
    target_col = plan.get("target_column")
    if target_col and target_col != "*" and target_col.lower() not in col_lookup:
        return False, f"Target column '{target_col}' not found in dataset"

    # Validate group column if provided
    group_col = plan.get("group_column")
    if group_col and group_col.lower() not in col_lookup:
        return False, f"Group column '{group_col}' not found in dataset"

    # Validate secondary columns
    columns = plan.get("columns", [])
    if isinstance(columns, list):
        for c in columns:
            if c != "*" and c.lower() not in col_lookup:
                return False, f"Column '{c}' not found in dataset"

    return True, "Valid"
