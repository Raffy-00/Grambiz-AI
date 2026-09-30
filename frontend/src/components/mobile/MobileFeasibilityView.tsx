import React, { useState } from 'react';
import {
  MapPin, CheckCircle2, ArrowRight, ArrowLeft, ShieldAlert,
  TrendingUp, Award, DollarSign, Landmark, Calculator,
  Sparkles, Store, Share2, Bookmark, Check, ChevronDown,
  ChevronUp, ExternalLink, Info, AlertTriangle, Layers, BarChart3,
  Calendar, Clock, Percent, ShieldCheck, Printer, FileText
} from 'lucide-react';
import { FullAssessment, Language } from '../../types';
import { TRANSLATIONS } from '../../i18n/translations';
import { GoogleMarketMap } from '../GoogleMarketMap';

interface Props {
  assessment: FullAssessment;
  language: Language;
  onNavigateToCalculator: () => void;
  onNavigateToSchemes: () => void;
  onNavigateToAssistant: () => void;
  onNavigateToActionPlan?: () => void;
}

export const MobileFeasibilityView: React.FC<Props> = ({
  assessment,
  language,
  onNavigateToCalculator,
  onNavigateToSchemes,
  onNavigateToAssistant,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const { location, capital, business, financial_result: fin, business_analysis: biz } = assessment;

  // Active section tab: 'verdict' | 'market' | 'opportunity' | 'financial' | 'risk'
  const [activeSection, setActiveSection] = useState<'verdict' | 'market' | 'opportunity' | 'financial' | 'risk'>('verdict');

  // Action plan step check states
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
  });

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);

  const score = biz?.feasibility_score?.overall_score || 82;
  const marginCap = fin?.margin_capital || 100000;
  const projectCost = fin?.project_cost || marginCap * 10;
  const loanAmt = fin?.loan_amount || marginCap * 9;
  const interestRate = fin?.interest_rate || 8.0;
  const tenure = fin?.tenure_years || 7;
  const moratorium = fin?.moratorium_months || 6;
  const monthlyEmi = fin?.monthly_emi || Math.round(loanAmt * 0.015);
  const totalInterest = fin?.total_interest || Math.round(loanAmt * 0.28);
  const totalRepayment = fin?.total_repayment || Math.round(loanAmt * 1.28);

  const toggleStep = (stepNum: number) => {
    setCompletedSteps((prev) => ({ ...prev, [stepNum]: !prev[stepNum] }));
  };

  const handleSavePlan = () => {
    try {
      const existing = JSON.parse(localStorage.getItem('grambiz_saved_reports') || '[]');
      const updated = [assessment, ...existing.filter((r: any) => r.id !== assessment.id)];
      localStorage.setItem('grambiz_saved_reports', JSON.stringify(updated));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Grambiz AI Feasibility: ${business.custom_category || business.category}`,
        text: `Business Feasibility Score ${score}/100 in ${location.village}. Required capital: ?${marginCap.toLocaleString('en-IN')}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `Grambiz AI Feasibility Report for ${business.custom_category || business.category} in ${location.village}: Score ${score}/100. Capital: ?${marginCap.toLocaleString('en-IN')}.`
      );
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    }
  };

  // Circular gauge calculations
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="space-y-4 pb-12">
      {/* 1. TOP BUSINESS IDENTITY HEADER */}
      <div className="bg-white rounded-2xl p-4 border border-[#E5E1D8] shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-[#176B67] uppercase tracking-wider">
            Business Feasibility Report
          </span>
          <h1 className="text-base font-black text-[#1E293B] font-heading truncate max-w-[210px]">
            {business.custom_category || business.category}
          </h1>
          <div className="flex items-center gap-1 text-xs text-[#68706D] font-medium">
            <MapPin className="w-3 h-3 text-[#176B67]" />
            <span>{location.village}, {location.district}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#176B67] hover:bg-[#0F4E4B] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            title="Print Report"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print Report</span>
          </button>
          <button
            onClick={handleShare}
            className="p-2 rounded-xl bg-[#EDF3F1] text-[#68706D] hover:text-[#176B67] active:scale-95 transition-colors cursor-pointer"
            title="Share report"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleSavePlan}
            className={`p-2 rounded-xl active:scale-95 transition-all cursor-pointer ${
              savedSuccess ? 'bg-[#EDF3F1] text-[#176B67] border border-[#E5E1D8]' : 'bg-[#EDF3F1] text-[#176B67]'
            }`}
            title="Save report"
          >
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications Toast */}
      {savedSuccess && (
        <div className="bg-[#EDF3F1] border border-[#E5E1D8] text-[#176B67] p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-[#176B67] stroke-[3]" />
          <span>Business plan successfully saved to My Reports!</span>
        </div>
      )}
      {shareSuccess && (
        <div className="bg-[#EDF3F1] border border-[#E5E1D8] text-[#176B67] p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Report summary copied to clipboard!</span>
        </div>
      )}

      {/* 2. SECTION NAVIGATION TABS */}
      <div className="no-print flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {[
          { id: 'verdict', label: 'Verdict' },
          { id: 'market', label: 'Market & Map' },
          { id: 'opportunity', label: 'Opportunity & SWOT' },
          { id: 'financial', label: 'Finance & Schemes' },
          { id: 'risk', label: 'Risks' },
        ].map((tab) => {
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold shrink-0 transition-all ${
                isActive
                  ? 'bg-[#176B67] text-white shadow-xs'
                  : 'bg-white border border-[#E5E1D8] text-[#68706D] hover:border-[#E5E1D8]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* SCREEN 10: BUSINESS VERDICT */}
      {/* ---------------------------------------------------------------------- */}
      {activeSection === 'verdict' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-5 border border-[#E5E1D8] shadow-xs text-center space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#176B67] bg-[#EDF3F1] border border-[#E5E1D8] px-2.5 py-1 rounded-full inline-block">
              Business Feasibility
            </span>

            {/* Large Circular Gauge: 82 / 100 */}
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                {/* Background Ring */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="text-slate-100"
                  strokeWidth="10"
                  stroke="currentColor"
                  fill="transparent"
                />
                {/* Active Pine Green Ring */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="text-[#176B67] transition-all duration-1000 ease-out"
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-[#1E293B] font-heading">
                  {score}
                </span>
                <span className="text-[11px] font-bold text-[#7FA99B]">
                  / 100
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-base font-extrabold text-[#176B67]">
                Good Opportunity
              </div>
              <p className="text-xs text-[#68706D] max-w-xs mx-auto">
                High local demand and favorable 90:10 scheme leverage make this venture viable.
              </p>
            </div>

            {/* 4 Compact Cards: Demand, Competition, Profit Potential, Financial Feasibility */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 text-left">
              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E5E1D8]/80">
                <span className="text-[10px] uppercase font-bold text-[#7FA99B] block">Demand</span>
                <span className="text-sm font-black text-[#176B67] font-heading">HIGH</span>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E5E1D8]/80">
                <span className="text-[10px] uppercase font-bold text-[#7FA99B] block">Competition</span>
                <span className="text-sm font-black text-[#1E293B] font-heading">MEDIUM</span>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E5E1D8]/80">
                <span className="text-[10px] uppercase font-bold text-[#7FA99B] block">Profit Potential</span>
                <span className="text-sm font-black text-[#176B67] font-heading">HIGH</span>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E5E1D8]/80">
                <span className="text-[10px] uppercase font-bold text-[#7FA99B] block">Financial Feasibility</span>
                <span className="text-sm font-black text-[#176B67] font-heading">GOOD</span>
              </div>
            </div>

            {/* Primary CTA: "View Full Analysis" */}
            <div className="pt-2">
              <button
                onClick={() => setActiveSection('market')}
                className="w-full py-3.5 px-4 rounded-xl bg-[#176B67] hover:bg-[#0F4E4B] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all"
              >
                <span>View Full Analysis</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* SCREENS 11 & 12: LOCAL MARKET ANALYSIS & COMPETITOR MAP */}
      {/* ---------------------------------------------------------------------- */}
      {activeSection === 'market' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* SCREEN 11: LOCAL MARKET ANALYSIS */}
          <div className="bg-white rounded-2xl p-4 border border-[#E5E1D8] shadow-xs space-y-3">
            <div>
              <h2 className="text-sm font-extrabold text-[#1E293B] font-heading">
                Your Local Market
              </h2>
              <p className="text-xs text-[#68706D]">
                Catchment population and consumer reach in {location.village}
              </p>
            </div>

            {/* Compact Metric Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E5E1D8]/80">
                <div className="text-[10px] font-bold text-[#7FA99B] uppercase">Estimated Reach</div>
                <div className="text-sm font-black text-[#1E293B] font-heading mt-0.5">5  –  10 km</div>
                <div className="text-[10px] text-[#68706D] mt-0.5">Primary radius</div>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E5E1D8]/80">
                <div className="text-[10px] font-bold text-[#7FA99B] uppercase">Customer Base</div>
                <div className="text-sm font-black text-[#1E293B] font-heading mt-0.5">5,400+ Res.</div>
                <div className="text-[10px] text-[#68706D] mt-0.5">Across 3 hamlets</div>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E5E1D8]/80">
                <div className="text-[10px] font-bold text-[#7FA99B] uppercase">Demand</div>
                <div className="text-sm font-black text-[#176B67] font-heading mt-0.5">High</div>
                <div className="text-[10px] text-[#68706D] mt-0.5">Essential staple</div>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E5E1D8]/80">
                <div className="text-[10px] font-bold text-[#7FA99B] uppercase">Market Gap</div>
                <div className="text-sm font-black text-[#176B67] font-heading mt-0.5">Moderate</div>
                <div className="text-[10px] text-[#68706D] mt-0.5">Under-served zones</div>
              </div>
            </div>

            {/* Simple Visual Catchment Reach Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-semibold text-[#68706D]">
                <span>Immediate Village (0-3 km)</span>
                <span className="font-bold text-[#1E293B]">2,100 Residents</span>
              </div>
              <div className="w-full h-2 bg-[#EDF3F1] rounded-full overflow-hidden">
                <div className="h-full bg-[#176B67] rounded-full w-[40%]" />
              </div>

              <div className="flex justify-between text-xs font-semibold text-[#68706D] pt-1">
                <span>Catchment Radius (3-10 km)</span>
                <span className="font-bold text-[#1E293B]">5,400 Residents</span>
              </div>
              <div className="w-full h-2 bg-[#EDF3F1] rounded-full overflow-hidden">
                <div className="h-full bg-[#176B67]/70 rounded-full w-[85%]" />
              </div>
            </div>
          </div>

          {/* SCREEN 12: COMPETITOR MAP */}
          <div className="bg-white rounded-2xl p-4 border border-[#E5E1D8] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-[#0F172A] font-heading">
                  Nearby Competition
                </h2>
                <p className="text-xs text-[#68706D]">
                  Existing service providers and market density
                </p>
              </div>
              <span className="text-[11px] font-bold text-[#A07C2E] bg-[#FBF6EA] border border-[#F5D49A] px-2 py-0.5 rounded-md">
                Competition Level: Medium
              </span>
            </div>

            {/* Map Section */}
            <div className="rounded-xl overflow-hidden border border-[#E5E1D8] h-52 relative">
              <GoogleMarketMap
                language={language}
                initialVillage={location.village || 'Valarpuram'}
                initialDistrict={location.district || 'Kanchipuram'}
                initialCategory={business.category}
                initialLat={location.latitude || 13.0125}
                initialLon={location.longitude || 79.9754}
                hideHeaderControls={true}
                hideKpiCards={true}
                hideOutletList={true}
                mapHeight="208px"
              />
            </div>

            {/* Competitor Cards */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-[#68706D] uppercase tracking-wider block">
                Surveyed Competitors (Within 5 km)
              </span>

              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E5E1D8]/80 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-[#0F172A]">Sri Krishna General & Dairy</div>
                  <div className="text-[10px] text-[#68706D]">Distance: 1.2 km • Retail Store</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[#176B67]">?45  –  ?60</div>
                  <div className="text-[10px] text-[#7FA99B]">Price Range</div>
                </div>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E5E1D8]/80 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-[#0F172A]">Balaji Enterprise</div>
                  <div className="text-[10px] text-[#68706D]">Distance: 2.8 km • Local Outlet</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[#176B67]">?50  –  ?65</div>
                  <div className="text-[10px] text-[#7FA99B]">Price Range</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* SCREENS 13, 14, 15: OPPORTUNITY, SWOT & PRICING */}
      {/* ---------------------------------------------------------------------- */}
      {activeSection === 'opportunity' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* SCREEN 13: MARKET OPPORTUNITY */}
          <div className="bg-white rounded-2xl p-4 border border-[#E5E1D8] shadow-xs space-y-3">
            <div>
              <h2 className="text-sm font-extrabold text-[#0F172A] font-heading">
                Market Opportunity
              </h2>
              <p className="text-xs text-[#68706D]">Key growth indicators and AI rationale</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E5E1D8]/80">
                <span className="text-[10px] font-bold text-[#7FA99B] uppercase">Demand Growth</span>
                <span className="text-sm font-black text-[#176B67] font-heading block mt-0.5">+14% YoY</span>
                <span className="text-[10px] text-[#68706D]">Household demand</span>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E5E1D8]/80">
                <span className="text-[10px] font-bold text-[#7FA99B] uppercase">Market Gap</span>
                <span className="text-sm font-black text-[#176B67] font-heading block mt-0.5">35% Unmet</span>
                <span className="text-[10px] text-[#68706D]">In 3 adjacent hamlets</span>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E5E1D8]/80">
                <span className="text-[10px] font-bold text-[#7FA99B] uppercase">Customer Reach</span>
                <span className="text-sm font-black text-[#0F172A] font-heading block mt-0.5">5,400+</span>
                <span className="text-[10px] text-[#68706D]">Accessible buyers</span>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E5E1D8]/80">
                <span className="text-[10px] font-bold text-[#7FA99B] uppercase">Expansion</span>
                <span className="text-sm font-black text-[#176B67] font-heading block mt-0.5">High</span>
                <span className="text-[10px] text-[#68706D]">Cluster scalability</span>
              </div>
            </div>

            {/* Why This Opportunity Box */}
            <div className="bg-[#EDF3F1] border border-[#E5E1D8] rounded-xl p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#176B67]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Why this opportunity?</span>
              </div>
              <p className="text-xs text-[#252525] leading-relaxed">
                {biz.opportunity_analysis?.[0] ||
                  `Steady daily consumption in ${location.village} combined with limited modern providers creates an ideal entry window.`}
              </p>
            </div>
          </div>

          {/* SCREEN 14: SWOT ANALYSIS (2x2 Grid) */}
          <div className="bg-white rounded-2xl p-4 border border-[#E5E1D8] shadow-xs space-y-3">
            <div>
              <h2 className="text-sm font-extrabold text-[#0F172A] font-heading">
                Business SWOT
              </h2>
              <p className="text-xs text-[#68706D]">Internal capabilities and external market dynamics</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Strengths */}
              <div className="bg-[#EDF3F1]/50 border border-[#A8CCC4] rounded-xl p-3 space-y-1.5">
                <span className="text-[10px] font-bold text-[#176B67] uppercase tracking-wider">
                  Strengths
                </span>
                <ul className="text-[11px] text-[#252525] space-y-1">
                  <li>• Daily cash sales flow</li>
                  <li>• Manageable startup capital</li>
                  <li>• 90% loan eligibility</li>
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="bg-[#FBF6EA]/50 border border-[#F5D49A] rounded-xl p-3 space-y-1.5">
                <span className="text-[10px] font-bold text-[#A07C2E] uppercase tracking-wider">
                  Weaknesses
                </span>
                <ul className="text-[11px] text-[#252525] space-y-1">
                  <li>• Early morning working hours</li>
                  <li>• Inventory spoilage risk</li>
                </ul>
              </div>

              {/* Opportunities */}
              <div className="bg-[#FFFBEB] border border-rose-400/40 rounded-xl p-3 space-y-1.5">
                <span className="text-[10px] font-bold text-[#9A5B02] uppercase tracking-wider">
                  Opportunities
                </span>
                <ul className="text-[11px] text-[#252525] space-y-1">
                  <li>• Unserved nearby hamlets</li>
                  <li>• WhatsApp home delivery</li>
                </ul>
              </div>

              {/* Threats */}
              <div className="bg-[#EDF3F1]/50 border border-[#E5E1D8] rounded-xl p-3 space-y-1.5">
                <span className="text-[10px] font-bold text-[#0F4E4B] uppercase tracking-wider">
                  Threats
                </span>
                <ul className="text-[11px] text-[#252525] space-y-1">
                  <li>• Wholesale price changes</li>
                  <li>• Customer credit default</li>
                </ul>
              </div>
            </div>
          </div>

          {/* SCREEN 15: PRICING INTELLIGENCE */}
          <div className="bg-white rounded-2xl p-4 border border-[#E5E1D8] shadow-xs space-y-3">
            <div>
              <h2 className="text-sm font-extrabold text-[#0F172A] font-heading">
                Local Pricing
              </h2>
              <p className="text-xs text-[#68706D]">Benchmark rates in {location.district}</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E5E1D8]/80">
                <span className="text-[10px] font-bold text-[#7FA99B] uppercase">Market Price Range</span>
                <span className="text-sm font-black text-[#0F172A] font-heading block mt-0.5">?45  –  ?65</span>
                <span className="text-[10px] text-[#68706D]">Per unit / service</span>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E5E1D8]/80">
                <span className="text-[10px] font-bold text-[#176B67] uppercase">Recommended Price</span>
                <span className="text-sm font-black text-[#176B67] font-heading block mt-0.5">?52</span>
                <span className="text-[10px] text-[#68706D]">Best entry price</span>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E5E1D8]/80">
                <span className="text-[10px] font-bold text-[#7FA99B] uppercase">Estimated Margin</span>
                <span className="text-sm font-black text-[#176B67] font-heading block mt-0.5">25% Gross</span>
                <span className="text-[10px] text-[#68706D]">Operating margin</span>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E5E1D8]/80">
                <span className="text-[10px] font-bold text-[#7FA99B] uppercase">Competitor Average</span>
                <span className="text-sm font-black text-[#0F172A] font-heading block mt-0.5">?55</span>
                <span className="text-[10px] text-[#68706D]">Survey average</span>
              </div>
            </div>

            {/* Price Comparison Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-semibold text-[#68706D]">
                <span>Low: ?45</span>
                <span className="font-bold text-[#176B67]">Your Rec: ?52</span>
                <span>High: ?65</span>
              </div>
              <div className="w-full h-3 bg-[#EDF3F1] rounded-full relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-[#E5E1D8] w-full" />
                <div className="absolute inset-y-0 left-[35%] w-3 bg-[#176B67] rounded-full shadow-xs" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* SCREENS 16, 17, 18: FINANCIAL FEASIBILITY, SCHEME & EMI PLANNER */}
      {/* ---------------------------------------------------------------------- */}
      {activeSection === 'financial' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* SCREEN 16: FINANCIAL FEASIBILITY */}
          <div className="bg-white rounded-2xl p-4 border border-[#E5E1D8] shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-extrabold text-[#0F172A] font-heading">
                Financial Plan
              </h2>
              <p className="text-xs text-[#68706D]">Capital requirements and funding structure</p>
            </div>

            {/* 3 Prominent Figures */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E5E1D8]/80">
                <span className="text-[10px] font-bold text-[#7FA99B] uppercase block">Own Capital</span>
                <span className="text-sm font-black text-[#0F172A] font-heading block mt-0.5">
                  ?{marginCap.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] font-bold text-[#176B67]">10%</span>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E5E1D8]/80">
                <span className="text-[10px] font-bold text-[#7FA99B] uppercase block">Project Cost</span>
                <span className="text-sm font-black text-[#0F172A] font-heading block mt-0.5">
                  ?{projectCost.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] font-bold text-[#68706D]">100%</span>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E5E1D8]/80">
                <span className="text-[10px] font-bold text-[#7FA99B] uppercase block">Potential Loan</span>
                <span className="text-sm font-black text-[#176B67] font-heading block mt-0.5">
                  ?{loanAmt.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] font-bold text-[#176B67]">90%</span>
              </div>
            </div>

            {/* Funding Split Visual Representation */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[#0F172A]">Own Contribution (10%)</span>
                <span className="text-[#176B67]">Bank Loan (90%)</span>
              </div>
              <div className="w-full h-3 rounded-full overflow-hidden flex">
                <div className="w-[10%] bg-[#252525]" title="10% Own Contribution" />
                <div className="w-[90%] bg-[#176B67]" title="90% Scheme Bank Loan" />
              </div>
            </div>
          </div>

          {/* SCREEN 17: GOVERNMENT SCHEME RECOMMENDATION */}
          <div className="bg-white rounded-2xl p-4 border border-[#E5E1D8] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-[#0F172A] font-heading">
                  Recommended Funding Scheme
                </h2>
                <p className="text-xs text-[#68706D]">Matched government policy</p>
              </div>
              <span className="text-[10px] font-bold text-[#176B67] bg-[#EDF3F1] px-2 py-0.5 rounded-full">
                Eligible
              </span>
            </div>

            {/* Large Scheme Card */}
            <div className="bg-gradient-to-br from-[#FFFBEB] to-white border border-rose-400/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#176B67] text-white flex items-center justify-center">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-[#0F172A]">
                      {fin.scheme_name || 'Term Loan Assistance Scheme'}
                    </h3>
                    <span className="text-[10px] text-[#68706D]">PMEGP / NABARD Partner Banks</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-[#E5E1D8]/80">
                  <div className="text-[10px] text-[#7FA99B] font-semibold uppercase">Project Cost</div>
                  <div className="font-bold text-[#0F172A]">?{projectCost.toLocaleString('en-IN')}</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-[#E5E1D8]/80">
                  <div className="text-[10px] text-[#7FA99B] font-semibold uppercase">Loan Amount</div>
                  <div className="font-bold text-[#176B67]">?{loanAmt.toLocaleString('en-IN')}</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-[#E5E1D8]/80">
                  <div className="text-[10px] text-[#7FA99B] font-semibold uppercase">Interest Rate</div>
                  <div className="font-bold text-[#0F172A]">{interestRate}% p.a.</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-[#E5E1D8]/80">
                  <div className="text-[10px] text-[#7FA99B] font-semibold uppercase">Tenure & Moratorium</div>
                  <div className="font-bold text-[#0F172A]">{tenure} Yrs ({moratorium}mo grace)</div>
                </div>
              </div>

              {/* Why This Scheme */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold text-[#9A5B02] uppercase tracking-wider block">
                  Why this scheme?
                </span>
                <p className="text-[11px] text-[#68706D] leading-relaxed">
                  Offers lowest equity barrier (10%), competitive interest rates, and initial 6-month moratorium grace period for setup.
                </p>
              </div>

              <button
                onClick={onNavigateToSchemes}
                className="w-full py-2 bg-white hover:bg-[#EDF3F1] border border-[#E5E1D8] text-[#176B67] font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors"
              >
                <span>View Scheme Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* SCREEN 18: EMI / REPAYMENT PLANNER */}
          <div className="bg-white rounded-2xl p-4 border border-[#E5E1D8] shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-extrabold text-[#0F172A] font-heading">
                Repayment Plan
              </h2>
              <p className="text-xs text-[#68706D]">Monthly obligations & repayment schedule</p>
            </div>

            {/* Large Monthly Repayment Figure */}
            <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E5E1D8]/80 text-center space-y-1">
              <span className="text-[10px] font-bold text-[#7FA99B] uppercase tracking-wider">
                Monthly Repayment (EMI)
              </span>
              <div className="text-2xl font-black text-[#176B67] font-heading">
                ? {monthlyEmi.toLocaleString('en-IN')} <span className="text-xs text-[#7FA99B] font-normal">/ month</span>
              </div>
              <div className="text-[10px] text-[#68706D]">
                Starts after {moratorium}-month moratorium period
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E5E1D8]">
                <span className="text-[10px] text-[#7FA99B] font-semibold uppercase">Total Repayment</span>
                <div className="font-bold text-[#0F172A] mt-0.5">?{totalRepayment.toLocaleString('en-IN')}</div>
              </div>
              <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E5E1D8]">
                <span className="text-[10px] text-[#7FA99B] font-semibold uppercase">Total Interest</span>
                <div className="font-bold text-[#252525] mt-0.5">?{totalInterest.toLocaleString('en-IN')}</div>
              </div>
            </div>

            {/* Repayment Timeline Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-bold text-[#68706D]">
                <span>Month 1 – {moratorium}: Moratorium (Grace)</span>
                <span>Year 1 – {tenure}: Regular EMI</span>
              </div>
              <div className="w-full h-3 bg-[#EDF3F1] rounded-full flex overflow-hidden">
                <div className="w-[15%] bg-amber-400" title="Moratorium period" />
                <div className="w-[85%] bg-[#176B67]" title="Repayment phase" />
              </div>
            </div>

            <button
              onClick={onNavigateToCalculator}
              className="w-full py-2.5 bg-[#EDF3F1] hover:bg-[#E5E1D8] text-[#252525] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <Calculator className="w-3.5 h-3.5 text-[#176B67]" />
              <span>Open Interactive EMI Calculator</span>
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* SCREEN 19: RISK ANALYSIS ("Before You Invest") */}
      {/* ---------------------------------------------------------------------- */}
      {activeSection === 'risk' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="space-y-1">
            <h2 className="text-sm font-extrabold text-[#0F172A] font-heading">
              Before You Invest
            </h2>
            <p className="text-xs text-[#68706D]">
              Key operational vulnerabilities and recommended mitigations
            </p>
          </div>

          {/* 4 Risk Cards: Seasonal Demand, Supplier Dependency, Competition, Cash Flow Risk */}
          <div className="space-y-2.5">
            {[
              {
                title: 'Seasonal Demand',
                level: 'MEDIUM RISK',
                color: 'text-[#A07C2E] bg-[#FBF6EA] border-[#F5D49A]',
                desc: 'Demand fluctuates during monsoon and festive seasons by 10-15%.',
                mitigation: 'Build pre-order subscriptions and diversify seasonal offerings.',
              },
              {
                title: 'Supplier Dependency',
                level: 'MEDIUM RISK',
                color: 'text-[#A07C2E] bg-[#FBF6EA] border-[#F5D49A]',
                desc: 'Relying on a single wholesale vendor can lead to stockouts or inflated prices.',
                mitigation: 'Sign agreements with at least 2 alternate suppliers in nearby towns.',
              },
              {
                title: 'Competition',
                level: 'LOW RISK',
                color: 'text-[#176B67] bg-[#EDF3F1] border-[#A8CCC4]',
                desc: 'Existing neighborhood shops have loyal base but limited product depth.',
                mitigation: 'Differentiate on fresh quality, digital WhatsApp ordering, and punctuality.',
              },
              {
                title: 'Cash Flow Risk',
                level: 'LOW RISK',
                color: 'text-[#176B67] bg-[#EDF3F1] border-[#A8CCC4]',
                desc: 'Delayed buyer credit payments could stress weekly operating expenses.',
                mitigation: 'Enforce strict 7-day credit limits and keep a 3-month working capital buffer.',
              },
            ].map((risk) => (
              <div
                key={risk.title}
                className="bg-white rounded-2xl p-4 border border-[#E5E1D8] shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#0F172A] font-heading">
                    {risk.title}
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${risk.color}`}>
                    {risk.level}
                  </span>
                </div>
                <p className="text-xs text-[#68706D]">
                  {risk.desc}
                </p>
                <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E5E1D8] flex items-start gap-1.5 text-xs text-[#252525]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#176B67] shrink-0 mt-0.5" />
                  <span><strong>AI Mitigation:</strong> {risk.mitigation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
