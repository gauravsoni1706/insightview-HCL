import time
import pandas as pd
import numpy as np

def resolve_column(df: pd.DataFrame, col_name: str | None) -> str | None:
    if not col_name or col_name == "*":
        return None
    for c in df.columns:
        if c.lower() == col_name.lower():
            return c
    return None

def execute_analytics_plan(df: pd.DataFrame, plan: dict) -> dict:
    start_time = time.perf_counter()
    op = plan.get("operation", "summary")
    target_col = resolve_column(df, plan.get("target_column"))
    group_col = resolve_column(df, plan.get("group_column"))
    agg_func = plan.get("agg_func", "mean").lower()
    limit = int(plan.get("limit", 10)) if plan.get("limit") else 10
    
    numerical_results = {}
    table_data = {"columns": [], "rows": []}
    chart_config = None

    # Helper: resolve numeric columns
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()

    if op == "summary":
        desc = df.describe(include="all").T.reset_index()
        desc.rename(columns={"index": "column"}, inplace=True)
        # Clean nulls
        desc = desc.fillna("-")
        table_data = {
            "columns": desc.columns.tolist(),
            "rows": desc.to_dict(orient="records")
        }
        numerical_results = {
            "total_rows": len(df),
            "total_columns": len(df.columns),
            "numeric_columns": len(numeric_cols),
            "categorical_columns": len(categorical_cols)
        }
        # Default chart: record count by column type
        chart_config = {
            "type": "bar",
            "title": "Dataset Schema Overview",
            "xAxisKey": "type",
            "yAxisKey": "count",
            "data": [
                {"type": "Numeric Columns", "count": len(numeric_cols)},
                {"type": "Categorical Columns", "count": len(categorical_cols)},
            ]
        }

    elif op == "aggregate":
        if not target_col:
            target_col = numeric_cols[0] if numeric_cols else df.columns[0]
        
        series = pd.to_numeric(df[target_col], errors="coerce").dropna()
        if agg_func in ("mean", "avg", "average"):
            val = series.mean()
            val_label = "Average"
        elif agg_func in ("sum", "total"):
            val = series.sum()
            val_label = "Total"
        elif agg_func in ("min", "minimum"):
            val = series.min()
            val_label = "Minimum"
        elif agg_func in ("max", "maximum"):
            val = series.max()
            val_label = "Maximum"
        elif agg_func in ("median",):
            val = series.median()
            val_label = "Median"
        elif agg_func in ("std", "deviation"):
            val = series.std()
            val_label = "Standard Deviation"
        else:
            val = series.count()
            val_label = "Count"

        clean_val = round(float(val), 2) if not np.isnan(val) else 0.0
        numerical_results = {
            "metric": val_label,
            "column": target_col,
            "value": clean_val,
            "total_records": len(series)
        }
        table_data = {
            "columns": ["Metric", "Target Column", "Computed Value", "Sample Size"],
            "rows": [{
                "Metric": val_label,
                "Target Column": target_col,
                "Computed Value": clean_val,
                "Sample Size": len(series)
            }]
        }
        # Metric visualization: compare min, mean, median, max
        chart_config = {
            "type": "bar",
            "title": f"Statistical Summary of {target_col}",
            "xAxisKey": "metric",
            "yAxisKey": "value",
            "data": [
                {"metric": "Min", "value": round(float(series.min()), 2)},
                {"metric": "Average", "value": round(float(series.mean()), 2)},
                {"metric": "Median", "value": round(float(series.median()), 2)},
                {"metric": "Max", "value": round(float(series.max()), 2)}
            ]
        }

    elif op in ("group_by", "top_n", "bottom_n"):
        if not group_col:
            group_col = categorical_cols[0] if categorical_cols else df.columns[0]
        
        # Ensure target_col is distinct from group_col and numeric if possible
        if target_col and group_col and target_col.lower() == group_col.lower():
            other_nums = [c for c in numeric_cols if c.lower() != group_col.lower()]
            target_col = other_nums[0] if other_nums else None

        if not target_col:
            target_col = numeric_cols[0] if numeric_cols else None

        if target_col and target_col.lower() != group_col.lower() and target_col in numeric_cols:
            # Group by and aggregate numeric
            pandas_agg = "sum" if agg_func in ("sum", "total") else "mean"
            grouped = df.groupby(group_col, as_index=False)[target_col].agg(pandas_agg)
            val_col = f"{pandas_agg}_{target_col}"
            grouped.rename(columns={target_col: val_col}, inplace=True)
            grouped[val_col] = pd.to_numeric(grouped[val_col], errors="coerce").fillna(0).round(2)
        else:
            # Frequency count
            grouped = df[group_col].value_counts(dropna=False).reset_index()
            grouped.columns = [group_col, "count"]
            val_col = "count"

        # Sorting
        ascending = (op == "bottom_n")
        grouped = grouped.sort_values(by=val_col, ascending=ascending).head(limit)
        
        table_data = {
            "columns": grouped.columns.tolist(),
            "rows": grouped.to_dict(orient="records")
        }
        
        top_item = grouped.iloc[0].to_dict() if not grouped.empty else {}
        numerical_results = {
            "grouped_by": group_col,
            "aggregated_column": target_col or "count",
            "top_group": top_item.get(group_col),
            "top_value": top_item.get(val_col),
            "total_groups_shown": len(grouped)
        }

        # Chart type: bar or donut
        chart_type = "donut" if len(grouped) <= 5 and not ascending else "bar"
        chart_config = {
            "type": chart_type,
            "title": f"{target_col or 'Count'} by {group_col}",
            "xAxisKey": group_col,
            "yAxisKey": val_col,
            "data": [
                {group_col: str(row[group_col]), val_col: float(row[val_col])}
                for _, row in grouped.iterrows()
            ]
        }

    elif op == "trend_time_series":
        date_col = resolve_column(df, plan.get("date_column"))
        if not date_col:
            # Find date column
            for c in df.columns:
                if any(t in c.lower() for t in ["date", "time", "timestamp", "year", "month"]):
                    date_col = c
                    break
        if not date_col:
            date_col = df.columns[0]

        if not target_col:
            target_col = numeric_cols[0] if numeric_cols else None

        temp_df = df.copy()
        temp_df["parsed_dt"] = pd.to_datetime(temp_df[date_col], errors="coerce")
        temp_df = temp_df.dropna(subset=["parsed_dt"])
        temp_df = temp_df.sort_values("parsed_dt")

        # Format date for grouping or plotting
        temp_df["period"] = temp_df["parsed_dt"].dt.strftime("%Y-%m-%d")
        
        if target_col:
            agg_type = "sum" if agg_func in ("sum", "total") else "mean"
            trend = temp_df.groupby("period", as_index=False)[target_col].agg(agg_type)
            trend[target_col] = trend[target_col].round(2)
            y_col = target_col
        else:
            trend = temp_df.groupby("period", as_index=False).size()
            trend.rename(columns={"size": "count"}, inplace=True)
            y_col = "count"

        trend = trend.tail(30) # latest 30 points
        table_data = {
            "columns": trend.columns.tolist(),
            "rows": trend.to_dict(orient="records")
        }
        
        numerical_results = {
            "start_period": trend.iloc[0]["period"] if not trend.empty else None,
            "end_period": trend.iloc[-1]["period"] if not trend.empty else None,
            "total_points": len(trend),
            "target_metric": target_col or "record_count"
        }

        chart_config = {
            "type": "area",
            "title": f"Timeline Trend: {target_col or 'Count'} over Time",
            "xAxisKey": "period",
            "yAxisKey": y_col,
            "data": [
                {"period": str(r["period"]), y_col: float(r[y_col])}
                for _, r in trend.iterrows()
            ]
        }

    elif op == "correlation":
        if len(numeric_cols) < 2:
            return {
                "numerical_results": {"error": "At least 2 numeric columns required for correlation"},
                "table_data": {"columns": [], "rows": []},
                "chart_config": None,
                "execution_details": {"execution_time_ms": 0}
            }
        
        cols_to_use = numeric_cols[:8] # limit for visual clarity
        corr = df[cols_to_use].corr().round(3)
        corr_reset = corr.reset_index().rename(columns={"index": "feature"})
        
        table_data = {
            "columns": corr_reset.columns.tolist(),
            "rows": corr_reset.to_dict(orient="records")
        }

        # Find top correlation pair
        pairs = []
        for i in range(len(cols_to_use)):
            for j in range(i + 1, len(cols_to_use)):
                val = corr.iloc[i, j]
                if not np.isnan(val):
                    pairs.append({
                        "col1": cols_to_use[i],
                        "col2": cols_to_use[j],
                        "correlation": float(val),
                        "abs_val": abs(float(val))
                    })
        pairs.sort(key=lambda x: x["abs_val"], reverse=True)
        top_pair = pairs[0] if pairs else {}

        numerical_results = {
            "top_pair": f"{top_pair.get('col1')} & {top_pair.get('col2')}",
            "highest_r": top_pair.get("correlation"),
            "features_analyzed": len(cols_to_use)
        }

        # Heatmap / correlation bar visualization
        chart_config = {
            "type": "bar",
            "title": "Strongest Feature Correlations (Pearson r)",
            "xAxisKey": "pair",
            "yAxisKey": "correlation",
            "data": [
                {"pair": f"{p['col1'][:8]} & {p['col2'][:8]}", "correlation": p["correlation"]}
                for p in pairs[:6]
            ]
        }

    elif op == "distribution":
        if not target_col:
            target_col = numeric_cols[0] if numeric_cols else df.columns[0]

        series = pd.to_numeric(df[target_col], errors="coerce").dropna()
        counts, bin_edges = np.histogram(series, bins=10)
        dist_data = []
        for i in range(len(counts)):
            label = f"{round(bin_edges[i], 1)} - {round(bin_edges[i+1], 1)}"
            dist_data.append({"bin": label, "frequency": int(counts[i])})

        table_data = {
            "columns": ["Bin Range", "Frequency"],
            "rows": [{"Bin Range": d["bin"], "Frequency": d["frequency"]} for d in dist_data]
        }
        numerical_results = {
            "column": target_col,
            "mean": round(float(series.mean()), 2),
            "std": round(float(series.std()), 2),
            "skewness": round(float(series.skew()), 2) if len(series) > 2 else 0.0
        }
        chart_config = {
            "type": "bar",
            "title": f"Frequency Distribution: {target_col}",
            "xAxisKey": "bin",
            "yAxisKey": "frequency",
            "data": dist_data
        }

    elif op == "outliers":
        if not target_col:
            target_col = numeric_cols[0] if numeric_cols else None
        
        if not target_col:
            return {"numerical_results": {"error": "Numeric column required for outlier detection"}, "table_data": {"columns": [], "rows": []}, "chart_config": None, "execution_details": {"execution_time_ms": 0}}

        s = pd.to_numeric(df[target_col], errors="coerce").dropna()
        q1 = float(s.quantile(0.25))
        q3 = float(s.quantile(0.75))
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr

        outlier_rows = df[(df[target_col] < lower_bound) | (df[target_col] > upper_bound)]
        outlier_count = len(outlier_rows)

        numerical_results = {
            "target_column": target_col,
            "outlier_count": outlier_count,
            "outlier_percentage": round((outlier_count / len(df)) * 100, 2) if len(df) > 0 else 0,
            "lower_threshold": round(lower_bound, 2),
            "upper_threshold": round(upper_bound, 2),
            "q1": round(q1, 2),
            "median": round(float(s.median()), 2),
            "q3": round(q3, 2)
        }

        table_data = {
            "columns": outlier_rows.columns.tolist()[:8],
            "rows": outlier_rows.head(20).fillna("-").to_dict(orient="records")
        }

        chart_config = {
            "type": "bar",
            "title": f"IQR Outlier Thresholds for {target_col}",
            "xAxisKey": "boundary",
            "yAxisKey": "value",
            "data": [
                {"boundary": "Lower Bound", "value": round(lower_bound, 2)},
                {"boundary": "Q1 (25%)", "value": round(q1, 2)},
                {"boundary": "Median (50%)", "value": round(float(s.median()), 2)},
                {"boundary": "Q3 (75%)", "value": round(q3, 2)},
                {"boundary": "Upper Bound", "value": round(upper_bound, 2)}
            ]
        }

    elif op == "missing_values":
        null_counts = df.isna().sum().reset_index()
        null_counts.columns = ["column", "missing_count"]
        null_counts["percentage"] = (null_counts["missing_count"] / len(df) * 100).round(2)
        null_counts = null_counts.sort_values("missing_count", ascending=False)

        table_data = {
            "columns": null_counts.columns.tolist(),
            "rows": null_counts.to_dict(orient="records")
        }
        total_missing = int(null_counts["missing_count"].sum())
        numerical_results = {
            "total_missing_cells": total_missing,
            "columns_with_missing": int((null_counts["missing_count"] > 0).sum()),
            "total_columns": len(df.columns)
        }
        chart_config = {
            "type": "bar",
            "title": "Missing Values by Column",
            "xAxisKey": "column",
            "yAxisKey": "missing_count",
            "data": [
                {"column": str(r["column"]), "missing_count": int(r["missing_count"])}
                for _, r in null_counts.head(10).iterrows()
            ]
        }

    else:
        # Default fallback: top rows preview
        table_data = {
            "columns": df.columns.tolist(),
            "rows": df.head(limit).fillna("-").to_dict(orient="records")
        }
        numerical_results = {"total_rows": len(df), "displayed": min(limit, len(df))}

    exec_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
    return {
        "operation": op,
        "numerical_results": numerical_results,
        "table_data": table_data,
        "chart_config": chart_config,
        "execution_details": {
            "plan": plan,
            "execution_time_ms": exec_time_ms,
            "rows_processed": len(df)
        }
    }
