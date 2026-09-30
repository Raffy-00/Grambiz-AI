import React from 'react';
import {
  Language, LocationData, FullAssessment, UserDraftData
} from '../../types';
import {
  Compass, CheckCircle2, Circle, ArrowRight, Layers,
  ChevronRight, Building2, MapPin, Calculator, ShieldCheck,
  Award, Landmark, Clock, FileText, Check, TrendingUp,
  AlertCircle, Sparkles, SlidersHorizontal, BarChart3
} from 'lucide-react';
import { WORKFLOW_TRANSLATIONS } from '../../i18n/workflowTranslations';
import { IndividualStepViewer } from './IndividualStepViewer';
import { MobileAnalysisWizard } from '../mobile/MobileAnalysisWizard';

interface Props {
  language: Language;
  initialCapital?: number;
  initialCategory?: string;
  defaultLocation: LocationData;
  activeDraft: UserDraftData | null;
  onSaveDraft: (draft: Partial<UserDraftData>) => void;
  onAnalysisComplete: (assessment: FullAssessment) => void;
  onCancel: () => void;
  isMobileShell?: boolean;
  analysisModeExternal?: 'full' | 'individual';
  onAnalysisModeChange?: (mode: 'full' | 'individual') => void;
  focusedStepExternal?: number | null;
  onFocusedStepChange?: (step: number | null) => void;
  hideModeSwitch?: boolean;
}

