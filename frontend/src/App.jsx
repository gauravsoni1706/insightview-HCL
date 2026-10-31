import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import Dashboard from './pages/Dashboard';
import AnalyzeData from './pages/AnalyzeData';
import MyDatasets from './pages/MyDatasets';
import AIInsights from './pages/AIInsights';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Help from './pages/Help';
import DatasetUploadModal from './components/DatasetUploadModal';
import {
  getDatasets,
  getDatasetInsights,
  getActivityMetrics,
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [insights, setInsights] = useState([]);
  const [activityMetrics, setActivityMetrics] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [dsRes, actRes] = await Promise.all([
        getDatasets(),
        getActivityMetrics(),
      ]);

      const loadedDatasets = dsRes.data || [];
      setDatasets(loadedDatasets);
      setActivityMetrics(actRes.data);

      if (loadedDatasets.length > 0) {
        const initialDs = loadedDatasets[0];
        setSelectedDataset(initialDs);
        loadInsightsForDataset(initialDs.id);
      }
    } catch (err) {
      console.error('Failed to load initial data', err);
    } finally {
      setLoading(false);
    }
  };

  const loadInsightsForDataset = async (datasetId) => {
    try {
      const res = await getDatasetInsights(datasetId);
      setInsights(res.data || []);
    } catch (err) {
      console.error('Failed to load dataset insights', err);
    }
  };

  const handleSelectDataset = (dataset) => {
    setSelectedDataset(dataset);
    loadInsightsForDataset(dataset.id);
  };

  const handleUploadSuccess = (newDataset) => {
    setDatasets((prev) => [newDataset, ...prev]);
    setSelectedDataset(newDataset);
    loadInsightsForDataset(newDataset.id);
    setActiveTab('dashboard');
  };

  const handleRefresh = async () => {
    await fetchInitialData();
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* 215px Left Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Workspace (remaining width) */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* 65px Top Navigation */}
        <TopNavbar
          datasets={datasets}
          selectedDataset={selectedDataset}
          onSelectDataset={handleSelectDataset}
          onOpenHelp={() => setActiveTab('help')}
        />

        {/* Dashboard Content Container with 16-20px spacing */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-6 bg-background">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <Dashboard
                dataset={selectedDataset}
                datasets={datasets}
                insights={insights}
                activityMetrics={activityMetrics}
                onSelectDataset={handleSelectDataset}
                onOpenUpload={() => setIsUploadModalOpen(true)}
                onOpenAnalysis={() => setActiveTab('analyze')}
                onViewAllDatasets={() => setActiveTab('datasets')}
                onRefresh={handleRefresh}
              />
            )}

            {activeTab === 'analyze' && (
              <AnalyzeData
                dataset={selectedDataset}
                onOpenUpload={() => setIsUploadModalOpen(true)}
              />
            )}

            {activeTab === 'datasets' && (
              <MyDatasets
                datasets={datasets}
                selectedDataset={selectedDataset}
                onSelectDataset={handleSelectDataset}
                onOpenUpload={() => setIsUploadModalOpen(true)}
                onRefreshDatasets={handleRefresh}
              />
            )}

            {activeTab === 'insights' && (
              <AIInsights
                dataset={selectedDataset}
                insights={insights}
                onRefreshInsights={() => selectedDataset?.id && loadInsightsForDataset(selectedDataset.id)}
              />
            )}

            {activeTab === 'reports' && (
              <Reports
                datasets={datasets}
                activityMetrics={activityMetrics}
              />
            )}

            {activeTab === 'settings' && <Settings />}

            {activeTab === 'help' && (
              <Help
                onSwitchToAnalyze={(question) => {
                  setActiveTab('analyze');
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* Upload CSV Modal */}
      <DatasetUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
