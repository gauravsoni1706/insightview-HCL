import React, { useState, useEffect } from 'react';
import { Columns, ArrowLeftRight, Check, X, Loader2 } from 'lucide-react';
import { compareDatasets } from '../services/api';

export default function DatasetComparisonModal({ isOpen, onClose, datasets }) {
  const [datasetA, setDatasetA] = useState(datasets[0]?.id || '');
  const [datasetB, setDatasetB] = useState(datasets[1]?.id || datasets[0]?.id || '');
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (datasets && datasets.length >= 2) {
      setDatasetA(datasets[0].id);
      setDatasetB(datasets[1].id);
    }
  }, [datasets]);

  if (!isOpen) return null;

  const handleCompare = async () => {
    if (!datasetA || !datasetB) return;
    setLoading(true);
    setError(null);
    try {
      const res = await compareDatasets(datasetA, datasetB);
      setComparison(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Comparison failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-card border border-borderGrey shadow-2xl max-w-2xl w-full p-6 text-left relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-secondaryText hover:text-primaryText p-1 rounded-lg hover:bg-background transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <ArrowLeftRight className="w-5 h-5 text-primaryBlue" />
          <h2 className="text-[17px] font-bold text-primaryText">Compare Datasets</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[12px] text-dangerRed">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[11px] font-semibold text-secondaryText uppercase tracking-wider mb-1">
              Dataset A (Baseline)
            </label>
            <select
              value={datasetA}
              onChange={(e) => setDatasetA(Number(e.target.value))}
              className="w-full bg-[#F8FAFC] border border-borderGrey rounded-xl px-3 py-2 text-[13px] text-primaryText focus:outline-none focus:border-primaryBlue"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.original_name} ({d.row_count} rows)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-secondaryText uppercase tracking-wider mb-1">
              Dataset B (Comparison)
            </label>
            <select
              value={datasetB}
              onChange={(e) => setDatasetB(Number(e.target.value))}
              className="w-full bg-[#F8FAFC] border border-borderGrey rounded-xl px-3 py-2 text-[13px] text-primaryText focus:outline-none focus:border-primaryBlue"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.original_name} ({d.row_count} rows)
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleCompare}
          disabled={loading || !datasetA || !datasetB}
          className="w-full py-2.5 rounded-xl bg-primaryBlue hover:bg-blue-600 text-white font-medium text-[13px] flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Run Side-by-Side Comparison</span>}
        </button>

        {comparison && (
          <div className="mt-6 space-y-4 pt-4 border-t border-borderGrey">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-borderGrey">
                <div className="text-[11px] text-secondaryText">Row Difference</div>
                <div className="text-[16px] font-bold text-primaryText">
                  {comparison.row_count_diff >= 0 ? `+${comparison.row_count_diff}` : comparison.row_count_diff}
                </div>
              </div>
              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-borderGrey">
                <div className="text-[11px] text-secondaryText">Quality Score Delta</div>
                <div className="text-[16px] font-bold text-successGreen">
                  {comparison.quality_diff >= 0 ? `+${comparison.quality_diff}%` : `${comparison.quality_diff}%`}
                </div>
              </div>
              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-borderGrey">
                <div className="text-[11px] text-secondaryText">Shared Attributes</div>
                <div className="text-[16px] font-bold text-primaryBlue">
                  {comparison.shared_columns.length} columns
                </div>
              </div>
            </div>

            <div className="border border-borderGrey rounded-xl overflow-hidden">
              <table className="w-full text-[12px] text-left">
                <thead className="bg-[#F8FAFC] border-b border-borderGrey font-semibold text-secondaryText">
                  <tr>
                    <th className="p-3">Attribute</th>
                    <th className="p-3">{comparison.dataset_a.name}</th>
                    <th className="p-3">{comparison.dataset_b.name}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderGrey">
                  <tr>
                    <td className="p-3 font-medium text-secondaryText">Total Rows</td>
                    <td className="p-3 font-semibold">{comparison.dataset_a.row_count}</td>
                    <td className="p-3 font-semibold">{comparison.dataset_b.row_count}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-secondaryText">Total Columns</td>
                    <td className="p-3 font-semibold">{comparison.dataset_a.col_count}</td>
                    <td className="p-3 font-semibold">{comparison.dataset_b.col_count}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-secondaryText">Missing Values</td>
                    <td className="p-3">{comparison.dataset_a.missing_cells}</td>
                    <td className="p-3">{comparison.dataset_b.missing_cells}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-secondaryText">Data Quality</td>
                    <td className="p-3 font-bold text-successGreen">{comparison.dataset_a.data_quality_score}%</td>
                    <td className="p-3 font-bold text-successGreen">{comparison.dataset_b.data_quality_score}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
