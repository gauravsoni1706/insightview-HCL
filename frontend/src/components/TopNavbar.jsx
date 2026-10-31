import React, { useState } from 'react';
import { Search, Bell, HelpCircle, ChevronDown, Database, Check } from 'lucide-react';

export default function TopNavbar({ datasets, selectedDataset, onSelectDataset, onOpenHelp }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <header className="h-[65px] bg-sidebar border-b border-borderGrey px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Search input */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-secondaryText absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search anything..."
            className="w-full bg-[#F8FAFC] border border-borderGrey rounded-xl pl-9 pr-4 py-2 text-[13px] text-primaryText placeholder-secondaryText focus:outline-none focus:border-primaryBlue focus:ring-1 focus:ring-primaryBlue transition-colors"
          />
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* Dataset Switcher Pill */}
        {datasets && datasets.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-borderGrey bg-[#F8FAFC] hover:bg-gray-100 text-[12px] font-medium text-primaryText transition-all"
            >
              <Database className="w-3.5 h-3.5 text-primaryBlue" />
              <span className="max-w-[130px] truncate">
                {selectedDataset ? selectedDataset.original_name : 'Select Dataset'}
              </span>
              <ChevronDown className="w-3 h-3 text-secondaryText" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-borderGrey rounded-xl shadow-lg py-1.5 z-50">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-secondaryText uppercase tracking-wider border-b border-borderGrey">
                  Active Datasets
                </div>
                <div className="max-h-56 overflow-y-auto">
                  {datasets.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        onSelectDataset(d);
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 flex items-center justify-between text-[12px] hover:bg-background transition-colors"
                    >
                      <div className="truncate pr-2">
                        <div className="font-medium text-primaryText truncate">{d.original_name}</div>
                        <div className="text-[11px] text-secondaryText">{d.row_count} rows • {d.col_count} cols</div>
                      </div>
                      {selectedDataset?.id === d.id && (
                        <Check className="w-3.5 h-3.5 text-primaryBlue flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notifications & Help */}
        <button
          onClick={() => alert("All analytics pipelines are active and fully operational.")}
          className="w-9 h-9 rounded-xl border border-borderGrey flex items-center justify-center text-secondaryText hover:text-primaryText hover:bg-background transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-primaryBlue absolute top-2 right-2"></span>
        </button>

        <button
          onClick={onOpenHelp}
          className="w-9 h-9 rounded-xl border border-borderGrey flex items-center justify-center text-secondaryText hover:text-primaryText hover:bg-background transition-colors"
          title="Help & Guides"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-borderGrey"></div>

        {/* User profile */}
        <div className="flex items-center gap-3 pl-1">
          <div className="w-9 h-9 rounded-full bg-primaryBlue text-white font-semibold text-[13px] flex items-center justify-center shadow-sm">
            GS
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-[13px] font-semibold text-primaryText leading-snug">Gaurav Soni</div>
            <div className="text-[11px] text-secondaryText leading-none">gaurav@insightflow.ai</div>
          </div>
        </div>
      </div>
    </header>
  );
}
