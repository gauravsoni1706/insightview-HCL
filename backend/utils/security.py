import re
from pathlib import Path
from werkzeug.utils import secure_filename

def sanitize_filename(filename: str) -> str:
    """
    Sanitize and ensure safe filename.
    """
    cleaned = secure_filename(filename)
    if not cleaned:
        cleaned = "dataset.csv"
    if not cleaned.lower().endswith(".csv"):
        cleaned += ".csv"
    return cleaned

def sanitize_column_name(col: str) -> str:
    """
    Clean column names to prevent injection or formatting breakages.
    """
    if not isinstance(col, str):
        col = str(col)
    col = col.strip()
    # Replace dangerous symbols or newlines
    col = re.sub(r'[\r\n\t]+', ' ', col)
    return col if col else "unnamed_column"

def secure_filepath(base_dir: Path, filename: str) -> Path:
    """
    Resolve and prevent directory traversal.
    """
    safe_name = sanitize_filename(filename)
    dest = (base_dir / safe_name).resolve()
    if not str(dest).startswith(str(base_dir.resolve())):
        raise ValueError("Invalid file path traversal attempt")
    return dest
