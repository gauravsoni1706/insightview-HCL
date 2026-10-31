import json
import os
from pathlib import Path
from datetime import datetime, timezone
import pandas as pd
import numpy as np

from utils.validators import detect_encoding_and_delimiter
from utils.security import sanitize_column_name, sanitize_filename
from models.database import Dataset, Insight

def load_dataframe(filepath: str | Path) -> pd.DataFrame:
    filepath = Path(filepath)
    if not filepath.exists():
        raise FileNotFoundError(f"File not found: {filepath}")

    encoding, delimiter = detect_encoding_and_delimiter(filepath)
    try:
        df = pd.read_csv(
            filepath,
            encoding=encoding,
            sep=delimiter,
            on_bad_lines="skip",
            low_memory=False
        )
    except Exception as e:
        # Fallback with python engine
        df = pd.read_csv(
            filepath,
            encoding="latin1",
            sep=None,
            engine="python",
            on_bad_lines="skip"
        )

    # Sanitize column names
    df.columns = [sanitize_column_name(c) for c in df.columns]
    
    # Try parsing obvious date columns
    for col in df.columns:
        if df[col].dtype == "object":
            if any(term in col.lower() for term in ["date", "time", "timestamp", "year_month", "day"]):
                try:
                    df[col] = pd.to_datetime(df[col], errors="ignore")
                except Exception:
                    pass
    return df

