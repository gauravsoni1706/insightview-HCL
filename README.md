# InsightFlow AI — Conversational Data Analysis Assistant

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18%2B-61DAFB.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5%2B-646CFF.svg)](https://vitejs.dev/)
[![Flask](https://img.shields.io/badge/Flask-3.1%2B-black.svg)](https://flask.palletsprojects.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4%2B-38B2AC.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**InsightFlow AI** is a commercial-grade, full-stack conversational data analysis SaaS web application. It empowers stakeholders, analysts, and business users to ingest raw CSV datasets, inspect data hygiene and health scores, query datasets in plain English, and receive dynamically rendered visualizations, data tables, and AI-powered business insights.

---

## 🎨 Design System & Visual Architecture

InsightFlow AI's user interface is modeled after a light-themed, professional commercial analytics dashboard:

| Design Element | Specification |
| :--- | :--- |
| **Main Background** | `#F3F5F9` |
| **Sidebar & Cards** | `#FFFFFF` |
| **Primary Text** | `#20232B` |
| **Secondary Text** | `#858B98` |
| **Primary Blue** | `#465CF5` |
| **Light Blue Accent**| `#E9EDFF` |
| **Borders** | `#EAECF0` |
| **Success Green** | `#42B994` |
| **Warning Orange** | `#F4B65E` |
| **Danger Red** | `#F07882` |
| **Border Radius** | `12px – 18px` |
| **Typography** | Inter (Metric: 32px, Headings: 26px, Cards: 15px, Body: 12–13px) |

---

## 🚀 Key Features

1. **Light-Themed SaaS Dashboard**
   - **Fixed Sidebar (215px):** App logo, Workspace navigation, General settings, and bottom informational card (*"Your data, understood."*).
   - **Top Navigation Bar (65px):** Global search, active dataset switcher, notification badges, help shortcuts, and user profile avatar.
   - **4 Dynamic Metric Cards:** Total Records, Total Columns, Missing Values (with warning indicators), and Data Quality Score (%) with real SVG sparklines.
   - **Middle Dashboard Layout:**
     - **Card A (Dataset Analytics):** Weekly query execution frequency bar chart.
     - **Card B (AI Analysis Activity):** Questions asked, analyses performed, average analysis time, and circular health progress ring.
     - **Card C (Current Dataset):** Active dataset metadata, dimensions, and quick inspection trigger.
   - **Bottom Dashboard Layout:**
     - **Card A (Data Quality Overview):** Recharts donut chart detailing Complete Records, Missing Value Rows, and Duplicate Records.
     - **Card B (Recent AI Insights):** Algorithmic discovery stream with severity badges (`info`, `success`, `warning`, `danger`) and category tags (`trend`, `distribution`, `quality`, `correlation`, `anomaly`).
     - **Card C (Recent Datasets):** Vertical historical ingestion log with status indicators.

2. **3-Panel BI Analysis Workspace (`Analyze Data`)**
   - **Conversational Query Panel (Left):** Real-time conversational thread, session history, schema-aware suggested query chips, and query input.
   - **Analysis Canvas (Center):** Interactive Recharts visualizations (Bar, Line, Area, Donut, Histograms), numerical KPI pills, multi-column data tables, and strict JSON execution plan inspections.
   - **Dataset Inspector (Right):** Collapsible schema inspector detailing data types, missing counts, unique cardinalities, and numerical summaries.

3. **Data Cleaning Assistant**
   - Missing value imputation: Mean, Median, Mode, Zero, or Row Dropping.
   - Deduplication: Instant identification and removal of duplicate rows.
   - Outlier Treatment: Statistical Interquartile Range (IQR) bounding, clipping, or pruning.
   - Generates a new clean dataset version with updated data quality certifications.

4. **Executive PDF Reports & CSV Exports**
   - Built with **ReportLab 5.1**, generating branded multi-page PDF analysis briefs with KPI summaries, discovery lists, and schema profiles.
   - One-click downloads for cleaned or raw CSV files.

5. **Zero-Hallucination Dual-Mode AI Engine**
   - **Deterministic NLP Engine:** High-performance heuristic & regex parser operating 100% locally with zero external API dependencies.
   - **Google Gemini & OpenAI Integration:** Seamlessly enabled by providing an API key in the UI settings or `.env`.

---

## 📂 Project Directory Structure

```text
insightflow-ai/
├── backend/
│   ├── app.py                      # Flask application factory & frontend static server
│   ├── config.py                   # Centralized application configuration
│   ├── .env.example                # Environment variable template
│   ├── requirements.txt            # Python dependencies
│   ├── models/
│   │   └── database.py             # SQLAlchemy models (Dataset, Conversation, Message, Insight, etc.)
│   ├── routes/
│   │   ├── upload.py               # CSV upload & sample dataset ingestion
│   │   ├── datasets.py             # Dataset management, preview & comparison
│   │   ├── analytics.py            # Direct analytics & weekly activity tracking
│   │   ├── chat.py                 # Conversational Q&A endpoint
│   │   ├── insights.py             # Dynamic AI insight discovery
│   │   └── export.py               # Data cleaning & ReportLab PDF report generation
│   ├── services/
│   │   ├── dataset_service.py      # Automated profiling & EDA calculation
│   │   ├── analytics_service.py    # Controlled deterministic Pandas execution engine
│   │   ├── cleaning_service.py     # Imputation, deduplication & outlier clipping
│   │   └── llm_service.py          # Gemini, OpenAI & Deterministic NLP planner
│   ├── utils/
│   │   ├── validators.py           # Delimiter sniffing, encoding detection & plan validation
│   │   └── security.py             # Filename & column name sanitization
│   ├── uploads/                    # Ingested and cleaned datasets
│   └── sample_data/                # Bundled enterprise sample CSVs
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js              # Vite dev server with proxy to backend
│   ├── tailwind.config.js          # Design system color palette and styling
│   ├── index.html
│   └── src/
│       ├── App.jsx                 # Workspace controller and modal orchestration
│       ├── index.css               # Tailwind directives and custom scrollbars
│       ├── components/
│       │   ├── Sidebar.jsx         # 215px fixed sidebar navigation
│       │   ├── TopNavbar.jsx       # 65px compact navigation bar & dataset switcher
│       │   ├── MetricCards.jsx     # Top 4 dynamic KPI cards with sparklines
│       │   ├── AnalyticsSection.jsx# Weekly bar chart & circular progress card
│       │   ├── BottomSection.jsx   # Data Quality Donut, AI Insights & Recent Datasets
│       │   ├── DatasetUploadModal.jsx # Drag-and-drop CSV uploader
│       │   ├── DataCleaningModal.jsx  # Interactive data cleaning assistant
│       │   └── DatasetComparisonModal.jsx # Side-by-side dataset comparator
│       ├── pages/
│       │   ├── Dashboard.jsx       # Main dashboard layout
│       │   ├── AnalyzeData.jsx     # 3-panel BI conversational analysis workspace
│       │   ├── MyDatasets.jsx      # Dataset catalog, raw table preview & operations
│       │   ├── AIInsights.jsx      # Categorized algorithmic insight board
│       │   ├── Reports.jsx         # Executive report generator & audit log
│       │   ├── Settings.jsx        # LLM engine switcher & API key configuration
│       │   └── Help.jsx            # Natural language query examples & documentation
│       └── services/
│           └── api.js              # Axios REST API client
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env

# Run the backend server (starts on http://localhost:5000)
python app.py
```
*Note: On first startup, the database is automatically seeded with sample datasets and activity logs.*

### 3. Frontend Setup
```bash
cd frontend
npm install

# Start Vite development server with hot module reloading
npm run dev
```
Open **`http://localhost:5173`** in your browser.

*(Alternatively, run `npm run build` in the frontend directory; the Flask backend on `http://localhost:5000` will serve the built production app automatically!)*

---

## 💬 Sample Queries to Try in Analyze Data

- *"What is the average Unit_Price?"*
- *"Which Product has the highest revenue?"*
- *"Show monthly revenue trends."*
- *"Find the top 5 products by quantity."*
- *"Identify missing values across all columns."*
- *"Find correlations between numeric columns."*
- *"Detect outliers in Customer_Age."*
- *"Compare sales by Region."*
- *"Generate a complete dataset summary."*
