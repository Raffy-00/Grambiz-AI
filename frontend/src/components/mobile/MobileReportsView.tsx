import React, { useState, useEffect } from 'react';
import {
  FileText, MapPin, Trash2, Share2, Eye, Bookmark,
  Plus, Check, Sparkles, ArrowRight, AlertCircle
} from 'lucide-react';
import { FullAssessment, Language } from '../../types';
import { TRANSLATIONS } from '../../i18n/translations';
import { DEMO_SCENARIOS } from '../../data/demoScenarios';

interface Props {
  language: Language;
  onViewReport: (assessment: FullAssessment) => void;
  onNewAnalysis: () => void;
  currentAssessment: FullAssessment | null;
}

export const MobileReportsView: React.FC<Props> = ({
  language,
  onViewReport,
  onNewAnalysis,
  currentAssessment,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [reports, setReports] = useState<FullAssessment[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Load reports from localStorage only �" no fake demo data
  useEffect(() => {
    try {
      const stored = localStorage.getItem('grambiz_saved_reports');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setReports(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('Error reading saved reports:', e);
    }
    // Only show current assessment if available, otherwise empty
    if (currentAssessment) {
      setReports([currentAssessment]);
    } else {
      setReports([]);
    }
  }, [currentAssessment]);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the report for "${name}"?`)) {
      const updated = reports.filter((r) => r.id !== id);
      setReports(updated);
      try {
        localStorage.setItem('grambiz_saved_reports', JSON.stringify(updated));
      } catch (e) {}
      showToast('Report removed successfully.');
    }
  };

  const handleShare = (r: FullAssessment) => {
    const name = r.business.enterprise_name || r.business.custom_category || r.business.category;
    const score = r.business_analysis.feasibility_score.overall_score;
    const text = `Grambiz AI Report: ${name} in ${r.location.village} • Score ${score}/100 • Margin: ₹${r.capital.margin_capital.toLocaleString('en-IN')}`;

    if (navigator.share) {
      navigator.share({ title: name, text, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      showToast('Report summary copied to clipboard.');
    }
  };

  const handleSaveDownload = (r: FullAssessment) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(r, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Grambiz_Report_${((r.business.enterprise_name || r.business.custom_category || r.business.category) as string).replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Report saved / downloaded.');
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#0F172A] font-heading">
            My Reports
          </h1>
          <p className="text-xs text-[#68706D]">
            Saved feasibility analyses and viability assessments
          </p>
        </div>

        <button
          onClick={onNewAnalysis}
          className="py-2 px-3 rounded-xl bg-[#176B67] hover:bg-[#0F4E4B] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Analysis</span>
        </button>
      </div>

      {/* Toast Feedback */}
      {toastMsg && (
        <div className="bg-[#EDF3F1] border border-[#E5E1D8] text-[#252525] p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 stroke-[3] text-[#0F4E4B]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-[#E5E1D8] text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EDF3F1] text-[#0F4E4B] flex items-center justify-center mx-auto border border-[#E5E1D8]">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#252525]">No Reports Saved Yet</h3>
            <p className="text-xs text-[#68706D] max-w-xs mx-auto">
              Start an analysis to evaluate business feasibility, demand, and government schemes.
            </p>
          </div>
          <button
            onClick={onNewAnalysis}
            className="py-2.5 px-4 bg-[#176B67] hover:bg-[#0F4E4B] text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Start First Analysis
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const name = report.business.enterprise_name || report.business.custom_category || report.business.category;
            const score = report.business_analysis.feasibility_score.overall_score || 82;
            const isRecommended = score >= 80;
            const statusLabel = isRecommended ? 'Recommended' : 'Moderate';
            const statusColor = isRecommended
              ? 'bg-[#EDF3F1] text-[#0F4E4B] border-[#E5E1D8]'
              : 'bg-[#FBF6EA] text-[#A07C2E] border-[#F5D49A]';

            const formattedDate = new Date(report.created_at || Date.now()).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div
                key={report.id}
                className="bg-white rounded-2xl p-4 border border-[#E5E1D8] shadow-xs space-y-3 hover:border-[#E5E1D8] transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#252525] font-heading">
                      {name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-[#68706D] mt-0.5">
                      <MapPin className="w-3 h-3 text-[#0F4E4B]" />
                      <span>{report.location.village}, {report.location.district}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-black text-[#0F4E4B] font-heading">
                      {score} <span className="text-[10px] text-[#7FA99B] font-normal">/ 100</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>

                {/* Metadata details */}
                <div className="flex items-center justify-between text-[11px] text-[#68706D] pt-1 border-t border-[#E5E1D8]">
                  <span>Margin: ?{report.capital.margin_capital.toLocaleString('en-IN')}</span>
                  <span>Date: {formattedDate}</span>
                </div>

                {/* Actions: View, Save, Share, Delete */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  <button
                    onClick={() => onViewReport(report)}
                    className="py-1.5 px-1.5 sm:px-2 rounded-xl bg-[#176B67] hover:bg-[#0F4E4B] text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-colors whitespace-nowrap"
                  >
                    <Eye className="w-3.5 h-3.5 shrink-0" />
                    <span>View</span>
                  </button>

                  <button
                    onClick={() => handleSaveDownload(report)}
                    className="py-1.5 px-1.5 sm:px-2 rounded-xl bg-[#EDF3F1] hover:bg-[#E5E1D8] text-[#252525] font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-colors whitespace-nowrap"
                  >
                    <Bookmark className="w-3.5 h-3.5 shrink-0" />
                    <span>Save</span>
                  </button>

                  <button
                    onClick={() => handleShare(report)}
                    className="py-1.5 px-1.5 sm:px-2 rounded-xl bg-[#EDF3F1] hover:bg-[#E5E1D8] text-[#252525] font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-colors whitespace-nowrap"
                  >
                    <Share2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Share</span>
                  </button>

                  <button
                    onClick={() => handleDelete(report.id, name)}
                    className="py-1.5 px-1.5 sm:px-2 rounded-xl bg-[#EDF3F1] hover:bg-[#EDF3F1] text-[#0F4E4B] font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-colors whitespace-nowrap"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

