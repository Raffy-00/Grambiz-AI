import React, { useState } from 'react';
import {
  Rocket, CheckCircle2, Square, CheckSquare, Calendar, ArrowLeft,
  MapPin, Landmark, Calculator, Bot, ChevronRight, ShieldAlert,
  Sparkles, DollarSign, Award
} from 'lucide-react';
import { FullAssessment, Language, ActionPlan } from '../../types';
import { TRANSLATIONS } from '../../i18n/translations';

interface Props {
  assessment?: FullAssessment;
  language: Language;
  onReviewMarket: () => void;
  onCompareSchemes: () => void;
  onRecalculateLoan: () => void;
  onAskAIAdvisor: () => void;
}

export const MobileActionPlanView: React.FC<Props> = ({
  assessment,
  language,
  onReviewMarket,
  onCompareSchemes,
  onRecalculateLoan,
  onAskAIAdvisor,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const bizAnalysis = assessment?.business_analysis;

  const defaultActionPlan: ActionPlan = {
    this_week: [
      `Interview 15 local residents in ${assessment?.location.village || 'your village'} regarding product demand.`,
      'Survey 2 nearest town competitors to document retail price points.',
      'Get wholesale material quotes from 2 registered regional distributors.',
    ],
    before_applying: [
      'Finalize itemized business project budget allocation.',
      'Assemble applicant KYC dossier (Aadhaar, PAN card, Bank Passbook, Rental deed).',
      'Meet Lead District Bank branch manager to confirm PMEGP/MUDRA application window.',
    ],
    before_starting: [
      'Reserve mandatory 3-month working capital liquidity cushion.',
      'Execute formal lease agreement for shop/production unit premises.',
      'Establish UPI QR payment gateway for zero-credit cash flow.',
    ],
  };

  const actionPlan = bizAnalysis?.action_plan || defaultActionPlan;

  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(`grambiz_tasks_${assessment?.id || 'default'}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return actionPlan.checked_tasks || {};
  });

  const toggleTask = (key: string) => {
    const next = { ...checkedTasks, [key]: !checkedTasks[key] };
    setCheckedTasks(next);
    try {
      localStorage.setItem(`grambiz_tasks_${assessment?.id || 'default'}`, JSON.stringify(next));
    } catch (e) {}
  };

  const allTaskKeys = [
    ...actionPlan.this_week.map((_, i) => `week-${i}`),
    ...actionPlan.before_applying.map((_, i) => `apply-${i}`),
    ...actionPlan.before_starting.map((_, i) => `start-${i}`),
  ];

  const completedCount = allTaskKeys.filter((k) => !!checkedTasks[k]).length;
  const totalTasks = allTaskKeys.length;
  const progressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Header Banner */}
      <div className="mobile-card p-4 space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#176B67] flex items-center justify-center font-bold">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-[#252525] font-heading">
              Personalized Action Plan Roadmap
            </h1>
            <p className="text-[11px] text-[#68706D]">
              Grassroots milestones from validation to loan disbursement
            </p>
          </div>
        </div>
      </div>

      {/* 2. Executive Summary Roadmap Card */}
      {assessment && (
        <div className="mobile-card p-4 space-y-3 bg-gradient-to-br from-[#0A2540] to-slate-900 text-white">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">
              Roadmap Blueprint
            </span>
            <span className="text-xs font-extrabold bg-[#EDF3F1]0/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              Score: {assessment.business_analysis.feasibility_score.overall_score}/100
            </span>
          </div>

          <div>
            <h2 className="text-base font-extrabold font-heading text-white">
              {assessment.business.custom_category || assessment.business.category}
            </h2>
            <div className="text-xs text-[#68706D] mt-0.5">
              Target Location: {assessment.location.village}, {assessment.location.district}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="bg-white/10 rounded-xl p-2.5">
              <span className="text-[10px] text-[#7FA99B] uppercase">Your Investment</span>
              <div className="font-extrabold text-white mt-0.5">
                ?{assessment.capital.margin_capital.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-teal-300">10% Own Contribution</span>
            </div>

            <div className="bg-white/10 rounded-xl p-2.5">
              <span className="text-[10px] text-[#7FA99B] uppercase">Scheme Funding</span>
              <div className="font-extrabold text-emerald-400 mt-0.5">
                ?{Math.round(assessment.financial_result.loan_amount).toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-[#68706D]">
                {assessment.financial_result.scheme_name.split(' ')[0]}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Milestone Completion Progress Bar */}
      <div className="mobile-card p-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-[#252525]">Milestone Progress</span>
          <span className="font-bold text-[#176B67]">
            {completedCount} of {totalTasks} Tasks Done ({progressPct}%)
          </span>
        </div>
        <div className="w-full h-2 bg-[#E5E1D8] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#7FA99B] rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* 4. Interactive Checklist Accordions */}
      {/* Stage 1: This Week */}
      <div className="mobile-card p-4 space-y-3 border-l-4 border-l-emerald-600">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-[#252525] uppercase tracking-wide flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#7FA99B]" />
            <span>Phase 1: Immediate Field Validation (This Week)</span>
          </span>
        </div>

        <div className="space-y-2">
          {actionPlan.this_week.map((task, i) => {
            const key = `week-${i}`;
            const isDone = !!checkedTasks[key];
            return (
              <div
                key={key}
                onClick={() => toggleTask(key)}
                className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  isDone ? 'bg-[#EDF3F1] border-[#A8CCC4]' : 'bg-[#F8F7F2] border-[#E5E1D8]'
                }`}
              >
                {isDone ? (
                  <CheckSquare className="w-4 h-4 text-[#7FA99B] shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-[#7FA99B] shrink-0 mt-0.5" />
                )}
                <span
                  className={`text-xs ${
                    isDone ? 'line-through text-[#68706D]' : 'text-[#252525] font-medium'
                  }`}
                >
                  {task}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage 2: Before Applying */}
      <div className="mobile-card p-4 space-y-3 border-l-4 border-l-[#176B67]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-[#252525] uppercase tracking-wide flex items-center gap-1.5">
            <Landmark className="w-4 h-4 text-[#176B67]" />
            <span>Phase 2: Loan Documentation & Bank Formalities</span>
          </span>
        </div>

        <div className="space-y-2">
          {actionPlan.before_applying.map((task, i) => {
            const key = `apply-${i}`;
            const isDone = !!checkedTasks[key];
            return (
              <div
                key={key}
                onClick={() => toggleTask(key)}
                className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  isDone ? 'bg-[#EDF3F1] border-[#E5E1D8]' : 'bg-[#F8F7F2] border-[#E5E1D8]'
                }`}
              >
                {isDone ? (
                  <CheckSquare className="w-4 h-4 text-[#176B67] shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-[#7FA99B] shrink-0 mt-0.5" />
                )}
                <span
                  className={`text-xs ${
                    isDone ? 'line-through text-[#68706D]' : 'text-[#252525] font-medium'
                  }`}
                >
                  {task}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage 3: Before Starting */}
      <div className="mobile-card p-4 space-y-3 border-l-4 border-l-[#F59E0B]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-[#252525] uppercase tracking-wide flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#F59E0B]" />
            <span>Phase 3: Operational Launch & Working Capital Setup</span>
          </span>
        </div>

        <div className="space-y-2">
          {actionPlan.before_starting.map((task, i) => {
            const key = `start-${i}`;
            const isDone = !!checkedTasks[key];
            return (
              <div
                key={key}
                onClick={() => toggleTask(key)}
                className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  isDone ? 'bg-[#FFFBEB] border-rose-400/40' : 'bg-[#F8F7F2] border-[#E5E1D8]'
                }`}
              >
                {isDone ? (
                  <CheckSquare className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-[#7FA99B] shrink-0 mt-0.5" />
                )}
                <span
                  className={`text-xs ${
                    isDone ? 'line-through text-[#68706D]' : 'text-[#252525] font-medium'
                  }`}
                >
                  {task}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. 4 Quick Action Shortcuts Mandated */}
      <div className="space-y-2 pt-2">
        <h3 className="text-xs font-bold text-[#68706D] uppercase tracking-wide px-1">
          Next Advisory Actions:
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onReviewMarket}
            className="mobile-card-interactive p-3 text-left space-y-1"
          >
            <MapPin className="w-4 h-4 text-[#7FA99B]" />
            <div className="text-xs font-extrabold text-[#252525]">Review Market</div>
            <div className="text-[10px] text-[#68706D]">Catchment & competitors</div>
          </button>

          <button
            onClick={onCompareSchemes}
            className="mobile-card-interactive p-3 text-left space-y-1"
          >
            <Landmark className="w-4 h-4 text-[#176B67]" />
            <div className="text-xs font-extrabold text-[#252525]">Compare Schemes</div>
            <div className="text-[10px] text-[#68706D]">PMEGP, MUDRA & limits</div>
          </button>

          <button
            onClick={onRecalculateLoan}
            className="mobile-card-interactive p-3 text-left space-y-1"
          >
            <Calculator className="w-4 h-4 text-[#C89B3C]" />
            <div className="text-xs font-extrabold text-[#252525]">Recalculate Loan</div>
            <div className="text-[10px] text-[#68706D]">EMI & working capital</div>
          </button>

          <button
            onClick={onAskAIAdvisor}
            className="mobile-card-interactive p-3 text-left space-y-1"
          >
            <Bot className="w-4 h-4 text-purple-600" />
            <div className="text-xs font-extrabold text-[#252525]">Ask AI Advisor</div>
            <div className="text-[10px] text-[#68706D]">Voice questions & advice</div>
          </button>
        </div>
      </div>
    </div>
  );
};
