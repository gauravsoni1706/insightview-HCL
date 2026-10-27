import os
import json
import re
from config import Config

def find_best_matching_column(query: str, columns: list[str]) -> str | None:
    query_lower = query.lower()
    # 1. Exact match
    for col in columns:
        if col.lower() in query_lower:
            return col
            
    # 2. Token overlap or subwords (e.g. "sales" -> "Total_Revenue" or "sales")
    synonyms = {
        "revenue": ["sales", "revenue", "income", "amount", "price"],
        "sales": ["revenue", "sales", "orders", "total"],
        "product": ["item", "product", "goods", "sku"],
        "customer": ["client", "user", "buyer", "customer"],
        "age": ["age", "years", "dob"],
        "date": ["time", "day", "month", "year", "date", "period"],
        "region": ["area", "city", "state", "country", "territory", "region"],
        "price": ["cost", "unit_price", "rate", "fee"],
        "quantity": ["qty", "count", "volume", "units"]
    }
    
    for concept, words in synonyms.items():
        if any(w in query_lower for w in words):
            for col in columns:
                if any(w in col.lower() for w in words):
                    return col

    return None

def deterministic_parse_question(question: str, columns: list[str]) -> dict:
    q = question.lower()
    
    # 1. Summary
    if any(k in q for k in ["summary", "overview", "describe", "profile", "stats", "dataset info"]):
        return {
            "operation": "summary",
            "explanation_prompt": "Provide a complete statistical summary of the dataset."
        }
        
    # 2. Missing values
    if any(k in q for k in ["missing", "null", "nan", "blank", "empty"]):
        return {
            "operation": "missing_values",
            "explanation_prompt": "Report missing cells across all columns."
        }
        
    # 3. Correlation
    if any(k in q for k in ["correlation", "correlate", "relationship", "relation", "dependency"]):
        return {
            "operation": "correlation",
            "explanation_prompt": "Analyze correlations between numerical columns."
        }
        
    # 4. Outliers
    if any(k in q for k in ["outlier", "anomaly", "abnormal", "extreme", "deviant"]):
        target = find_best_matching_column(q, columns)
        return {
            "operation": "outliers",
            "target_column": target,
            "explanation_prompt": f"Detect statistical outliers in {target} using IQR."
        }
        
    # 5. Trend / Time Series
    if any(k in q for k in ["trend", "over time", "monthly", "yearly", "daily", "timeline", "by month", "by date"]):
        target = find_best_matching_column(q, columns)
        return {
            "operation": "trend_time_series",
            "target_column": target,
            "agg_func": "sum" if any(k in q for k in ["sum", "total", "revenue", "sales"]) else "mean",
            "explanation_prompt": f"Show timeline trend of {target}."
        }
        
    # 6. Distribution / Histogram
    if any(k in q for k in ["distribution", "histogram", "spread", "frequency", "density"]):
        target = find_best_matching_column(q, columns)
        return {
            "operation": "distribution",
            "target_column": target,
            "explanation_prompt": f"Show distribution of {target}."
        }
        
    # 7. Top N / Bottom N / Group By
    is_top = any(k in q for k in ["top", "highest", "most", "best", "greatest", "max"])
    is_bottom = any(k in q for k in ["bottom", "lowest", "least", "worst", "min"])
    
    limit_match = re.search(r'\b(top|bottom)\s+(\d+)\b', q)
    limit = int(limit_match.group(2)) if limit_match else 5
    
    # Priority for metric/target column: look for metric keywords first
    metric_keywords = ["revenue", "sales", "price", "profit", "cost", "quantity", "age", "score", "salary", "compensation"]
    target = None
    for mk in metric_keywords:
        if mk in q:
            # find matching col in columns
            for col in columns:
                if mk in col.lower():
                    target = col
                    break
            if target:
                break
                
    if not target:
        target = find_best_matching_column(q, columns)
    
    # Identify group column (distinct from target)
    group = None
    group_keywords = ["product", "category", "region", "customer", "department", "segment", "country", "city", "state", "brand", "gender"]
    for gk in group_keywords:
        if gk in q:
            for col in columns:
                if gk in col.lower() and col != target:
                    group = col
                    break
            if group:
                break

    if not group:
        for col in columns:
            if col.lower() in q and col != target:
                group = col
                break
            
    if not group:
        # Check standard category keywords in columns
        for col in columns:
            if any(term in col.lower() for term in ["category", "product", "region", "department", "segment", "country", "city"]) and col != target:
                group = col
                break

    if is_top or is_bottom:
        return {
            "operation": "bottom_n" if is_bottom else "top_n",
            "group_column": group,
            "target_column": target,
            "agg_func": "sum" if any(k in q for k in ["sum", "total", "revenue", "sales"]) else "mean",
            "limit": limit,
            "explanation_prompt": f"Identify the {'lowest' if is_bottom else 'highest'} {limit} records by {target}."
        }
        
    # 8. Aggregate (Average, Sum, etc.)
    if any(k in q for k in ["average", "avg", "mean", "sum", "total", "median", "std"]):
        agg = "mean"
        if any(k in q for k in ["sum", "total"]):
            agg = "sum"
        elif "median" in q:
            agg = "median"
        elif "std" in q or "deviation" in q:
            agg = "std"
            
        return {
            "operation": "aggregate",
            "target_column": target,
            "agg_func": agg,
            "explanation_prompt": f"Calculate the {agg} for {target}."
        }
        
    # 9. Group By (e.g. "compare sales between regions", "sales by category")
    if any(k in q for k in ["by ", "per ", "compare", "breakdown"]):
        return {
            "operation": "group_by",
            "group_column": group,
            "target_column": target,
            "agg_func": "sum" if any(k in q for k in ["sum", "total", "revenue", "sales"]) else "mean",
            "limit": 10,
            "explanation_prompt": f"Group and compare {target} by {group}."
        }

    # Default
    return {
        "operation": "summary",
        "target_column": target,
        "explanation_prompt": f"Analyze query: {question}"
    }

