import React from 'react';
import { FullAssessment, Language } from '../types';
import { Printer, ArrowLeft, Sprout, Award, Database, ShieldCheck } from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';

interface Props {
  assessment: FullAssessment;
  language: Language;
  onBack: () => void;
}

export const FeasibilityReport: React.FC<Props> = ({ assessment, language, onBack }) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const { location, capital, business, financial_result: fin, business_analysis: biz, working_capital: wc, budget_allocation: budget } = assessment;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      
      {/* Top Toolbar */}
      <div className="no-print bg-[#252525] text-white p-4 rounded-2xl flex items-center justify-between shadow-lg">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-[#68706D] hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.nav_dashboard}</span>
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-[#7FA99B] hover:bg-[#EDF3F1]0 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>{t.print_report}</span>
        </button>
      </div>

      {/* PRINTABLE 20-SECTION REPORT */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-[#E5E1D8] shadow-md text-[#252525] space-y-8 text-xs leading-relaxed">
        
        {/* Header Block */}
        <div className="border-b-2 border-slate-900 pb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold">
                <Sprout className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-extrabold text-[#252525] font-heading">GramBiz AI</h1>
            </div>
            <p className="text-xs text-[#68706D] font-semibold uppercase tracking-wider mt-1">
              {t.report_title}  –  {t.report_sub}
            </p>
          </div>

          <div className="text-right text-[11px] text-[#68706D] space-y-0.5">
            <p className="font-bold text-[#252525]">Report ID: {assessment.id}</p>
            <p>Date: {new Date(assessment.created_at).toLocaleDateString('en-IN')}</p>
            <p className="text-[#176B67] font-bold">Status: Advisory Calculation</p>
          </div>
        </div>

        {/* 1. Executive Summary */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#252525] border-l-4 border-emerald-600 pl-3">
            1. Executive Summary
          </h2>
          <p className="text-[#252525]">
            This report evaluates establishing <strong>{business.business_name ? `${business.business_name} (${business.category})` : business.category}</strong> in <strong>{location.village}, {location.block}, {location.district}, {location.state}</strong>. Based on an available self-contributed margin of <strong>?{capital.margin_capital.toLocaleString('en-IN')}</strong>, the supported project cost is <strong>?{fin.project_cost.toLocaleString('en-IN')}</strong> with an estimated scheme loan of <strong>?{fin.loan_amount.toLocaleString('en-IN')}</strong> under the <strong>{fin.scheme_name}</strong>. Preliminary Feasibility Rating: <strong>{biz.feasibility_score.overall_score}/100 ({biz.feasibility_score.label})</strong> with <strong>{biz.confidence_rating.level} Confidence</strong> ({biz.confidence_rating.data_quality_label}).
          </p>
        </div>

        {/* Grid: 2. Profile, 3. Location, 4. Business Idea */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#F8F7F2] p-4 rounded-xl border border-[#E5E1D8]">
          <div className="space-y-1">
            <h3 className="font-bold text-[#252525]">2. Entrepreneur Profile</h3>
            <p>Experience: {business.experience || 'Beginner'}</p>
            <p>Own Contribution: ?{capital.margin_capital.toLocaleString('en-IN')} <span className="bg-[#E5E1D8] text-[#252525] font-bold text-[9px] px-1.5 py-0.5 rounded">USER PROVIDED</span></p>
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-[#252525]">3. Target Location</h3>
            <p>Village: {location.village}</p>
            <p>Block: {location.block}, {location.district}</p>
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-[#252525]">4. Business Venture</h3>
            {business.business_name && (
              <p>Enterprise: <strong className="text-[#176B67]">{business.business_name}</strong></p>
            )}
            <p>Category: {business.category}</p>
            <p>Premises: {business.location_status || 'Planning to rent'}</p>
          </div>
        </div>

        {/* 5. Market Reach & 6. Opportunity Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 bg-[#F8F7F2] p-4 rounded-xl border border-[#E5E1D8]">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-[#252525] border-l-3 border-teal-600 pl-2">5. Market Catchment Reach</h3>
              <span className="bg-teal-100 text-teal-800 text-[9px] font-bold px-1.5 py-0.5 rounded">ESTIMATED</span>
            </div>
            <p>• <strong>5km Radius:</strong> {biz.market_reach.radius_5km_reach}</p>
            <p>• <strong>10km Radius:</strong> {biz.market_reach.radius_10km_reach}</p>
          </div>

          <div className="space-y-2 bg-[#F8F7F2] p-4 rounded-xl border border-[#E5E1D8]">
            <h3 className="font-bold text-[#252525] border-l-3 border-teal-600 pl-2">6. Key Opportunities</h3>
            <ul className="space-y-1 text-[#252525]">
              {biz.opportunity_analysis.map((opp, i) => (
                <li key={i}>• {opp}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* 7. Competitor Analysis & 8. SWOT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 bg-[#F8F7F2] p-4 rounded-xl border border-[#E5E1D8]">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-[#252525]">7. Competitor Density</h3>
              <span className="bg-teal-100 text-teal-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                {biz.competitors && biz.competitors.length > 0 ? 'MAPPED POI DATA' : 'REGIONAL INDEX'}
              </span>
            </div>
            <p>Competitor Count: <strong>{biz.competitor_count}</strong></p>
            <p>Competition Level: <strong>{biz.competition_level}</strong></p>
            {biz.competitors && biz.competitors.length > 0 && (
              <div className="pt-2 border-t border-[#E5E1D8] text-[11px] space-y-1">
                <span className="font-bold text-[#252525] block">Nearby Mapped Outlets (Sample):</span>
                {biz.competitors.slice(0, 3).map((c, i) => (
                  <p key={i} className="text-[#68706D] truncate">• {c.name} ({c.distance_km} km away)</p>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 bg-[#F8F7F2] p-4 rounded-xl border border-[#E5E1D8]">
            <h3 className="font-bold text-[#252525]">8. SWOT Overview</h3>
            <p><strong>Strengths:</strong> {biz.swot.strengths.join(', ')}</p>
            <p><strong>Weaknesses:</strong> {biz.swot.weaknesses.join(', ')}</p>
          </div>
        </div>

        {/* 9. Risk Factors & Mitigations */}
        <div className="space-y-2">
          <h3 className="font-bold text-[#252525] border-l-4 border-[#C89B3C] pl-3">9. Local Risk Factors & Mitigations</h3>
          <table className="w-full text-left border-collapse border border-[#E5E1D8] text-[11px]">
            <thead>
              <tr className="bg-[#EDF3F1] font-bold text-[#252525]">
                <th className="p-2 border border-[#E5E1D8]">Risk Factor</th>
                <th className="p-2 border border-[#E5E1D8]">Severity</th>
                <th className="p-2 border border-[#E5E1D8]">Mitigation Strategy</th>
              </tr>
            </thead>
            <tbody>
              {biz.threats.map((t, idx) => (
                <tr key={idx} className="border-t border-[#E5E1D8]">
                  <td className="p-2 font-semibold text-[#252525]">{t.risk_name}</td>
                  <td className="p-2 font-bold">{t.severity}</td>
                  <td className="p-2 text-[#252525]">{t.mitigation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 10. Pricing, 11. Feasibility, 12. Confidence */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#EDF3F1] p-4 rounded-xl border border-[#A8CCC4] space-y-1">
            <h3 className="font-bold text-[#252525]">10. Pricing Guidance</h3>
            <p>Suggested Entry: <strong>{biz.pricing.suggested_starting_price}</strong></p>
            <p>Gross Margin: <strong>{biz.pricing.estimated_gross_margin}</strong></p>
          </div>

          <div className="bg-[#252525] text-white p-4 rounded-xl space-y-1">
            <h3 className="font-bold text-emerald-400">11. {t.overall_feasibility_score}</h3>
            <div className="text-2xl font-extrabold text-emerald-400 font-heading">
              {biz.feasibility_score.overall_score} / 100
            </div>
            <p className="text-[10px] text-[#68706D]">{biz.feasibility_score.label}</p>
          </div>

          <div className="bg-[#252525] text-white p-4 rounded-xl space-y-1">
            <h3 className="font-bold text-teal-400">12. Confidence Rating</h3>
            <div className="text-xl font-extrabold text-teal-300 font-heading">
              {biz.confidence_rating.level} Confidence
            </div>
            <p className="text-[10px] text-[#68706D]">{biz.confidence_rating.data_quality_label}</p>
          </div>
        </div>

        {/* 13. Financial Structure, 14. Scheme, 15. EMI */}
        <div className="space-y-3 bg-[#F8F7F2] p-5 rounded-xl border border-[#E5E1D8]">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-[#252525] text-sm">13 – 15. Financial & Concessional Scheme Structure</h3>
            <span className="bg-emerald-100 text-[#176B67] font-bold text-[10px] px-2 py-0.5 rounded border border-[#7FA99B]">VERIFIED SCHEME RULES</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px]">
            <div>
              <span className="text-[#68706D] block">{t.term_project_cost}</span>
              <span className="font-bold text-[#252525] text-sm">?{fin.project_cost.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-[#68706D] block">{t.term_loan_amount}</span>
              <span className="font-bold text-[#176B67] text-sm">?{fin.loan_amount.toLocaleString('en-IN')} (90%)</span>
            </div>
            <div>
              <span className="text-[#68706D] block">Applicable Scheme</span>
              <span className="font-bold text-[#252525]">{fin.scheme_name}</span>
            </div>
            <div>
              <span className="text-[#68706D] block">{t.term_emi}</span>
              <span className="font-bold text-[#176B67] text-sm">?{fin.monthly_emi.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="text-[11px] text-[#68706D] pt-2 border-t border-[#E5E1D8]">
            <span>Interest Rate: <strong>{fin.interest_rate}% p.a.</strong></span> | 
            <span className="ml-2">Tenure: <strong>{fin.tenure_years} Years</strong></span> | 
            <span className="ml-2">Initial Moratorium Relief: <strong>{fin.moratorium_months} Months</strong></span>
          </div>
        </div>

        {/* 16. Working Capital & 17. Budget */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#F8F7F2] p-4 rounded-xl border border-[#E5E1D8] space-y-1">
            <h3 className="font-bold text-[#252525]">16. Working Capital Reserve</h3>
            <p>Est. Monthly Operating Cost: <strong>?{wc.total_monthly_op_cost.toLocaleString('en-IN')}</strong></p>
            <p>Recommended 3-Month Reserve: <strong>?{wc.reserve_3_months.toLocaleString('en-IN')}</strong></p>
          </div>

          <div className="bg-[#F8F7F2] p-4 rounded-xl border border-[#E5E1D8] space-y-1">
            <h3 className="font-bold text-[#252525]">17. Project Cost Allocation</h3>
            <p>Equipment (40%): ?{(budget.project_cost * 0.40).toLocaleString('en-IN')}</p>
            <p>Inventory (25%): ?{(budget.project_cost * 0.25).toLocaleString('en-IN')}</p>
            <p>Infrastructure (15%): ?{(budget.project_cost * 0.15).toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* 17B. Business Performance Trajectory */}
        {biz.business_trajectory && (
          <div className="space-y-3 bg-gradient-to-r from-teal-50/60 via-white to-slate-50 p-5 rounded-xl border border-teal-200 text-xs">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-[#252525] text-sm">17B. {t.trajectory_heading}</h3>
              <span className="bg-teal-100 text-teal-800 font-bold text-[10px] px-2 py-0.5 rounded border border-teal-300">AI PROJECTION</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px]">
              <div>
                <span className="text-[#68706D] block">{t.monthly_revenue_title}</span>
                <span className="font-bold text-[#252525] text-sm">
                  ?{biz.business_trajectory.estimated_monthly_revenue_min.toLocaleString('en-IN')}  –  ?{biz.business_trajectory.estimated_monthly_revenue_max.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[#68706D] block">Est. Monthly Op. Cost</span>
                <span className="font-bold text-[#252525] text-sm">
                  ~?{biz.business_trajectory.estimated_monthly_op_cost.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[#68706D] block">{t.net_profit_title}</span>
                <span className="font-bold text-[#176B67] text-sm">
                  ?{biz.business_trajectory.estimated_net_profit_min.toLocaleString('en-IN')}  –  ?{biz.business_trajectory.estimated_net_profit_max.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[#68706D] block">{t.breakeven_title}</span>
                <span className="font-bold text-teal-700 text-sm">{biz.business_trajectory.breakeven_months}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E5E1D8] grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
              <div className="bg-white/80 p-2.5 rounded-lg border border-[#E5E1D8]">
                <strong className="text-[#252525] block font-semibold">Months 1 – 3: Launch</strong>
                <p className="text-[#68706D] mt-0.5">{biz.business_trajectory.timeline_stages.month_1_3}</p>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-[#E5E1D8]">
                <strong className="text-[#252525] block font-semibold">Months 4 – 6: Break-Even</strong>
                <p className="text-[#68706D] mt-0.5">{biz.business_trajectory.timeline_stages.month_4_6}</p>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-[#E5E1D8]">
                <strong className="text-[#252525] block font-semibold">Months 7 – 12: Expansion</strong>
                <p className="text-[#68706D] mt-0.5">{biz.business_trajectory.timeline_stages.month_7_12}</p>
              </div>
            </div>
          </div>
        )}

        {/* 18. Action Plan */}
        <div className="bg-[#252525] text-white p-5 rounded-xl space-y-3">
          <h3 className="font-bold text-emerald-400 text-sm">18. {t.action_plan_title}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[11px]">
            <div>
              <h4 className="font-bold text-amber-400 uppercase tracking-wider mb-1">1. THIS WEEK</h4>
              <ul className="space-y-1 text-[#68706D]">
                {biz.action_plan.this_week.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-teal-400 uppercase tracking-wider mb-1">2. BEFORE APPLYING</h4>
              <ul className="space-y-1 text-[#68706D]">
                {biz.action_plan.before_applying.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-rose-400 uppercase tracking-wider mb-1">3. BEFORE STARTING</h4>
              <ul className="space-y-1 text-[#68706D]">
                {biz.action_plan.before_starting.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 19. Data Quality Table */}
        <div className="space-y-2">
          <h3 className="font-bold text-[#252525] border-l-4 border-teal-600 pl-3">19. Data Quality & Source Transparency</h3>
          <table className="w-full text-left border-collapse border border-[#E5E1D8] text-[10px]">
            <thead>
              <tr className="bg-[#EDF3F1] font-bold text-[#252525]">
                <th className="p-2 border border-[#E5E1D8]">Data Field</th>
                <th className="p-2 border border-[#E5E1D8]">Quality Status</th>
                <th className="p-2 border border-[#E5E1D8]">Source Name</th>
                <th className="p-2 border border-[#E5E1D8]">Description</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(biz.data_sources).filter(v => typeof v === 'object' && 'field_name' in v).map((dp: any, idx) => (
                <tr key={idx} className="border-t border-[#E5E1D8]">
                  <td className="p-2 font-bold text-[#252525]">{dp.field_name}</td>
                  <td className="p-2 font-bold">{dp.status}</td>
                  <td className="p-2">{dp.source_name}</td>
                  <td className="p-2 text-[#68706D]">{dp.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 20. Official Legal Disclaimer */}
        <div className="border-t-2 border-[#E5E1D8] pt-6 text-[10px] text-[#68706D] space-y-2">
          <h4 className="font-bold text-[#252525] uppercase tracking-wider">20. {t.disclaimer_notice}</h4>
          <p className="leading-relaxed">
            {t.disclaimer_body}
          </p>
        </div>

      </div>

    </div>
  );
};
