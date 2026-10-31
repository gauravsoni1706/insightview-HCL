import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import {
  ShieldCheck,
  AlertTriangle,
  Copy,
  TrendingUp,
  Database,
  ArrowRight,
  Info,
  CheckCircle,
  AlertOctagon,
  Sparkles
} from 'lucide-react';

export default function BottomSection({
  dataset,
  insights,
  datasets,
  onSelectDataset,
  onViewAllDatasets,
  onOpenAnalysis,
}) {
  // Quality breakdown for Donut Chart
  const breakdown = dataset?.quality_breakdown || {
    complete_records: 18,
    missing_records: 2,
    duplicate_records: 0,
    complete_percentage: 90,
    missing_percentage: 10,
    duplicate_percentage: 0,
  };

  const donutData = [
    {
      name: 'Complete Records',
      value: breakdown.complete_records || 0,
      percentage: breakdown.complete_percentage || 0,
      color: '#42B994', // Success green
    },
    {
      name: 'With Missing Values',
      value: breakdown.missing_records || 0,
      percentage: breakdown.missing_percentage || 0,
      color: '#F4B65E', // Warning orange
    },
    {
      name: 'Duplicate Records',
      value: breakdown.duplicate_records || 0,
      percentage: breakdown.duplicate_percentage || 0,
      color: '#F07882', // Danger red
    },
  ];

  // Helper for insight icon & color
  const getSeverityBadge = (severity, category) => {
    switch (severity) {
      case 'success':
        return {
          icon: CheckCircle,
          color: 'text-successGreen',
          bg: 'bg-[#ECFDF5]',
          border: 'border-[#A7F3D0]',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-warningOrange',
          bg: 'bg-[#FFF7ED]',
          border: 'border-[#FED7AA]',
        };
      case 'danger':
        return {
          icon: AlertOctagon,
          color: 'text-dangerRed',
          bg: 'bg-[#FEF2F2]',
          border: 'border-[#FECACA]',
        };
      default:
        return {
          icon: Info,
          color: 'text-primaryBlue',
          bg: 'bg-lightBlue',
          border: 'border-[#BFDBFE]',
        };
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Recent';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* CARD A — DATA QUALITY OVERVIEW (4 cols out of 12) */}
      <div className="lg:col-span-4 bg-card border border-borderGrey rounded-card p-5 shadow-subtle flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[15px] font-semibold text-primaryText">Data Quality Overview</h3>
            <span className="text-[11px] font-bold text-successGreen bg-[#ECFDF5] px-2 py-0.5 rounded-full">
              {dataset?.data_quality_score || 100}% Health
            </span>
          </div>
          <p className="text-[12px] text-secondaryText mb-2">Integrity scan across all rows and cells</p>

          {/* Donut Chart */}
          <div className="h-44 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  innerRadius={48}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border border-borderGrey p-2 rounded-xl shadow-lg text-[11px]">
                          <div className="font-semibold text-primaryText">{data.name}</div>
                          <div className="text-secondaryText">
                            {data.value} records ({data.percentage}%)
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[18px] font-bold text-primaryText leading-none">
                {dataset?.row_count || 0}
              </span>
              <span className="text-[10px] text-secondaryText mt-0.5">Records</span>
            </div>
          </div>

          {/* Legend with percentages */}
          <div className="space-y-2 pt-2 border-t border-borderGrey text-[12px]">
            {donutData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></span>
                  <span className="text-secondaryText text-[12px]">{item.name}</span>
                </div>
                <div className="font-semibold text-primaryText text-[12px]">
                  {item.value} <span className="text-[11px] font-normal text-secondaryText">({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CARD B — RECENT AI INSIGHTS (5 cols out of 12) */}
      <div className="lg:col-span-5 bg-card border border-borderGrey rounded-card p-5 shadow-subtle flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[15px] font-semibold text-primaryText flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primaryBlue" />
              <span>Recent AI Insights</span>
            </h3>
            <span className="text-[11px] text-secondaryText bg-background px-2 py-0.5 rounded-md">
              Dynamic EDA
            </span>
          </div>
          <p className="text-[12px] text-secondaryText mb-3">Calculated patterns, correlations, and anomalies</p>

          <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
            {insights && insights.length > 0 ? (
              insights.map((insight) => {
                const badge = getSeverityBadge(insight.severity, insight.category);
                const Icon = badge.icon;
                return (
                  <div
                    key={insight.id}
                    className="p-3 bg-[#F8FAFC] border border-borderGrey rounded-xl hover:border-primaryBlue transition-all text-left"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`w-7 h-7 rounded-lg ${badge.bg} ${badge.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-[13px] font-semibold text-primaryText truncate">
                            {insight.title}
                          </h4>
                          <span className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${badge.bg} ${badge.color}`}>
                            {insight.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-secondaryText leading-relaxed mt-0.5 line-clamp-2">
                          {insight.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-secondaryText text-[12px]">
                No insights discovered yet. Ask questions in the Analysis tab!
              </div>
            )}
          </div>
        </div>

        <div className="pt-3">
          <button
            onClick={onOpenAnalysis}
            className="w-full flex items-center justify-center gap-2 text-primaryBlue hover:text-blue-700 text-[12px] font-medium transition-colors"
          >
            <span>Ask AI more questions about this data</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* CARD C — RECENT DATASETS (3 cols out of 12) */}
      <div className="lg:col-span-3 bg-card border border-borderGrey rounded-card p-5 shadow-subtle flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[15px] font-semibold text-primaryText">Recent Datasets</h3>
            <button
              onClick={onViewAllDatasets}
              className="text-[11px] font-semibold text-primaryBlue hover:underline"
            >
              View All
            </button>
          </div>
          <p className="text-[12px] text-secondaryText mb-3">Stored catalog & versions</p>

          <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
            {datasets && datasets.length > 0 ? (
              datasets.slice(0, 5).map((d) => {
                const isSelected = dataset?.id === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => onSelectDataset(d)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-primaryBlue bg-lightBlue/30'
                        : 'border-borderGrey bg-[#F8FAFC] hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-7 h-7 rounded-lg bg-white border border-borderGrey flex items-center justify-center text-primaryBlue flex-shrink-0">
                        <Database className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="text-[12px] font-semibold text-primaryText truncate">
                          {d.original_name}
                        </div>
                        <div className="text-[10px] text-secondaryText">
                          {d.row_count?.toLocaleString()} rows • {formatDate(d.created_at)}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        isSelected ? 'bg-primaryBlue ring-2 ring-blue-200' : 'bg-gray-300'
                      }`}
                    ></span>
                  </button>
                );
              })
            ) : (
              <div className="text-secondaryText text-[12px] py-4 text-center">
                No datasets uploaded yet
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onViewAllDatasets}
          className="mt-3 w-full py-2 rounded-xl border border-borderGrey bg-white hover:bg-background text-[12px] font-medium text-secondaryText hover:text-primaryText transition-colors flex items-center justify-center gap-1.5"
        >
          <span>Manage Datasets</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