def call_gemini_for_plan(question: str, columns: list[str], sample_data: list[dict], api_key: str) -> dict:
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        
        prompt = f"""
You are an expert data analysis query planner. 
Convert the user's natural language question into a strict JSON execution plan.

Dataset Available Columns: {json.dumps(columns)}
Sample Rows: {json.dumps(sample_data[:2])}

User Question: "{question}"

Rules:
1. Valid operations: "summary", "aggregate", "group_by", "top_n", "bottom_n", "trend_time_series", "correlation", "distribution", "outliers", "missing_values"
2. Only pick columns that actually exist in the available columns list.
3. Return strictly valid JSON with no markdown formatting or backticks.

Expected JSON schema:
{{
  "operation": "string",
  "target_column": "string or null",
  "group_column": "string or null",
  "agg_func": "mean | sum | count | min | max | median",
  "limit": 5 or 10,
  "explanation_prompt": "short explanation of user goal"
}}
"""
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        text = response.text.strip()
        # Clean markdown code blocks if any
        if text.startswith("```"):
            text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
            text = re.sub(r"\n?```$", "", text)
        return json.loads(text.strip())
    except Exception as e:
        print(f"Gemini plan generation error: {e}")
        return deterministic_parse_question(question, columns)

def call_openai_for_plan(question: str, columns: list[str], sample_data: list[dict], api_key: str) -> dict:
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        system_prompt = (
            "You are a strict data analysis query planner. Available columns: " 
            + json.dumps(columns) 
            + ". Output strict JSON with keys: operation, target_column, group_column, agg_func, limit."
        )
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"User question: {question}"}
            ]
        )
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        print(f"OpenAI plan generation error: {e}")
        return deterministic_parse_question(question, columns)

