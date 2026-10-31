import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { FileText, Eye, CheckCircle2, Clock, HelpCircle, Activity } from 'lucide-react';

export default function AnalyticsSection({
  dataset,
  activityMetrics,
  onViewDataset,
}) {
  const weeklyData = activityMetrics?.weekly_activity || [
    { day: 'Mon', analyses: 2 },
    { day: 'Tue', analyses: 1 },
    { day: 'Wed', analyses: 2 },
    { day: 'Thu', analyses: 1 },
    { day: 'Fri', analyses: 2 },
    { day: 'Sat', analyses: 1 },
    { day: 'Sun', analyses: 1 },
  ];

  const totalQuestions = activityMetrics?.total_questions_asked || 0;
  const totalAnalyses = activityMetrics?.total_analyses_performed || 0;
  const avgTimeMs = activityMetrics?.average_analysis_time_ms || 120;
  const progressPct = activityMetrics?.activity_progress_pct || 65;

  // Format file size
  const formatSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Format upload date
  const formatDate = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  // Circular progress SVG constants
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* CARD A: Dataset Analytics (~40% = 5 cols out of 12) */}
      <div className="lg:col-span-5 bg-card border border-borderGrey rounded-card p-5 shadow-subtle flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[15px] font-semibold text-primaryText">Dataset Analytics</h3>
            <p className="text-[12px] text-secondaryText">Weekly query and analytics execution frequency</p>
          </div>
          <span className="text-[11px] bg-lightBlue text-primaryBlue px-2 py-0.5 rounded-full font-medium">
            Active
          </span>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F2F5" />
              <XAxis dataKey="day" stroke="#858B98" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#858B98" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #EAECF0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="analyses" fill="#465CF5" radius={[4, 4, 0, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CARD B: AI Analysis Activity (~30% = 3.5 cols, say 3 or 4 cols) */}
      <div className="lg:col-span-3 bg-card border border-borderGrey rounded-card p-5 shadow-subtle flex flex-col justify-between">
        <div>
          <h3 className="text-[15px] font-semibold text-primaryText mb-1">AI Analysis Activity</h3>
          <p className="text-[12px] text-secondaryText">Real-time system execution metrics</p>
        </div>

        {/* Circular progress visualization */}
        <div className="flex items-center justify-center my-3 relative">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="#EAECF0"
              strokeWidth="7"
              fill="transparent"
            />
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="#465CF5"
              strokeWidth="7"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[17px] font-bold text-primaryText">{progressPct}%</span>
            <span className="text-[10px] text-secondaryText uppercase tracking-wider">Health</span>
          </div>
        </div>

        {/* Numerical breakdown */}
        <div className="space-y-2 pt-1 border-t border-borderGrey text-[12px]">
          <div className="flex justify-between items-center">
            <span className="text-secondaryText flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" /> Questions Asked:
            </span>
            <span className="font-semibold text-primaryText">{totalQuestions}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-secondaryText flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Analyses Run:
            </span>
            <span className="font-semibold text-primaryText">{totalAnalyses}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-secondaryText flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Avg Analysis Time:
            </span>
            <span className="font-semibold text-primaryText">{avgTimeMs} ms</span>
          </div>
        </div>
      </div>

      {/* CARD C: Current Dataset (~30% = 4 cols) */}
      <div className="lg:col-span-4 bg-card border border-borderGrey rounded-card p-5 shadow-subtle flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-semibold text-primaryText">Current Dataset</h3>
            <span className="flex items-center gap-1 text-[11px] font-medium text-successGreen bg-[#ECFDF5] px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> Ready
            </span>
          </div>

          {dataset ? (
            <div className="space-y-2.5 text-[12px]">
              <div className="p-3 bg-[#F8FAFC] border border-borderGrey rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-lightBlue text-primaryBlue flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="font-semibold text-primaryText truncate">{dataset.original_name}</div>
                  <div className="text-[11px] text-secondaryText">{formatSize(dataset.file_size_bytes)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-borderGrey text-left">
                  <div className="text-[11px] text-secondaryText">Rows</div>
                  <div className="text-[15px] font-bold text-primaryText">{dataset.row_count?.toLocaleString()}</div>
                </div>
                <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-borderGrey text-left">
                  <div className="text-[11px] text-secondaryText">Columns</div>
                  <div className="text-[15px] font-bold text-primaryText">{dataset.col_count}</div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 text-[11px] text-secondaryText">
                <span>Ingestion Date:</span>
                <span className="font-medium text-primaryText">{formatDate(dataset.created_at)}</span>
              </div>
            </div>
          ) : (
            <div className="text-secondaryText text-[12px] py-8">No dataset currently selected</div>
          )}
        </div>

        <button
          onClick={onViewDataset}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-borderGrey bg-white hover:bg-background text-primaryText font-medium text-[13px] transition-colors"
        >
          <Eye className="w-4 h-4 text-primaryBlue" />
          <span>View Dataset</span>
        </button>
      </div>
    </div>
  );
}