export const BusinessAnalysisHub: React.FC<Props> = ({
  language,
  initialCapital = 100000,
  initialCategory = 'Dairy',
  defaultLocation,
  activeDraft,
  onSaveDraft,
  onAnalysisComplete,
  onCancel,
  isMobileShell = false,
  analysisModeExternal,
  onAnalysisModeChange,
  focusedStepExternal,
  onFocusedStepChange,
  hideModeSwitch = false,
}) => {
  const t = WORKFLOW_TRANSLATIONS[language] || WORKFLOW_TRANSLATIONS.en;

  // All navigation state is controlled from App.tsx via props — never resets on re-render
  const analysisMode: 'full' | 'individual' = analysisModeExternal ?? 'full';
  const focusedStep: number | null = focusedStepExternal !== undefined ? focusedStepExternal : null;

  const setAnalysisMode = (mode: 'full' | 'individual') => {
    onAnalysisModeChange?.(mode);
  };
  const setFocusedStep = (step: number | null) => {
    onFocusedStepChange?.(step);
  };

  // Track completed steps from activeDraft
  const completedSteps = activeDraft?.completed_steps || [];
  const completedCount = completedSteps.length;
  const progressPercent = Math.min(Math.round((completedCount / 10) * 100), 100);

  // Metadata for the 10 Individual Steps
  const STEPS_DIRECTORY = [
    {
      step: 1,
      title: 'Business Idea & Venture Category',
      subtitle: 'Category selection, venture name & business model',
      icon: Building2,
      summary: activeDraft?.business_data?.category || 'Dairy / Retail / Grocery',
    },
    {
      step: 2,
      title: 'Location Selection & Demographics',
      subtitle: 'Operating village, block, district and GPS coordinates',
      icon: MapPin,
      summary: activeDraft?.location_data?.village
        ? `${activeDraft.location_data.village}, ${activeDraft.location_data.district || defaultLocation.district}`
        : `${defaultLocation.village}, ${defaultLocation.district}`,
    },
    {
      step: 3,
      title: 'Hyper-Local Market & Competitor Map',
      subtitle: 'Interactive catchment map & competitor saturation',
      icon: Compass,
      summary: `${activeDraft?.location_data?.village || defaultLocation.village} · 5km & 10km Radius Map`,
    },
    {
      step: 4,
      title: 'SWOT & Local Threat Analysis',
      subtitle: 'Internal strengths, weaknesses & mitigations',
      icon: ShieldCheck,
      summary: 'Recurring cash flow • Raw material forward contract',
    },
    {
      step: 5,
      title: 'Product Market Value & Pricing Strategy',
      subtitle: 'Unit cost, retail pricing & margin benchmarks',
      icon: TrendingUp,
      summary: activeDraft?.pricing_data?.selling_price
        ? `₹${activeDraft.pricing_data.selling_price} / ${activeDraft.pricing_data.unit_label || 'unit'} • ${activeDraft.pricing_data.selling_price > 0 ? Math.round(((activeDraft.pricing_data.selling_price - (activeDraft.pricing_data.unit_cost || 0)) / activeDraft.pricing_data.selling_price) * 100) : 0}% gross margin`
        : '₹52 retail • 23% estimated gross margin',
    },
    {
      step: 6,
      title: 'Smart Financial Calculator & Budget Allocation',
      subtitle: '10% self-margin equity, 90% debt & itemized project cost allocation',
      icon: Calculator,
      isAllocate: true,
      summary: activeDraft?.capital_data?.margin_capital
        ? `₹${activeDraft.capital_data.margin_capital.toLocaleString('en-IN')} Margin • ₹${(activeDraft.capital_data.margin_capital / 100000).toFixed(1)}L Project • Itemized Budget`
        : '₹1,00,000 Margin • ₹10.0L Project • Itemized Budget',
    },
    {
      step: 7,
      title: 'Government Scheme Recommendation',
      subtitle: 'Auto-matched PMEGP & MUDRA subsidy support',
      icon: Landmark,
      summary: (activeDraft?.capital_data?.margin_capital || 100000) <= 14000
        ? 'Micro Finance Concessional Scheme (6.5% p.a.)'
        : 'PMEGP / Term Loan Assistance Scheme (8.0% p.a.)',
    },
    {
      step: 8,
      title: 'EMI & Repayment Planning',
      subtitle: 'Moratorium grace period & monthly amortization',
      icon: Clock,
      summary: '3 to 6 months moratorium • Low interest tenure',
    },
    {
      step: 9,
      title: 'Final Feasibility Result',
      subtitle: 'Overall viability scoring & bankability evaluation',
      icon: Award,
      summary: '84 / 100 Score • Suitable for Credit Underwriting',
    },
    {
      step: 10,
      title: 'Printable Feasibility & DPR Report',
      subtitle: 'Official Detailed Project Report formatted for printing and bank loan sanction',
      icon: FileText,
      summary: 'Complete bank appraisal & itemized budget ready for print',
    },
  ];

  // If a single step is opened in isolation
  if (focusedStep !== null) {
    return (
      <IndividualStepViewer
        language={language}
        stepNumber={focusedStep}
        activeDraft={activeDraft}
        defaultLocation={defaultLocation}
        onSaveStep={(partial, markCompleted) => {
          onSaveDraft(partial);
        }}
        onBackToSteps={() => setFocusedStep(null)}
        onGoToStep={(step) => setFocusedStep(step)}
        onCompleteAnalysis={onAnalysisComplete}
      />
    );
  }

  // If the user selected Full Guided Journey
  if (analysisMode === 'full') {
    return (
      <div className="space-y-4 max-w-5xl mx-auto font-sans">
        <MobileAnalysisWizard
          language={language}
          initialCapital={initialCapital}
          initialCategory={initialCategory}
          defaultLocation={defaultLocation}
          activeDraft={activeDraft}
          onSaveDraft={onSaveDraft}
          onAnalysisComplete={onAnalysisComplete}
          onCancel={() => setAnalysisMode('individual')}
        />
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // INDIVIDUAL BUSINESS ANALYSIS STEPS HUB
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-12 font-sans">
      {/* 3. INDIVIDUAL ANALYSIS STEPS DIRECTORY (10 Interactive Cards) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
          <h2 className="text-xs sm:text-sm font-black text-[#252525] uppercase tracking-wider font-heading">
            {t.web_hub_directory_title || 'Select Analysis Step to Examine'}
          </h2>
          <span className="text-[11px] sm:text-xs text-[#68706D]">
            {t.web_hub_directory_sub || 'Click any step to analyze independently'}
          </span>
        </div>

        <div className="flex flex-col space-y-2.5 sm:space-y-3">
          {STEPS_DIRECTORY.map((item) => {
            const Icon = item.icon;
            const isCompleted = completedSteps.includes(item.step);

            return (
              <div
                key={item.step}
                onClick={() => setFocusedStep(item.step)}
                className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 sm:gap-4 bg-white hover:border-[#E5E1D8] hover:shadow-md active:scale-[0.99] group ${
                  isCompleted
                    ? 'border-[#A8CCC4]/90 shadow-xs'
                    : 'border-[#E5E1D8]/90 shadow-xs'
                }`}
              >
                {/* Left: Step Icon + Details in a single horizontal bar */}
                <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-2xs ${
                      isCompleted
                        ? 'bg-[#7FA99B] text-white shadow-emerald-600/20'
                        : 'bg-[#252525] text-white shadow-slate-900/10 group-hover:bg-[#252525]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Middle: Step Number, Status badge, Full Title & Description */}
                  <div className="min-w-0 flex-1">
                    {/* Top Row: Status pill */}
                    <div className="flex items-center gap-2 mb-1">
                      {/* Status indicator */}
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#176B67] bg-[#EDF3F1] border border-[#A8CCC4] px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap shadow-2xs">
                          <CheckCircle2 className="w-3 h-3 text-[#7FA99B] shrink-0" />
                          <span>{t.web_hub_completed_tag || 'Completed'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#7FA99B] bg-[#F8F7F2] border border-[#E5E1D8] px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                          <Circle className="w-2.5 h-2.5 text-[#68706D] shrink-0" />
                          <span>{language === 'ta' ? 'முடிக்கப்படவில்லை' : language === 'hi' ? 'अपूर्ण' : language === 'te' ? 'పూర్తి కాలేదు' : language === 'ml' ? 'പൂർത്തിയായില്ല' : language === 'kn' ? 'ಪೂರ್ಣಗೊಂಡಿಲ್ಲ' : 'Not Completed'}</span>
                        </span>
                      )}
                    </div>

                    {/* Step Title: FULL PROCESS NAME SHOWN */}
                    <h3 className="text-sm sm:text-base font-extrabold text-[#252525] font-heading leading-snug group-hover:text-emerald-900 transition-colors">
                      {item.title}
                    </h3>

                    {/* Subtitle */}
                    <p className="text-xs text-[#68706D] mt-0.5 leading-relaxed">
                      {item.subtitle}
                    </p>

                    {/* Summary Tag */}
                    <div className="mt-1.5 flex items-center">
                      <span className="inline-flex items-center text-[10.5px] font-medium text-[#252525] bg-[#EDF3F1] border border-[#E5E1D8]/80 px-2 py-0.5 rounded-md truncate max-w-[240px] sm:max-w-md">
                        {item.summary}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Analyze Button */}
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#EDF3F1] text-[#252525] group-hover:bg-[#252525] group-hover:text-white transition-all font-heading font-bold text-xs shrink-0 shadow-2xs">
                  <span>{language === 'ta' ? 'ஆய்வு செய்' : language === 'hi' ? 'विश्लेषण' : language === 'te' ? 'విశ్లేషించండి' : language === 'ml' ? 'പരിശോധി�•്�•ു�•' : language === 'kn' ? 'ವಿಶ್ಲೇಷಿಸಿ' : 'Analyze'}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#7FA99B] group-hover:text-white group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

