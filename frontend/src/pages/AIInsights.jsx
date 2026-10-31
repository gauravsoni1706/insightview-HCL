import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  AlertOctagon,
  Info,
  Filter,
  BarChart2,
} from 'lucide-react';
import { toggleSaveInsight, refreshInsights } from '../services/api';

export default function AIInsights({ dataset, insights, onRefreshInsights }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const categories = [
    { id: 'all', label: 'All Insights' },
    { id: 'quality', label: 'Data Quality' },
    { id: 'correlation', label: 'Correlations' },
    { id: 'distribution', label: 'Distributions' },
    { id: 'anomaly', label: 'Outliers & Anomalies' },
    { id: 'trend', label: 'Trends' },
  ];

  const filteredInsights = insights.filter((ins) => {
    if (selectedCategory === 'all') return true;
    return ins.category === selectedCategory;
  });

  const handleToggleBookmark = async (insightId) => {
    try {
      await toggleSaveInsight(insightId);
      onRefreshInsights();
    } catch (err) {
      console.error('Failed to toggle bookmark', err);
    }
  };

  const handleRefresh = async () => {
    if (!dataset?.id) return;
    setRefreshing(true);
    try {
      await refreshInsights(dataset.id);
      onRefreshInsights();
    } catch (err) {
      console.error('Failed to refresh insights', err);
    } finally {
      setRefreshing(false);
    }
  };

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'success':
        return {
          icon: CheckCircle,
          badgeBg: 'bg-[#ECFDF5]',
          badgeText: 'text-successGreen',
          cardBorder: 'hover:border-successGreen',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          badgeBg: 'bg-[#FFF7ED]',
          badgeText: 'text-warningOrange',
          cardBorder: 'hover:border-warningOrange',
        };
      case 'danger':
        return {
          icon: AlertOctagon,
          badgeBg: 'bg-[#FEF2F2]',
          badgeText: 'text-dangerRed',
          cardBorder: 'hover:border-dangerRed',
        };
      default:
        return {
          icon: Info,
          badgeBg: 'bg-lightBlue',
          badgeText: 'text-primaryBlue',
          cardBorder: 'hover:border-primaryBlue',
        };
    }
  };

  return (
    <div className="space-y-5 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[26px] font-bold text-primaryText tracking-tight">
              AI Insights Board
            </h1>
            <span className="text-[11px] bg-lightBlue text-primaryBlue px-2.5 py-0.5 rounded-full font-semibold">
              Autonomous Discovery
            </span>
          </div>
          <p className="text-[13px] text-secondaryText mt-0.5">
            Algorithmic patterns, correlations, and anomalies detected directly in {dataset?.original_name || 'active dataset'}.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing || !dataset}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-borderGrey bg-white hover:bg-background text-primaryText font-medium text-[13px] transition-colors shadow-subtle"
        >
          <RefreshCw className={`w-4 h-4 text-primaryBlue ${refreshing ? 'animate-spin' : ''}`} />
          <span>Re-compute Deep Insights</span>
        </button>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-[12px] font-medium border transition-all ${
              selectedCategory === cat.id
                ? 'bg-primaryBlue border-primaryBlue text-white shadow-sm'
                : 'bg-white border-borderGrey text-secondaryText hover:text-primaryText hover:bg-background'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInsights.length > 0 ? (
          filteredInsights.map((ins) => {
            const style = getSeverityStyle(ins.severity);
            const Icon = style.icon;
            return (
              <div
                key={ins.id}
                className={`bg-card border border-borderGrey rounded-card p-5 shadow-subtle hover:shadow-card-hover transition-all text-left flex flex-col justify-between ${style.cardBorder}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg ${style.badgeBg} ${style.badgeText} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${style.badgeBg} ${style.badgeText}`}>
                        {ins.category}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleBookmark(ins.id)}
                      className="p-1 text-secondaryText hover:text-primaryBlue transition-colors"
                      title={ins.is_saved ? 'Bookmarked' : 'Bookmark Insight'}
                    >
                      {ins.is_saved ? (
                        <BookmarkCheck className="w-4 h-4 text-primaryBlue fill-primaryBlue" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <h3 className="text-[14px] font-bold text-primaryText leading-snug mb-2">
                    {ins.title}
                  </h3>

                  <p className="text-[12px] text-secondaryText leading-relaxed">
                    {ins.explanation}
                  </p>
                </div>

                {ins.metric_value && (
                  <div className="mt-4 pt-3 border-t border-borderGrey flex items-center justify-between text-[11px]">
                    <span className="text-secondaryText">Signal Strength:</span>
                    <span className="font-semibold text-primaryBlue bg-lightBlue/60 px-2 py-0.5 rounded font-mono">
                      {ins.metric_value}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-full bg-white border border-borderGrey rounded-card p-12 text-center text-secondaryText text-[13px]">
            <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            No insights found under this category.
          </div>
        )}
      </div>
    </div>
  );
}
