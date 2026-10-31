import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Database,
  Lightbulb,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
  Sparkles,
  BarChart2
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const workspaceNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analyze', label: 'Analyze Data', icon: MessageSquare },
    { id: 'datasets', label: 'My Datasets', icon: Database },
    { id: 'insights', label: 'AI Insights', icon: Lightbulb },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  const generalNav = [
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help', label: 'Help', icon: HelpCircle },
    { id: 'logout', label: 'Logout', icon: LogOut },
  ];

  const handleNavClick = (id) => {
    if (id === 'logout') {
      if (window.confirm('Are you sure you want to log out of InsightFlow AI?')) {
        window.location.reload();
      }
      return;
    }
    setActiveTab(id);
  };

  return (
    <aside className="w-[215px] min-w-[215px] h-screen bg-sidebar border-r border-borderGrey flex flex-col justify-between select-none z-30 sticky top-0">
      <div>
        {/* App Logo */}
        <div className="h-[65px] flex items-center px-5 border-b border-borderGrey gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primaryBlue flex items-center justify-center text-white shadow-sm">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[15px] font-bold text-primaryText tracking-tight flex items-center gap-1.5">
              InsightFlow <span className="text-[10px] bg-lightBlue text-primaryBlue px-1.5 py-0.5 rounded font-semibold">AI</span>
            </div>
            <div className="text-[11px] text-secondaryText leading-none">Data Intelligence</div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="p-3 space-y-6">
          {/* WORKSPACE */}
          <div>
            <div className="px-3 text-[11px] font-semibold text-secondaryText uppercase tracking-wider mb-2">
              Workspace
            </div>
            <nav className="space-y-1">
              {workspaceNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                      isActive
                        ? 'bg-primaryBlue text-white shadow-sm'
                        : 'text-secondaryText hover:text-primaryText hover:bg-background'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-secondaryText'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* GENERAL */}
          <div>
            <div className="px-3 text-[11px] font-semibold text-secondaryText uppercase tracking-wider mb-2">
              General
            </div>
            <nav className="space-y-1">
              {generalNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                      isActive
                        ? 'bg-primaryBlue text-white shadow-sm'
                        : 'text-secondaryText hover:text-primaryText hover:bg-background'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-secondaryText'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Bottom informational card */}
      <div className="p-3">
        <div className="bg-[#F8FAFC] border border-borderGrey rounded-xl p-3.5 text-left">
          <div className="flex items-center gap-1.5 text-primaryBlue text-[12px] font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Your data, understood.</span>
          </div>
          <p className="text-[11px] text-secondaryText leading-relaxed">
            Turn raw datasets into meaningful, validated business insights.
          </p>
        </div>
      </div>
    </aside>
  );
}
