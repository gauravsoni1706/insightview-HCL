import React, { useState } from 'react';
import { Sparkles, Trash2, ShieldCheck, Check, X, AlertTriangle, Loader2 } from 'lucide-react';
import { cleanDataset } from '../services/api';

export default function DataCleaningModal({ isOpen, onClose, dataset, onCleaningComplete }) {
  const [missingStrategy, setMissingStrategy] = useState('mean');
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [outlierStrategy, setOutlierStrategy] = useState('clip_iqr');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen || !dataset) return null;

  const handleRunCleaning = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await cleanDataset(dataset.id, {
        missing_strategy: missingStrategy,
        remove_duplicates: removeDuplicates,
        outlier_strategy: outlierStrategy,
      });
      setResult(res.data);
      onCleaningComplete(res.data.cleaned_dataset);
    } catch (err) {
      setError(err.response?.data?.error || 'Data cleaning pipeline failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-card border border-borderGrey shadow-2xl max-w-xl w-full p-6 text-left relative animate-in fade-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-secondaryText hover:text-primaryText p-1 rounded-lg hover:bg-background transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-lightBlue text-primaryBlue flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-[17px] font-bold text-primaryText">Data Cleaning Assistant</h2>
            <p className="text-[12px] text-secondaryText">
              Transform raw records into clean, validated, analysis-ready tables.
            </p>
          </div>
        </div>

        {error && (
          <div className="my-3 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[12px] text-dangerRed">
            {error}
          </div>
        )}

        {result ? (
          <div className="my-4 p-4 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] space-y-3">
            <div className="flex items-center gap-2 text-successGreen font-semibold text-[14px]">
              <ShieldCheck className="w-5 h-5" />
              <span>Dataset Successfully Cleaned!</span>
            </div>
            <div className="text-[12px] text-primaryText space-y-1">
              <div><b>Original rows:</b> {result.original_rows} &rarr; <b>Cleaned rows:</b> {result.cleaned_rows}</div>
              <div><b>Quality Score:</b> <span className="text-successGreen font-bold">{result.new_quality_score}%</span></div>
            </div>
            <div className="border-t border-[#A7F3D0] pt-2">
              <div className="text-[11px] font-semibold text-secondaryText uppercase tracking-wider mb-1">
                Actions Performed:
              </div>
              <ul className="list-disc list-inside text-[11px] text-primaryText space-y-0.5">
                {result.actions_taken.map((act, i) => (
                  <li key={i}>{act}</li>
                ))}
              </ul>
            </div>
            <button
              onClick={onClose}
              className="w-full mt-2 py-2 rounded-xl bg-successGreen hover:bg-emerald-600 text-white font-medium text-[12px] transition-colors"
            >
              Done & Inspect Cleaned Dataset
            </button>
          </div>
        ) : (
          <div className="space-y-4 my-4">
            {/* 1. Missing Values Treatment */}
            <div className="p-3.5 bg-[#F8FAFC] border border-borderGrey rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-primaryText">Missing Value Imputation</span>
                <span className="text-[11px] text-warningOrange font-medium">
                  {dataset.missing_cells_count} missing cells
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'mean', label: 'Impute Mean' },
                  { id: 'median', label: 'Impute Median' },
                  { id: 'drop', label: 'Drop Rows' },
                  { id: 'none', label: 'Keep As-Is' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setMissingStrategy(opt.id)}
                    className={`p-2 rounded-lg text-[12px] font-medium border text-center transition-all ${
                      missingStrategy === opt.id
                        ? 'border-primaryBlue bg-lightBlue text-primaryBlue'
                        : 'border-borderGrey bg-white text-secondaryText hover:text-primaryText'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Deduplication */}
            <div className="p-3.5 bg-[#F8FAFC] border border-borderGrey rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[13px] font-semibold text-primaryText">Deduplicate Rows</div>
                <div className="text-[11px] text-secondaryText">
                  {dataset.duplicate_rows_count} redundant duplicate rows flagged
                </div>
              </div>
              <button
                onClick={() => setRemoveDuplicates(!removeDuplicates)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  removeDuplicates ? 'bg-primaryBlue' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    removeDuplicates ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {/* 3. Outlier Treatment */}
            <div className="p-3.5 bg-[#F8FAFC] border border-borderGrey rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-primaryText">Outlier Treatment (IQR)</span>
                <span className="text-[11px] text-secondaryText">Numerical boundary screening</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'clip_iqr', label: 'Clip to IQR Bounds' },
                  { id: 'drop_iqr', label: 'Drop Outlier Rows' },
                  { id: 'none', label: 'Preserve Outliers' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setOutlierStrategy(opt.id)}
                    className={`p-2 rounded-lg text-[12px] font-medium border text-center transition-all ${
                      outlierStrategy === opt.id
                        ? 'border-primaryBlue bg-lightBlue text-primaryBlue'
                        : 'border-borderGrey bg-white text-secondaryText hover:text-primaryText'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleRunCleaning}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-primaryBlue hover:bg-blue-600 text-white font-medium text-[13px] flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Transformations...</span>
                </>
              ) : (
                <span>Execute Cleaning & Create New Version</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
