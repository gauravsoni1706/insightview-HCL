import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X, Sparkles, Loader2 } from 'lucide-react';
import { uploadDatasetFile, loadSampleDataset } from '../services/api';

export default function DatasetUploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a valid CSV file.');
      return;
    }
    setError(null);
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);

    try {
      const res = await uploadDatasetFile(selectedFile);
      onUploadSuccess(res.data.dataset);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload dataset. Check CSV formatting.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = async (sampleName) => {
    setLoading(true);
    setError(null);
    try {
      const res = await loadSampleDataset(sampleName);
      onUploadSuccess(res.data.dataset);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load sample dataset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-card border border-borderGrey shadow-2xl max-w-lg w-full p-6 text-left relative animate-in fade-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 text-secondaryText hover:text-primaryText p-1 rounded-lg hover:bg-background transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <h2 className="text-[18px] font-bold text-primaryText">Import Dataset</h2>
          <p className="text-[13px] text-secondaryText">
            Upload any CSV spreadsheet or load an instant curated business dataset.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center gap-2.5 text-[12px] text-dangerRed">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Drag and drop box */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-card p-6 text-center transition-all ${
            dragActive
              ? 'border-primaryBlue bg-lightBlue/30'
              : selectedFile
              ? 'border-successGreen bg-[#ECFDF5]/30'
              : 'border-borderGrey bg-[#F8FAFC] hover:border-gray-400'
          }`}
        >
          <input
            type="file"
            id="csv-file-input"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
          />

          {selectedFile ? (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#ECFDF5] text-successGreen flex items-center justify-center mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="text-[14px] font-semibold text-primaryText">{selectedFile.name}</div>
              <div className="text-[11px] text-secondaryText mt-0.5">
                {(selectedFile.size / 1024).toFixed(1)} KB • Ready for automated profiling
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="mt-2 text-[12px] text-dangerRed hover:underline"
              >
                Choose a different file
              </button>
            </div>
          ) : (
            <label htmlFor="csv-file-input" className="cursor-pointer block">
              <div className="w-12 h-12 rounded-full bg-lightBlue text-primaryBlue mx-auto flex items-center justify-center mb-2">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="text-[13px] font-semibold text-primaryText">
                Click to browse or drag and drop CSV file
              </div>
              <div className="text-[11px] text-secondaryText mt-1">
                Supports standard CSV, UTF-8, latin1, auto-delimited up to 100MB
              </div>
            </label>
          )}
        </div>

        {selectedFile && (
          <button
            onClick={handleUpload}
            disabled={loading}
            className="mt-4 w-full py-2.5 rounded-xl bg-primaryBlue hover:bg-blue-600 text-white font-medium text-[13px] flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Profiling & Analyzing Dataset...</span>
              </>
            ) : (
              <span>Confirm & Start Profiling</span>
            )}
          </button>
        )}

        {/* Quick sample datasets */}
        <div className="mt-6 pt-4 border-t border-borderGrey">
          <div className="text-[11px] font-semibold text-secondaryText uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primaryBlue" />
            <span>Or test with a pre-configured sample:</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'sales', name: 'Global Sales Q4', rows: '20 rows, 9 cols' },
              { id: 'ecommerce', name: 'Ecommerce 2025', rows: '25 rows, 9 cols' },
              { id: 'employees', name: 'Employee Roster', rows: '15 rows, 7 cols' },
              { id: 'students', name: 'Student Scores', rows: '18 rows, 6 cols' },
            ].map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleLoadSample(sample.id)}
                disabled={loading}
                className="text-left p-2.5 rounded-xl border border-borderGrey bg-[#F8FAFC] hover:border-primaryBlue hover:bg-white transition-all group"
              >
                <div className="text-[12px] font-semibold text-primaryText group-hover:text-primaryBlue flex items-center justify-between">
                  <span>{sample.name}</span>
                  <FileText className="w-3 h-3 text-secondaryText" />
                </div>
                <div className="text-[10px] text-secondaryText">{sample.rows}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
