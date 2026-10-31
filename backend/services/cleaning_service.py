import json
from pathlib import Path
import pandas as pd
import numpy as np
from datetime import datetime, timezone

from services.dataset_service import load_dataframe, profile_dataset
from models.database import Dataset, Insight
from config import Config

def clean_dataset(
    db,
    dataset_id: int,
    missing_strategy: str = "none", # "drop", "mean", "median", "mode", "zero"
    remove_duplicates: bool = False,
    outlier_strategy: str = "none", # "clip_iqr", "drop_iqr", "none"
    target_columns: list = None
) -> dict:
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise ValueError("Dataset not found")

    df = load_dataframe(dataset.filepath)
    original_rows = len(df)
    original_missing = int(df.isna().sum().sum())
    original_duplicates = int(df.duplicated().sum())

    actions_taken = []

    # 1. Duplicate removal
    if remove_duplicates:
        dupes_before = int(df.duplicated().sum())
        df = df.drop_duplicates().reset_index(drop=True)
        actions_taken.append(f"Removed {dupes_before} exact duplicate rows.")

    # 2. Missing value treatment
    if missing_strategy != "none":
        cols_to_clean = target_columns if target_columns else df.columns.tolist()
        
        if missing_strategy == "drop":
            rows_before = len(df)
            df = df.dropna(subset=cols_to_clean).reset_index(drop=True)
            dropped = rows_before - len(df)
            actions_taken.append(f"Dropped {dropped} rows with missing values.")
        
        elif missing_strategy in ("mean", "median", "mode", "zero"):
            for col in cols_to_clean:
                if col not in df.columns:
                    continue
                missing_in_col = int(df[col].isna().sum())
                if missing_in_col == 0:
                    continue

                if pd.api.types.is_numeric_dtype(df[col]):
                    if missing_strategy == "mean":
                        fill_val = df[col].mean()
                        df[col] = df[col].fillna(fill_val)
                        actions_taken.append(f"Imputed {missing_in_col} missing cells in '{col}' with mean ({round(fill_val, 2)}).")
                    elif missing_strategy == "median":
                        fill_val = df[col].median()
                        df[col] = df[col].fillna(fill_val)
                        actions_taken.append(f"Imputed {missing_in_col} missing cells in '{col}' with median ({round(fill_val, 2)}).")
                    elif missing_strategy == "zero":
                        df[col] = df[col].fillna(0)
                        actions_taken.append(f"Filled {missing_in_col} missing cells in '{col}' with 0.")
                    elif missing_strategy == "mode":
                        mode_vals = df[col].mode()
                        fill_val = mode_vals[0] if not mode_vals.empty else 0
                        df[col] = df[col].fillna(fill_val)
                        actions_taken.append(f"Imputed {missing_in_col} missing cells in '{col}' with mode ({fill_val}).")
                else:
                    mode_vals = df[col].mode()
                    fill_val = mode_vals[0] if not mode_vals.empty else "Unknown"
                    df[col] = df[col].fillna(fill_val)
                    actions_taken.append(f"Imputed {missing_in_col} missing values in text column '{col}' with mode ('{fill_val}').")

    # 3. Outlier treatment
    if outlier_strategy in ("clip_iqr", "drop_iqr"):
        num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if target_columns:
            num_cols = [c for c in num_cols if c in target_columns]

        for col in num_cols:
            s = df[col].dropna()
            if len(s) < 4:
                continue
            q1 = s.quantile(0.25)
            q3 = s.quantile(0.75)
            iqr = q3 - q1
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr

            if outlier_strategy == "clip_iqr":
                outlier_count = int(((df[col] < lower_bound) | (df[col] > upper_bound)).sum())
                if outlier_count > 0:
                    df[col] = df[col].clip(lower=lower_bound, upper=upper_bound)
                    actions_taken.append(f"Clipped {outlier_count} outliers in '{col}' to range [{round(lower_bound, 2)}, {round(upper_bound, 2)}].")
            elif outlier_strategy == "drop_iqr":
                rows_before = len(df)
                df = df[(df[col] >= lower_bound) & (df[col] <= upper_bound)].reset_index(drop=True)
                dropped = rows_before - len(df)
                if dropped > 0:
                    actions_taken.append(f"Removed {dropped} outlier rows in '{col}'.")

    # Save cleaned file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    clean_filename = f"cleaned_{timestamp}_{dataset.filename}"
    clean_filepath = Config.UPLOAD_FOLDER / clean_filename
    df.to_csv(clean_filepath, index=False)

    # Profile cleaned dataset
    clean_file_size = clean_filepath.stat().st_size
    new_profile = profile_dataset(df, f"Cleaned: {dataset.original_name}", clean_file_size)

    # Create new Dataset record
    cleaned_dataset = Dataset(
        filename=clean_filename,
        original_name=f"Cleaned - {dataset.original_name}",
        filepath=str(clean_filepath.resolve()),
        file_size_bytes=clean_file_size,
        row_count=new_profile["row_count"],
        col_count=new_profile["col_count"],
        missing_cells_count=new_profile["missing_cells_count"],
        duplicate_rows_count=new_profile["duplicate_rows_count"],
        data_quality_score=new_profile["data_quality_score"],
        column_details_json=json.dumps(new_profile["column_details"]),
        summary_stats_json=json.dumps(new_profile["summary_stats"]),
        quality_breakdown_json=json.dumps(new_profile["quality_breakdown"]),
        is_sample=False,
        status="active"
    )
    db.add(cleaned_dataset)
    db.commit()
    db.refresh(cleaned_dataset)

    # Add insight about cleaning
    cleaning_insight = Insight(
        dataset_id=cleaned_dataset.id,
        title="Dataset Successfully Cleaned",
        explanation=f"Cleaned dataset created. Initial quality {dataset.data_quality_score}% boosted to {cleaned_dataset.data_quality_score}%. " + " ".join(actions_taken[:2]),
        category="quality",
        severity="success",
        metric_value=f"{cleaned_dataset.data_quality_score}%"
    )
    db.add(cleaning_insight)
    db.commit()

    return {
        "original_dataset_id": dataset.id,
        "cleaned_dataset_id": cleaned_dataset.id,
        "original_rows": original_rows,
        "cleaned_rows": len(df),
        "actions_taken": actions_taken,
        "new_quality_score": cleaned_dataset.data_quality_score,
        "cleaned_dataset": cleaned_dataset.to_dict()
    }