def profile_dataset(df: pd.DataFrame, filename: str, file_size: int = 0) -> dict:
    row_count, col_count = df.shape
    total_cells = row_count * col_count if row_count * col_count > 0 else 1
    
    missing_cells = int(df.isna().sum().sum())
    missing_ratio = missing_cells / total_cells if total_cells > 0 else 0
    
    # Duplicate rows
    duplicate_rows = int(df.duplicated().sum())
    duplicate_ratio = duplicate_rows / row_count if row_count > 0 else 0
    
    # Rows with at least one missing cell
    rows_with_missing = int(df.isna().any(axis=1).sum())
    complete_rows = max(0, row_count - rows_with_missing - duplicate_rows)

    # Column details
    column_details = []
    numeric_cols = []
    categorical_cols = []
    datetime_cols = []

    for col in df.columns:
        series = df[col]
        dtype_str = str(series.dtype)
        col_type = "text"

        if pd.api.types.is_numeric_dtype(series):
            col_type = "numeric"
            numeric_cols.append(col)
        elif pd.api.types.is_datetime64_any_dtype(series):
            col_type = "datetime"
            datetime_cols.append(col)
        elif pd.api.types.is_bool_dtype(series):
            col_type = "boolean"
        else:
            col_type = "categorical"
            categorical_cols.append(col)

        missing_count = int(series.isna().sum())
        missing_pct = round((missing_count / row_count) * 100, 2) if row_count > 0 else 0
        unique_count = int(series.nunique(dropna=True))
        
        # Safe samples
        non_null = series.dropna()
        sample_vals = [str(v) for v in non_null.head(3).tolist()]

        detail = {
            "name": col,
            "type": col_type,
            "raw_dtype": dtype_str,
            "missing_count": missing_count,
            "missing_percentage": missing_pct,
            "unique_count": unique_count,
            "sample_values": sample_vals
        }

        if col_type == "numeric" and not non_null.empty:
            detail["min"] = float(non_null.min())
            detail["max"] = float(non_null.max())
            detail["mean"] = round(float(non_null.mean()), 2)
            detail["median"] = round(float(non_null.median()), 2)
            detail["std"] = round(float(non_null.std()), 2) if len(non_null) > 1 else 0.0

        column_details.append(detail)

    # Calculate Data Quality Score (0 - 100%)
    # Quality penalty formula: missing cells weight 50%, duplicates weight 30%, single-value columns weight 20%
    single_val_cols = sum(1 for c in column_details if c["unique_count"] <= 1 and row_count > 1)
    single_val_ratio = single_val_cols / col_count if col_count > 0 else 0
    
    penalty = (missing_ratio * 40.0) + (duplicate_ratio * 35.0) + (single_val_ratio * 25.0)
    data_quality_score = max(5.0, min(100.0, 100.0 - penalty * 100.0))

    # Quality breakdown for donut chart
    quality_breakdown = {
        "complete_records": complete_rows,
        "missing_records": rows_with_missing,
        "duplicate_records": duplicate_rows,
        "total_records": row_count,
        "complete_percentage": round((complete_rows / row_count) * 100, 1) if row_count > 0 else 0,
        "missing_percentage": round((rows_with_missing / row_count) * 100, 1) if row_count > 0 else 0,
        "duplicate_percentage": round((duplicate_rows / row_count) * 100, 1) if row_count > 0 else 0
    }

    # Summary statistics
    summary_stats = {
        "total_records": row_count,
        "total_columns": col_count,
        "numeric_column_count": len(numeric_cols),
        "categorical_column_count": len(categorical_cols),
        "datetime_column_count": len(datetime_cols),
        "missing_cells": missing_cells,
        "duplicate_rows": duplicate_rows,
        "data_quality_score": round(data_quality_score, 1)
    }

    # Auto-generate dynamic real insights
    generated_insights = []

    # 1. Missing values insight
    if missing_cells > 0:
        worst_col = max(column_details, key=lambda c: c["missing_count"])
        generated_insights.append({
            "title": f"Missing Data Detected in {sum(1 for c in column_details if c['missing_count'] > 0)} Columns",
            "explanation": f"Found {missing_cells} missing values ({round(missing_ratio * 100, 1)}% of all cells). Column '{worst_col['name']}' has {worst_col['missing_count']} missing values.",
            "category": "quality",
            "severity": "warning" if missing_ratio > 0.05 else "info",
            "metric_value": f"{round(missing_ratio * 100, 1)}% missing"
        })
    else:
        generated_insights.append({
            "title": "Zero Missing Values Detected",
            "explanation": f"All {row_count} rows across {col_count} columns are completely filled with zero null values.",
            "category": "quality",
            "severity": "success",
            "metric_value": "100% complete"
        })

    # 2. Duplicate rows insight
    if duplicate_rows > 0:
        generated_insights.append({
            "title": f"{duplicate_rows} Duplicate Rows Identified",
            "explanation": f"Duplicate rows account for {round(duplicate_ratio * 100, 1)}% of the dataset. Consider cleaning to prevent double-counting.",
            "category": "quality",
            "severity": "warning",
            "metric_value": f"{duplicate_rows} dupes"
        })

    # 3. Numeric correlation insight
    if len(numeric_cols) >= 2:
        try:
            corr_matrix = df[numeric_cols].corr()
            # Find highest non-diagonal correlation
            corr_pairs = []
            for i in range(len(numeric_cols)):
                for j in range(i + 1, len(numeric_cols)):
                    val = corr_matrix.iloc[i, j]
                    if not np.isnan(val):
                        corr_pairs.append((numeric_cols[i], numeric_cols[j], val))
            
            if corr_pairs:
                corr_pairs.sort(key=lambda x: abs(x[2]), reverse=True)
                top_pair = corr_pairs[0]
                corr_type = "positive" if top_pair[2] > 0 else "inverse"
                strength = "strong" if abs(top_pair[2]) > 0.6 else "moderate"
                generated_insights.append({
                    "title": f"Strong Correlation: {top_pair[0]} & {top_pair[1]}",
                    "explanation": f"A {strength} {corr_type} correlation of r = {round(top_pair[2], 2)} exists between {top_pair[0]} and {top_pair[1]}.",
                    "category": "correlation",
                    "severity": "info",
                    "metric_value": f"r = {round(top_pair[2], 2)}"
                })
        except Exception:
            pass

    # 4. Top categorical concentration insight
    for cat_col in categorical_cols[:2]:
        vc = df[cat_col].value_counts(dropna=True)
        if not vc.empty:
            top_val = vc.index[0]
            top_count = int(vc.iloc[0])
            top_pct = round((top_count / row_count) * 100, 1) if row_count > 0 else 0
            if top_pct >= 30:
                generated_insights.append({
                    "title": f"High Concentration in {cat_col}",
                    "explanation": f"Top category '{top_val}' accounts for {top_pct}% ({top_count} records) of all entries in {cat_col}.",
                    "category": "distribution",
                    "severity": "info",
                    "metric_value": f"{top_pct}%"
                })
                break

    # 5. Outlier detection on primary numeric column
    if numeric_cols:
        target_num = numeric_cols[0]
        s = df[target_num].dropna()
        q1 = s.quantile(0.25)
        q3 = s.quantile(0.75)
        iqr = q3 - q1
        if iqr > 0:
            outliers = df[(df[target_num] < (q1 - 1.5 * iqr)) | (df[target_num] > (q3 + 1.5 * iqr))]
            outlier_count = len(outliers)
            if outlier_count > 0:
                generated_insights.append({
                    "title": f"{outlier_count} Outliers in {target_num}",
                    "explanation": f"Statistical IQR analysis flagged {outlier_count} anomalous data points ({round((outlier_count/row_count)*100, 1)}%) in {target_num}.",
                    "category": "anomaly",
                    "severity": "warning" if outlier_count > 5 else "info",
                    "metric_value": f"{outlier_count} outliers"
                })

    return {
        "filename": filename,
        "file_size_bytes": file_size,
        "row_count": row_count,
        "col_count": col_count,
        "missing_cells_count": missing_cells,
        "duplicate_rows_count": duplicate_rows,
        "data_quality_score": round(data_quality_score, 1),
        "column_details": column_details,
        "summary_stats": summary_stats,
        "quality_breakdown": quality_breakdown,
        "insights": generated_insights
    }

def save_dataset_record(db, original_name: str, filepath: str | Path, is_sample: bool = False) -> Dataset:
    filepath = Path(filepath)
    file_size = filepath.stat().st_size if filepath.exists() else 0
    df = load_dataframe(filepath)
    profile = profile_dataset(df, original_name, file_size)

    dataset = Dataset(
        filename=filepath.name,
        original_name=original_name,
        filepath=str(filepath.resolve()),
        file_size_bytes=file_size,
        row_count=profile["row_count"],
        col_count=profile["col_count"],
        missing_cells_count=profile["missing_cells_count"],
        duplicate_rows_count=profile["duplicate_rows_count"],
        data_quality_score=profile["data_quality_score"],
        column_details_json=json.dumps(profile["column_details"]),
        summary_stats_json=json.dumps(profile["summary_stats"]),
        quality_breakdown_json=json.dumps(profile["quality_breakdown"]),
        is_sample=is_sample,
        status="active"
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    # Save generated insights
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
    db.commit()

    return dataset
