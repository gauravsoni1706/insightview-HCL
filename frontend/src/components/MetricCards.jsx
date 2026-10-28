import React from 'react';
import { Database, Columns, AlertCircle, ShieldCheck, TrendingUp, TrendingDown } from 'lucide-react';

export default function MetricCards({ dataset }) {
  if (!dataset) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-borderGrey rounded-card p-5 animate-pulse h-32">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-100 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const {
    row_count = 0,
    col_count = 0,
    missing_cells_count = 0,
    data_quality_score = 100,
  } = dataset;

  const isHealthyQuality = data_quality_score >= 80;
  const hasMissing = missing_cells_count > 0;

  // Mini sparkline SVGs
  const Sparkline = ({ points, color = "#465CF5" }) => (
    <svg className="w-16 h-7 overflow-visible" viewBox="0 0 60 25">
      <path
        d={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const cards = [
    {
      id: 'records',
      title: 'Total Records',
      value: row_count.toLocaleString(),
      subtext: '+100% active ingestion',
      trend: 'up',
      icon: Database,
      iconColor: 'text-primaryBlue',
      iconBg: 'bg-lightBlue',
      sparkline: 'M0,18 Q15,6 30,14 T60,4',
      strokeColor: '#465CF5',
    },
    {
      id: 'columns',
      title: 'Total Columns',
      value: col_count.toString(),
      subtext: 'Structured schema attributes',
      trend: 'neutral',
      icon: Columns,
      iconColor: 'text-[#6366F1]',
      iconBg: 'bg-[#EEF2FF]',
      sparkline: 'M0,14 L15,10 L30,16 L45,8 L60,11',
      strokeColor: '#6366F1',
    },
    {
      id: 'missing',
      title: 'Missing Values',
      value: missing_cells_count.toLocaleString(),
      subtext: hasMissing ? 'Action required in cleaning' : '0 null cells detected',
      trend: hasMissing ? 'down' : 'up',
      icon: AlertCircle,
      iconColor: hasMissing ? 'text-warningOrange' : 'text-successGreen',
      iconBg: hasMissing ? 'bg-[#FFF7ED]' : 'bg-[#ECFDF5]',
      sparkline: hasMissing ? 'M0,8 Q20,20 40,15 T60,22' : 'M0,22 L60,22',
      strokeColor: hasMissing ? '#F4B65E' : '#42B994',
    },
    {
      id: 'quality',
      title: 'Data Quality',
      value: `${data_quality_score}%`,
      subtext: isHealthyQuality ? 'Optimal production ready' : 'Integrity warnings found',
      trend: isHealthyQuality ? 'up' : 'down',
      icon: ShieldCheck,
      iconColor: isHealthyQuality ? 'text-successGreen' : 'text-warningOrange',
      iconBg: isHealthyQuality ? 'bg-[#ECFDF5]' : 'bg-[#FFF7ED]',
      sparkline: 'M0,16 Q20,18 40,6 T60,2',
      strokeColor: isHealthyQuality ? '#42B994' : '#F4B65E',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="bg-card border border-borderGrey rounded-card p-5 shadow-subtle hover:shadow-card-hover transition-all text-left flex flex-col justify-between"
          >
            {/* Top row: heading and icon */}
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-secondaryText">
                {card.title}
              </span>
              <div className={`w-8 h-8 rounded-lg ${card.iconBg} flex items-center justify-center ${card.iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            {/* Metric number */}
            <div className="my-2 text-[32px] font-bold text-primaryText tracking-tight">
              {card.value}
            </div>

            {/* Bottom row: trend and sparkline */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1 text-[11px] text-secondaryText truncate pr-2">
                {card.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-successGreen" />}
                {card.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-warningOrange" />}
                <span className="truncate">{card.subtext}</span>
              </div>
              <Sparkline points={card.sparkline} color={card.strokeColor} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* Enhanced subtle hover transition tokens */