def parse_nl_query(question: str, columns: list[str], sample_data: list[dict] = None) -> dict:
    gemini_key = os.getenv("GEMINI_API_KEY") or Config.GEMINI_API_KEY
    openai_key = os.getenv("OPENAI_API_KEY") or Config.OPENAI_API_KEY

    if gemini_key:
        return call_gemini_for_plan(question, columns, sample_data or [], gemini_key)
    elif openai_key:
        return call_openai_for_plan(question, columns, sample_data or [], openai_key)
    else:
        return deterministic_parse_question(question, columns)

def generate_business_explanation(question: str, plan: dict, results: dict) -> str:
    gemini_key = os.getenv("GEMINI_API_KEY") or Config.GEMINI_API_KEY
    openai_key = os.getenv("OPENAI_API_KEY") or Config.OPENAI_API_KEY

    # If LLM API available, prompt it for a concise, polished 2-sentence executive summary
    if gemini_key:
        try:
            from google import genai
            client = genai.Client(api_key=gemini_key)
            prompt = f"""
As InsightFlow AI, write a concise, professional, 2-3 sentence business data analysis takeaway answering the user's question.
Question: "{question}"
Executed Operation: {plan.get('operation')}
Exact Calculated Numerical Results: {json.dumps(results.get('numerical_results', {}))}

Rules:
- Be factual and reference only the calculated numbers above.
- Never hallucinate data.
- Maintain a polished SaaS tone.
"""
            resp = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            return resp.text.strip()
        except Exception:
            pass

    # Deterministic high-quality explanation generator
    op = plan.get("operation")
    nr = results.get("numerical_results", {})
    
    if op == "aggregate":
        metric = nr.get("metric", "Average")
        col = nr.get("column", "Metric")
        val = nr.get("value")
        return f"The computed {metric.lower()} for **{col}** is **{val:,}** across {nr.get('total_records', 0)} analyzed records. This provides a baseline benchmark for evaluating variance across other dimensions."
        
    elif op in ("group_by", "top_n", "bottom_n"):
        top_grp = nr.get("top_group")
        top_val = nr.get("top_value")
        grp_col = nr.get("grouped_by")
        agg_col = nr.get("aggregated_column")
        if top_grp is not None and top_val is not None:
            return f"Analyzing **{agg_col}** partitioned by **{grp_col}** reveals that **{top_grp}** leads with a value of **{top_val:,}**. The accompanying chart illustrates the distribution across all ranked segments."
        return f"Grouped aggregation on **{grp_col}** successfully calculated across {nr.get('total_groups_shown', 0)} distinct segments."

    elif op == "trend_time_series":
        return f"Historical time-series trend analysis spanning from **{nr.get('start_period')}** to **{nr.get('end_period')}** shows ongoing momentum across {nr.get('total_points')} intervals for **{nr.get('target_metric')}**."

    elif op == "correlation":
        top_pair = nr.get("top_pair")
        r_val = nr.get("highest_r")
        return f"Feature correlation evaluation across {nr.get('features_analyzed')} numeric attributes identified **{top_pair}** as having the strongest correlation with a coefficient of **r = {r_val}**."

    elif op == "outliers":
        count = nr.get("outlier_count", 0)
        pct = nr.get("outlier_percentage", 0)
        col = nr.get("target_column")
        return f"Interquartile Range (IQR) screening identified **{count}** outliers ({pct}% of rows) in **{col}** lying outside thresholds [{nr.get('lower_threshold')}, {nr.get('upper_threshold')}]."

    elif op == "missing_values":
        total_miss = nr.get("total_missing_cells", 0)
        cols_miss = nr.get("columns_with_missing", 0)
        return f"Dataset integrity scan detected **{total_miss}** null cells distributed across **{cols_miss}** out of {nr.get('total_columns')} columns."

    elif op == "distribution":
        col = nr.get("column")
        return f"Distribution analysis for **{col}** indicates a mean of **{nr.get('mean')}** and standard deviation of **{nr.get('std')}**, exhibiting a skewness coefficient of **{nr.get('skewness')}**."

    return f"Completed comprehensive exploratory analysis on the active dataset with {nr.get('total_rows', 'all')} records processed."

# Extended business vocabulary mappings for retail, finance, and hr analytics
