import React from 'react';
import { FileText, Download, CheckCircle, ShieldCheck, Database, Calendar, Clock } from 'lucide-react';
import { getPdfReportUrl, getDownloadCsvUrl } from '../services/api';

export default function Reports({ datasets, activityMetrics }) {
  return (
    <div className="space-y-5 text-left">
      <div>
        <h1 className="text-[26px] font-bold text-primaryText tracking-tight">
          Executive Reports & Exports
        </h1>
        <p className="text-[13px] text-secondaryText mt-0.5">
          Generate publication-ready PDF audit briefs, download sanitized CSVs, and inspect analysis trails.
        </p>
      </div>

      {/* Grid of Report Cards per dataset */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {datasets.map((d) => (
          <div
            key={d.id}
            className="bg-card border border-borderGrey rounded-card p-5 shadow-subtle flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-primaryBlue bg-lightBlue px-2.5 py-0.5 rounded-full">
                  Certified PDF Brief
                </span>
                <span className="text-[11px] font-bold text-successGreen">
                  {d.data_quality_score}% Quality
                </span>
              </div>

              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-lightBlue text-primaryBlue flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-primaryText truncate max-w-[200px]">
                    {d.original_name}
                  </h3>
                  <p className="text-[11px] text-secondaryText mt-0.5">
                    {d.row_count?.toLocaleString()} records • {d.col_count} columns
                  </p>
                </div>
              </div>

              <div className="bg-[#F8FAFC] border border-borderGrey rounded-xl p-3 text-[11px] space-y-1.5 text-secondaryText mb-4">
                <div className="flex justify-between">
                  <span>Report Engine:</span>
                  <span className="font-medium text-primaryText">ReportLab PDF v5.1</span>
                </div>
                <div className="flex justify-between">
                  <span>Sections Included:</span>
                  <span className="font-medium text-primaryText">KPIs, EDA, Anomalies</span>
                </div>
                <div className="flex justify-between">
                  <span>Missing Cells:</span>
                  <span className="font-medium text-primaryText">{d.missing_cells_count}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href={getPdfReportUrl(d.id)}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primaryBlue hover:bg-blue-600 text-white font-medium text-[12px] shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Executive PDF</span>
              </a>

              <a
                href={getDownloadCsvUrl(d.filename)}
                download
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-borderGrey bg-white hover:bg-background text-primaryText font-medium text-[12px] transition-colors"
              >
                <Database className="w-3.5 h-3.5 text-secondaryText" />
                <span>Download Cleaned CSV</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Timeline Table */}
      <div className="bg-white border border-borderGrey rounded-card p-5 shadow-subtle space-y-3">
        <h3 className="text-[15px] font-bold text-primaryText">Audit Trail & Analysis Execution Logs</h3>
        <p className="text-[12px] text-secondaryText">
          Complete log of validated analytical queries executed against active datasets.
        </p>

        <div className="border border-borderGrey rounded-xl overflow-hidden">
          <table className="w-full text-[12px] text-left">
            <thead className="bg-[#F8FAFC] border-b border-borderGrey text-secondaryText">
              <tr>
                <th className="p-3 font-semibold">Day</th>
                <th className="p-3 font-semibold">Total Queries Executed</th>
                <th className="p-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderGrey">
              {activityMetrics?.weekly_activity?.map((w, idx) => (
                <tr key={idx} className="hover:bg-background">
                  <td className="p-3 font-medium text-primaryText flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-primaryBlue" />
                    <span>{w.full_day || w.day}</span>
                  </td>
                  <td className="p-3 font-semibold text-primaryText">{w.analyses} operations</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 text-[11px] text-successGreen font-medium">
                      <CheckCircle className="w-3 h-3" /> Logged & Validated
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
