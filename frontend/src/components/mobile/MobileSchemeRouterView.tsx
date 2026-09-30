import React, { useState } from 'react';
import {
  Landmark, ShieldCheck, CheckCircle2, AlertCircle, ExternalLink,
  HelpCircle, Sparkles, ArrowRight, ArrowLeft, ChevronDown, ChevronUp,
  Award, FileText, BadgePercent
} from 'lucide-react';
import { Language, FullAssessment } from '../../types';
import { TRANSLATIONS } from '../../i18n/translations';
import { SCHEME_CONFIGS } from '../../data/schemes';

interface Props {
  language: Language;
  assessment?: FullAssessment;
  onOpenCalculator?: () => void;
  onOpenAssistant?: () => void;
}

export const MobileSchemeRouterView: React.FC<Props> = ({
  language,
  assessment,
  onOpenCalculator,
  onOpenAssistant,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const marginCapital = assessment?.capital.margin_capital || 100000;
  const projectCost = assessment?.financial_result.project_cost || marginCapital / 0.10;
  const loanAmount = assessment?.financial_result.loan_amount || projectCost * 0.90;

  // Active scheme determination
  const isMicro = projectCost <= 140000;
  const recommendedScheme = isMicro ? SCHEME_CONFIGS[0] : SCHEME_CONFIGS[1];

  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>(recommendedScheme.id);

  const ALL_SCHEMES = [
    {
      id: recommendedScheme.id,
      isTop: true,
      name: recommendedScheme.name,
      portalName: 'PMEGP / NBCFDC Direct Financing Portal',
      url: 'https://www.kviconline.gov.in/pmegpeportal/',
      maxLimitText: isMicro ? '?1.40 Lakh' : '?50.00 Lakh',
      interestRate: `${recommendedScheme.interestRate}% p.a.`,
      tenure: `${recommendedScheme.tenureYears} Years`,
      moratorium: `${recommendedScheme.moratoriumMonths} Months`,
      subsidy: 'Up to 35% Rural Subsidy under PMEGP',
      ownContribution: '10% (Beneficiary Equity)',
      whyMatch: isMicro
        ? `Your calculated Project Cost (?${projectCost.toLocaleString('en-IN')}) is = ?1,40,000, perfectly qualifying for the Micro Finance Scheme with 6.5% interest.`
        : `Your calculated Project Cost (?${projectCost.toLocaleString('en-IN')}) falls in the ?1.40L to ?50L tier, matching the Term Loan Scheme with 7-year tenure and 6-month moratorium relief.`,
      conditions: [
        'Applicant must be at least 18 years old.',
        'No educational qualification required up to ?10 Lakh in manufacturing.',
        'Mandatory 3-month working capital cushion.',
      ],
    },
    {
      id: 'mudra-kishor',
      isTop: false,
      name: 'Pradhan Mantri MUDRA Yojana (Kishor / Tarun)',
      portalName: 'Udyami Mitra National Portal',
      url: 'https://www.udyamimitra.in/',
      maxLimitText: 'Up to ?10.00 Lakh',
      interestRate: '8.5%  –  10.0% p.a.',
      tenure: '3 to 5 Years',
      moratorium: '3 Months',
      subsidy: 'Nil (Collateral-Free Credit Guarantee)',
      ownContribution: '10%  –  15%',
      whyMatch:
        'Collateral-free credit for non-corporate micro/small enterprises in rural and semi-urban hubs.',
      conditions: [
        'Zero third-party collateral or guarantor required.',
        'MUDRA Debit Card issued for working capital withdrawals.',
      ],
    },
    {
      id: 'stand-up-india',
      isTop: false,
      name: 'Stand-Up India Scheme',
      portalName: 'Stand-Up Mitra Portal',
      url: 'https://www.standupmitra.in/',
      maxLimitText: '?10 Lakh to ?1.00 Crore',
      interestRate: 'Bank Base Rate + 3%',
      tenure: 'Up to 7 Years',
      moratorium: 'Up to 18 Months',
      subsidy: 'Margin Money Subsidy / State Alignment',
      ownContribution: '15%  –  25%',
      whyMatch:
        'Designed specifically for SC/ST and Women Entrepreneurs starting greenfield ventures.',
      conditions: [
        'At least 51% shareholding held by SC/ST or woman entrepreneur.',
        'Greenfield (first-time) enterprise in manufacturing, services, or trading.',
      ],
    },
  ];

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Header Banner */}
      <div className="mobile-card p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EDF3F1] text-[#0F4E4B] border border-[#E5E1D8] flex items-center justify-center font-bold shrink-0 shadow-2xs">
            <Landmark className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-extrabold text-[#252525] font-heading leading-tight">
              {t.mobile_scheme_router || 'Government Scheme Router'}
            </h1>
            <p className="text-[11px] text-[#68706D] mt-0.5 truncate">
              Concessional financing aligned to Project Cost: ?{projectCost.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Top Recommended Hero Card */}
      <div className="mobile-card p-4 space-y-3 border border-[#E5E1D8] bg-gradient-to-br from-rose-50/70 via-white to-blue-50/50 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="bg-[#176B67] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider shadow-2xs shrink-0">
            <Sparkles className="w-3 h-3 fill-amber-400" />
            <span>Top Recommended Match</span>
          </span>
          <span className="text-xs font-black text-[#0F4E4B] shrink-0">
            {ALL_SCHEMES[0].interestRate}
          </span>
        </div>

        <div className="space-y-0.5">
          <h2 className="text-base font-black text-[#252525] font-heading leading-tight">
            {ALL_SCHEMES[0].name}
          </h2>
          <p className="text-[11px] text-[#68706D]">{ALL_SCHEMES[0].portalName}</p>
        </div>

        {/* Why this scheme box */}
        <div className="bg-white border border-rose-100 rounded-xl p-3 space-y-1 shadow-2xs">
          <div className="text-[11px] font-extrabold text-[#252525] flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-[#0F4E4B] shrink-0" />
            <span>{t.mobile_why_this_scheme || 'Why this scheme?'}</span>
          </div>
          <p className="text-xs text-[#252525] leading-relaxed font-medium">
            {ALL_SCHEMES[0].whyMatch}
          </p>
        </div>

        {/* 4 Financial Parameters */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white p-2.5 rounded-xl border border-[#E5E1D8] shadow-2xs flex flex-col justify-between">
            <span className="text-[10px] text-[#7FA99B] font-bold uppercase tracking-wider">Max Scheme Loan</span>
            <div className="text-xs font-black text-[#252525] mt-1">
              {ALL_SCHEMES[0].maxLimitText}
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-[#E5E1D8] shadow-2xs flex flex-col justify-between">
            <span className="text-[10px] text-[#7FA99B] font-bold uppercase tracking-wider">Repayment Tenure</span>
            <div className="text-xs font-black text-[#252525] mt-1">
              {ALL_SCHEMES[0].tenure}
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-[#E5E1D8] shadow-2xs flex flex-col justify-between">
            <span className="text-[10px] text-[#7FA99B] font-bold uppercase tracking-wider">Moratorium Relief</span>
            <div className="text-xs font-black text-[#0F4E4B] mt-1">
              {ALL_SCHEMES[0].moratorium}
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-[#E5E1D8] shadow-2xs flex flex-col justify-between">
            <span className="text-[10px] text-[#7FA99B] font-bold uppercase tracking-wider">Own Equity (10%)</span>
            <div className="text-xs font-black text-[#252525] mt-1">
              ?{marginCapital.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Subsidy Highlight */}
        <div className="bg-[#FBF6EA]/90 border border-[#F5D49A] rounded-xl p-3 text-xs text-amber-900 flex items-center justify-between gap-2 font-bold">
          <div className="flex items-center gap-1.5 shrink-0">
            <Award className="w-4 h-4 text-[#C89B3C] shrink-0" />
            <span className="text-[11px] text-[#A07C2E]">Govt Subsidy:</span>
          </div>
          <span className="text-amber-950 font-black text-xs text-right truncate">{ALL_SCHEMES[0].subsidy}</span>
        </div>

        {/* Apply Link */}
        <a
          href={ALL_SCHEMES[0].url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-[#176B67] hover:bg-[#0F4E4B] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <span>Apply on Official Portal (Free)</span>
          <ExternalLink className="w-3.5 h-3.5 text-white shrink-0" />
        </a>
      </div>

      {/* 3. Other Available Government Schemes (Accordion) */}
      <div className="space-y-2.5 pt-1">
        <h3 className="text-xs font-bold text-[#68706D] uppercase tracking-wide px-1">
          Compare Other Eligible Schemes
        </h3>

        {ALL_SCHEMES.slice(1).map((scheme) => {
          const isExpanded = expandedSchemeId === scheme.id;
          return (
            <div key={scheme.id} className="mobile-card overflow-hidden">
              <button
                onClick={() => setExpandedSchemeId(isExpanded ? null : scheme.id)}
                className="w-full p-3.5 text-left flex items-center justify-between bg-[#F8F7F2] hover:bg-[#EDF3F1] transition-colors gap-2 cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-extrabold text-[#252525] font-heading truncate">
                    {scheme.name}
                  </div>
                  <div className="text-[10px] text-[#68706D] mt-0.5">
                    {scheme.maxLimitText} • {scheme.interestRate}
                  </div>
                </div>
                <div className="p-1 rounded-lg bg-white border border-[#E5E1D8] text-[#68706D] shrink-0">
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </button>

              {isExpanded && (
                <div className="p-3.5 space-y-3 bg-white border-t border-[#E5E1D8] text-xs">
                  <p className="text-[#68706D] leading-relaxed">{scheme.whyMatch}</p>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#F8F7F2] p-2 rounded-lg border border-[#E5E1D8]">
                      <span className="text-[10px] text-[#7FA99B]">Tenure</span>
                      <div className="font-bold text-[#252525]">{scheme.tenure}</div>
                    </div>
                    <div className="bg-[#F8F7F2] p-2 rounded-lg border border-[#E5E1D8]">
                      <span className="text-[10px] text-[#7FA99B]">Moratorium</span>
                      <div className="font-bold text-[#252525]">{scheme.moratorium}</div>
                    </div>
                  </div>

                  <a
                    href={scheme.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full min-h-[40px] py-2 px-3 rounded-xl bg-[#EDF3F1] hover:bg-[#E5E1D8] text-[#252525] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Visit Official Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Official Portals Trust Badge */}
      <div className="text-center text-[10px] text-[#7FA99B] pt-2 px-2">
        {t.official_portals_trust || 'Only authentic Government of India links displayed • 100% Free & Zero Mediator Commission'}
      </div>
    </div>
  );
};
