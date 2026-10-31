import React, { useState, useEffect } from 'react';
import {
  Database,
  Trash2,
  Sparkles,
  Download,
  FileText,
  Search,
  ArrowLeftRight,
  Eye,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import {
  getDatasets,
  getDatasetPreview,
  deleteDataset,
  getPdfReportUrl,
  getDownloadCsvUrl,
} from '../services/api';
import DataCleaningModal from '../components/DataCleaningModal';
import DatasetComparisonModal from '../components/DatasetComparisonModal';

export default function MyDatasets({
  datasets,
  selectedDataset,
  onSelectDataset,
  onOpenUpload,
  onRefreshDatasets,
}) {
  const [activePreviewId, setActivePreviewId] = useState(selectedDataset?.id || (datasets[0]?.id ?? null));
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [cleaningModalOpen, setCleaningModalOpen] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  useEffect(() => {
    if (activePreviewId) {
      loadPreview(activePreviewId);
    }
  }, [activePreviewId]);

  const loadPreview = async (id) => {
    setLoadingPreview(true);
    try {
      const res = await getDatasetPreview(id, 25, 0);
      setPreviewData(res.data);
    } catch (err) {
      console.error('Failed to load dataset preview', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete dataset "${name}"?`)) {
      try {
        await deleteDataset(id);
        onRefreshDatasets();
      } catch (err) {
        alert('Failed to delete dataset');
      }
    }
  };

  const currentDatasetObj = datasets.find((d) => d.id === activePreviewId) || selectedDataset;

  return (
    <div className="space-y-5 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-primaryText tracking-tight">
            My Datasets
          </h1>
          <p className="text-[13px] text-secondaryText mt-0.5">
            Manage your uploaded catalogs, run cleaning transformations, and review raw schemas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCompareModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-borderGrey bg-white hover:bg-background text-primaryText font-medium text-[13px] transition-colors shadow-subtle"
          >
            <ArrowLeftRight className="w-4 h-4 text-primaryBlue" />
            <span>Compare Datasets</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primaryBlue hover:bg-blue-600 text-white font-medium text-[13px] transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New CSV</span>
          </button>
        </div>
      </div>

      {/* Datasets Table */}
      <div className="bg-white border border-borderGrey rounded-card overflow-hidden shadow-subtle">
        <div className="p-4 border-b border-borderGrey flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-primaryText">Dataset Catalog ({datasets.length})</h3>
          <span className="text-[11px] text-secondaryText">Click any dataset to preview or clean</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[12px] text-left">
            <thead className="bg-[#F8FAFC] border-b border-borderGrey text-secondaryText">
              <tr>
                <th className="p-3.5 pl-5 font-semibold">Dataset Name</th>
                <th className="p-3.5 font-semibold">Records</th>
                <th className="p-3.5 font-semibold">Columns</th>
                <th className="p-3.5 font-semibold">Missing Cells</th>
                <th className="p-3.5 font-semibold">Data Quality</th>
                <th className="p-3.5 font-semibold">Ingested Date</th>
                <th className="p-3.5 pr-5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderGrey">
              {datasets.map((d) => {
                const isActive = activePreviewId === d.id;
                return (
                  <tr
                    key={d.id}
                    onClick={() => {
                      setActivePreviewId(d.id);
                      onSelectDataset(d);
                    }}
                    className={`cursor-pointer transition-colors ${
                      isActive ? 'bg-lightBlue/30' : 'hover:bg-background'
                    }`}
                  >
                    <td className="p-3.5 pl-5 font-medium text-primaryText flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-lightBlue text-primaryBlue flex items-center justify-center flex-shrink-0">
                        <Database className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate max-w-[200px]">{d.original_name}</span>
                    </td>
                    <td className="p-3.5 font-semibold text-primaryText">{d.row_count?.toLocaleString()}</td>
                    <td className="p-3.5 text-secondaryText">{d.col_count}</td>
                    <td className="p-3.5">
                      <span className={d.missing_cells_count > 0 ? "text-warningOrange font-bold" : "text-successGreen"}>
                        {d.missing_cells_count}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 font-semibold text-successGreen bg-[#ECFDF5] px-2 py-0.5 rounded-full text-[11px]">
                        <CheckCircle2 className="w-3 h-3" />
                        {d.data_quality_score}%
                      </span>
                    </td>
                    <td className="p-3.5 text-secondaryText">
                      {d.created_at ? new Date(d.created_at).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="p-3.5 pr-5 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setActivePreviewId(d.id);
                          setCleaningModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg border border-borderGrey hover:bg-lightBlue hover:text-primaryBlue text-secondaryText transition-colors"
                        title="Clean Data"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={getPdfReportUrl(d.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block p-1.5 rounded-lg border border-borderGrey hover:bg-lightBlue hover:text-primaryBlue text-secondaryText transition-colors"
                        title="Download PDF Report"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => handleDelete(d.id, d.original_name)}
                        className="p-1.5 rounded-lg border border-borderGrey hover:bg-red-50 hover:text-dangerRed text-secondaryText transition-colors"
                        title="Delete Dataset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dataset Raw Preview Grid */}
      {currentDatasetObj && (
        <div className="bg-white border border-borderGrey rounded-card p-5 shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[16px] font-bold text-primaryText">
                  Data Preview: {currentDatasetObj.original_name}
                </h3>
                <span className="text-[11px] bg-background text-secondaryText px-2 py-0.5 rounded">
                  Showing top rows
                </span>
              </div>
              <p className="text-[12px] text-secondaryText mt-0.5">
                Explore raw tabular values and inspect data integrity before querying.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCleaningModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-borderGrey bg-[#F8FAFC] hover:bg-lightBlue hover:text-primaryBlue text-[12px] font-medium transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-primaryBlue" />
                <span>Launch Cleaning Assistant</span>
              </button>
              <a
                href={getDownloadCsvUrl(currentDatasetObj.filename)}
                download
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primaryBlue text-white hover:bg-blue-600 text-[12px] font-medium transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </a>
            </div>
          </div>

          {/* Table Container */}
          <div className="border border-borderGrey rounded-xl overflow-hidden max-h-[420px] overflow-y-auto overflow-x-auto">
            {loadingPreview ? (
              <div className="p-12 text-center text-secondaryText text-[13px]">
                Loading preview data...
              </div>
            ) : previewData?.rows?.length > 0 ? (
              <table className="w-full text-[12px] text-left">
                <thead className="bg-[#F8FAFC] border-b border-borderGrey text-secondaryText sticky top-0 z-10">
                  <tr>
                    <th className="p-2.5 font-semibold text-gray-400 w-12 text-center">#</th>
                    {previewData.columns.map((c) => (
                      <th key={c} className="p-2.5 font-semibold whitespace-nowrap">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderGrey">
                  {previewData.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-background">
                      <td className="p-2.5 text-secondaryText text-center font-mono text-[10px]">
                        {idx + 1}
                      </td>
                      {previewData.columns.map((colName) => (
                        <td key={colName} className="p-2.5 text-primaryText whitespace-nowrap">
                          {String(row[colName] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-secondaryText text-[12px]">
                No preview available.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <DataCleaningModal
        isOpen={cleaningModalOpen}
        onClose={() => setCleaningModalOpen(false)}
        dataset={currentDatasetObj}
        onCleaningComplete={(newDs) => {
          onRefreshDatasets();
          setActivePreviewId(newDs.id);
        }}
      />

      <DatasetComparisonModal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        datasets={datasets}
      />
    </div>
  );
}
