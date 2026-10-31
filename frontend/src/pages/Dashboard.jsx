import React from 'react';
import { Plus, Upload, RefreshCw } from 'lucide-react';
import MetricCards from '../components/MetricCards';
import AnalyticsSection from '../components/AnalyticsSection';
import BottomSection from '../components/BottomSection';

export default function Dashboard({
  dataset,
  datasets,
  insights,
  activityMetrics,
  onSelectDataset,
  onOpenUpload,
  onOpenAnalysis,
  onViewAllDatasets,
  onRefresh,
}) {
  return (
    <div className="space-y-5 text-left">
      {/* Dashboard Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-primaryText tracking-tight">
            Dashboard
          </h1>
          <p className="text-[13px] text-secondaryText mt-0.5">
            Explore your datasets, uncover patterns, and make smarter decisions.
          </p>
        </div>

        {/* Right-side Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl border border-borderGrey bg-white hover:bg-background text-secondaryText hover:text-primaryText transition-colors shadow-subtle"
            title="Refresh Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-borderGrey bg-white hover:bg-background text-primaryText font-medium text-[13px] transition-colors shadow-subtle"
          >
            <Upload className="w-4 h-4 text-primaryBlue" />
            <span>Import Data</span>
          </button>

          <button
            onClick={onOpenAnalysis}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primaryBlue hover:bg-blue-600 text-white font-medium text-[13px] transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Analysis</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <MetricCards dataset={dataset} />

      {/* Middle Dashboard Section */}
      <AnalyticsSection
        dataset={dataset}
        activityMetrics={activityMetrics}
        onViewDataset={onViewAllDatasets}
      />

      {/* Bottom Dashboard Section */}
      <BottomSection
        dataset={dataset}
        insights={insights}
        datasets={datasets}
        onSelectDataset={onSelectDataset}
        onViewAllDatasets={onViewAllDatasets}
        onOpenAnalysis={onOpenAnalysis}
      />
    </div>
  );
}
