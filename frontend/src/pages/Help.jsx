import React from 'react';
import { HelpCircle, CheckCircle, ShieldCheck, MessageSquare, Terminal, Sparkles, Database } from 'lucide-react';

export default function Help({ onSwitchToAnalyze }) {
  const sampleQueries = [
    { q: 'What is the average sales value?', desc: 'Computes exact aggregate mean over numeric metrics.' },
    { q: 'Which product has the highest revenue?', desc: 'Groups by product, ranks total revenue, and picks the leader.' },
    { q: 'Show monthly sales trends.', desc: 'Parses timestamps into periodic buckets and plots an area/line timeline.' },
    { q: 'Find the top 5 customers.', desc: 'Ranks top 5 records by order volume or spending.' },
    { q: 'Identify missing values across all columns.', desc: 'Scans every cell for nulls and renders a column-level breakdown.' },
    { q: 'Find correlations between numeric columns.', desc: 'Generates a Pearson correlation matrix with top pairs.' },
    { q: 'Detect outliers in Customer_Age.', desc: 'Executes IQR boundary screening and isolates anomalies.' },
    { q: 'Compare sales between regions.', desc: 'Groups sales totals by regional territories.' },
    { q: 'Generate a complete dataset summary.', desc: 'Computes standard deviations, min, max, and quantiles.' },
    { q: 'What are the most important insights?', desc: 'Synthesizes auto-EDA discoveries into concise takeaways.' },
  ];

  return (
    <div className="max-w-4xl space-y-6 text-left">
      <div>
        <h1 className="text-[26px] font-bold text-primaryText tracking-tight">
          Help & User Documentation
        </h1>
        <p className="text-[13px] text-secondaryText mt-0.5">
          Everything you need to know about conversational data analysis, data cleaning, and BI reports.
        </p>
      </div>

      {/* Core Principle Banner */}
      <div className="bg-white border border-borderGrey rounded-card p-5 shadow-subtle flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-lightBlue text-primaryBlue flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-[15px] font-bold text-primaryText">The Zero-Hallucination AI Guarantee</h3>
          <p className="text-[12px] text-secondaryText leading-relaxed mt-1">
            Unlike generic LLM wrappers that guess numbers, InsightFlow AI cleanly separates
            <b> natural language understanding</b> from <b>deterministic computation</b>. The LLM or deterministic NLP engine generates an execution plan, which is strictly validated against the active dataset schema and executed by Pandas.
            The results are 100% mathematically exact.
          </p>
        </div>
      </div>

      {/* Supported Queries Grid */}
      <div className="bg-white border border-borderGrey rounded-card p-5 shadow-subtle space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primaryBlue" />
          <h3 className="text-[15px] font-bold text-primaryText">Supported Query Examples</h3>
        </div>
        <p className="text-[12px] text-secondaryText">
          Click any example below to jump into the analysis workspace and run it:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sampleQueries.map((item, idx) => (
            <div
              key={idx}
              onClick={() => onSwitchToAnalyze && onSwitchToAnalyze(item.q)}
              className="p-3 bg-[#F8FAFC] border border-borderGrey hover:border-primaryBlue rounded-xl cursor-pointer transition-all hover:bg-white text-left"
            >
              <div className="text-[13px] font-semibold text-primaryBlue">"{item.q}"</div>
              <div className="text-[11px] text-secondaryText mt-1">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow Step-by-Step */}
      <div className="bg-white border border-borderGrey rounded-card p-5 shadow-subtle space-y-4">
        <h3 className="text-[15px] font-bold text-primaryText">System Pipeline Workflow</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px]">
          <div className="p-3 bg-[#F8FAFC] border border-borderGrey rounded-xl">
            <div className="font-bold text-primaryBlue mb-1">1. Ingest & Profile</div>
            <p className="text-secondaryText leading-relaxed">
              Upload any CSV. The system sniffs delimiters, verifies UTF-8/Latin1 encodings, calculates data quality, and flags missing cells.
            </p>
          </div>

          <div className="p-3 bg-[#F8FAFC] border border-borderGrey rounded-xl">
            <div className="font-bold text-primaryBlue mb-1">2. Clean & Normalize</div>
            <p className="text-secondaryText leading-relaxed">
              Launch the Data Cleaning Assistant to impute missing values (mean, median, mode), deduplicate rows, and clip IQR outliers.
            </p>
          </div>

          <div className="p-3 bg-[#F8FAFC] border border-borderGrey rounded-xl">
            <div className="font-bold text-primaryBlue mb-1">3. Query & Visualize</div>
            <p className="text-secondaryText leading-relaxed">
              Ask questions in plain conversational English. Receive real-time charts (bar, line, donut, area), tabular exports, and certified PDF reports.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Documented supported operations and schema validation rules */
