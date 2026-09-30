import React, { useState } from 'react';
import {
  Calculator, DollarSign, PieChart, ShieldCheck, ChevronRight,
  HelpCircle, Layers, ArrowRight, ArrowLeft, Landmark, Sliders
} from 'lucide-react';
import { Language } from '../../types';
import { TRANSLATIONS } from '../../i18n/translations';
import { SCHEME_CONFIGS } from '../../data/schemes';

interface Props {
  language: Language;
  initialMargin?: number;
  onOpenSchemes?: () => void;
  onOpenAssistant?: () => void;
}

export const MobileCalculatorView: React.FC<Props> = ({
  language,
  initialMargin = 100000,
  onOpenSchemes,
  onOpenAssistant,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Active Sub-Tab: 'loan' | 'working_cap'
  const [activeTab, setActiveTab] = useState<'loan' | 'working_cap'>('loan');

  // Input Margin Capital
  const [marginCapital, setMarginCapital] = useState<number>(initialMargin);
  const [customInput, setCustomInput] = useState<string>(initialMargin.toString());
  const capitalPresets = [25000, 50000, 100000, 200000, 500000, 1000000];

  // Working Capital inputs
  const [rent, setRent] = useState<number>(6000);
  const [rawMaterials, setRawMaterials] = useState<number>(20000);
  const [electricity, setElectricity] = useState<number>(2000);
  const [labour, setLabour] = useState<number>(8000);
  const [transport, setTransport] = useState<number>(3000);
  const [marketing, setMarketing] = useState<number>(1000);

  // Math Calculations (90:10 Ratio)
  const calculatedProjectCost = marginCapital / 0.10;
  const calculatedLoan = calculatedProjectCost * 0.90;

  // Government Scheme Alignment
  const activeScheme =
    calculatedProjectCost <= 140000 ? SCHEME_CONFIGS[0] : SCHEME_CONFIGS[1];
  const maxFunding = activeScheme.maxFunding;
  const actualLoan = Math.min(calculatedLoan, maxFunding);
  const effectiveProjectCost = calculatedProjectCost;

  // EMI Math
  const n = activeScheme.tenureYears * 12;
  const r = activeScheme.interestRate / 100 / 12;
  const emi = Math.round(
    (actualLoan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  );
  const totalRepayment = emi * n;
  const totalInterest = totalRepayment - actualLoan;

  // Working Capital Cushion
  const monthlyOperatingExpense =
    rent + rawMaterials + electricity + labour + transport + marketing;
  const reserve3Months = monthlyOperatingExpense * 3;

  // Budget Allocation defaults (kept for reference only)
  const equipmentCost = Math.round(effectiveProjectCost * 0.40);
  const inventoryCost = Math.round(effectiveProjectCost * 0.25);
  const infraCost = Math.round(effectiveProjectCost * 0.15);
  const workingCapBudget = Math.round(effectiveProjectCost * 0.10);
  const contingencyCost = Math.round(effectiveProjectCost * 0.10);

  const handleAmountSelect = (val: number) => {
    setMarginCapital(val);
    setCustomInput(val.toString());
  };

  const handleCustomChange = (valStr: string) => {
    setCustomInput(valStr);
    const num = parseFloat(valStr.replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && num > 0) {
      setMarginCapital(num);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Top Title & Overview */}
      <div className="mobile-card p-4 space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#EDF3F1] text-[#0F4E4B] border border-[#E5E1D8] flex items-center justify-center font-bold">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-[#252525] font-heading">
              {t.mobile_quick_calc || 'Smart Financial Calculator'}
            </h1>
            <p className="text-[11px] text-[#68706D]">
              PMEGP 90:10 leverage, EMI schedule & 3-month reserve
            </p>
          </div>
        </div>
      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 bg-[#E5E1D8]/70 p-1 rounded-xl text-xs font-bold text-[#68706D]">
        {[
          { id: 'loan', label: 'Loan & EMI' },
          { id: 'working_cap', label: 'Working Capital' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              activeTab === tab.id
                ? 'bg-[#176B67] text-white shadow-xs font-extrabold'
                : 'hover:text-[#252525]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/* TAB 1: LOAN & EMI */}
      {/* ============================================================ */}
      {activeTab === 'loan' && (
        <div className="space-y-4">
          {/* Margin Input Card */}
          <div className="mobile-card p-4 space-y-3">
            <label className="block text-[11px] font-bold text-[#252525] uppercase tracking-wider">
              Enter Your Available Capital (?)
            </label>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-[#68706D]">
                ?
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={customInput}
                onChange={(e) => handleCustomChange(e.target.value)}
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-[#E5E1D8] text-lg font-extrabold text-[#252525] focus:ring-2 focus:ring-rose-600 bg-white"
              />
            </div>

            {/* Amount Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {capitalPresets.map((amt) => {
                const isSel = marginCapital === amt;
                return (
                  <button
                    key={amt}
                    onClick={() => handleAmountSelect(amt)}
                    className={`py-1 px-2.5 rounded-xl text-xs font-bold transition-all border ${
                      isSel
                        ? 'bg-[#176B67] text-white border-rose-700 shadow-2xs'
                        : 'bg-[#EDF3F1] text-[#252525] border-[#E5E1D8] hover:bg-[#E5E1D8]'
                    }`}
                  >
                    ?{(amt / 1000).toLocaleString('en-IN')}k
                  </button>
                );
              })}
            </div>
          </div>

          {/* Capital Multiplier Live Breakdown Card */}
          <div className="mobile-card p-4 space-y-3 bg-[#F8F7F2] border border-[#E5E1D8]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#252525] uppercase tracking-wide">
                Financial Structure (90:10)
              </span>
              <span className="text-[10px] font-bold bg-[#FBF6EA] text-amber-900 border border-[#F5D49A] px-2 py-0.5 rounded-md">
                {activeScheme.name}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white p-3 rounded-xl border border-[#E5E1D8] shadow-2xs">
                <span className="text-[10px] text-[#68706D] font-medium uppercase">Total Project</span>
                <div className="text-base font-extrabold text-[#C89B3C] mt-0.5">
                  ?{calculatedProjectCost.toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-[#7FA99B]">100% Feasible Capital</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-[#E5E1D8] shadow-2xs">
                <span className="text-[10px] text-[#252525] font-medium uppercase">90% Bank Loan</span>
                <div className="text-base font-extrabold text-[#0F4E4B] mt-0.5">
                  ?{actualLoan.toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-[#7FA99B] font-semibold">
                  {activeScheme.interestRate}% Interest
                </span>
              </div>
            </div>

            {/* Scheme Parameters Strip */}
            <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-xl text-center text-xs border border-[#E5E1D8] shadow-2xs">
              <div>
                <div className="text-[10px] text-[#68706D]">Tenure</div>
                <div className="font-extrabold text-[#252525] mt-0.5">
                  {activeScheme.tenureYears} Years
                </div>
              </div>
              <div className="border-x border-[#E5E1D8]">
                <div className="text-[10px] text-[#68706D]">Moratorium</div>
                <div className="font-extrabold text-[#0F4E4B] mt-0.5">
                  {activeScheme.moratoriumMonths} Months
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#68706D]">Monthly EMI</div>
                <div className="font-extrabold text-[#0F4E4B] mt-0.5">
                  ?{emi.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Total Repayment Summary */}
            <div className="bg-[#EDF3F1] border border-[#E5E1D8] rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between text-[#252525]">
                <span>Principal Loan:</span>
                <span className="font-bold">?{actualLoan.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#252525]">
                <span>Total Interest Payable:</span>
                <span className="font-bold text-[#C89B3C]">?{totalInterest.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#252525] font-extrabold pt-1 border-t border-[#E5E1D8]">
                <span>Total Repayment:</span>
                <span>?{totalRepayment.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Moratorium Explanation */}
            <div className="flex items-start gap-2 bg-[#EDF3F1] border border-[#E5E1D8] text-[#252525] p-3 rounded-xl text-[11px]">
              <ShieldCheck className="w-4 h-4 text-[#0F4E4B] shrink-0 mt-0.5" />
              <span>
                <strong>{activeScheme.moratoriumMonths}-Month Moratorium:</strong> You do not pay loan principal during the first {activeScheme.moratoriumMonths} months while you set up operations.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: WORKING CAPITAL REQUIREMENT */}
      {/* ============================================================ */}
      {activeTab === 'working_cap' && (
        <div className="space-y-4">
          <div className="mobile-card p-4 space-y-3">
            <div>
              <h2 className="text-xs font-extrabold text-[#252525] uppercase tracking-wide">
                Monthly Operating Expenses
              </h2>
              <p className="text-[11px] text-[#68706D]">
                Itemize your regular monthly costs to calculate the required 3-month cash safety cushion.
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              {[
                { label: 'Shop Rent & Lease', val: rent, set: setRent },
                { label: 'Raw Materials / Inventory', val: rawMaterials, set: setRawMaterials },
                { label: 'Electricity & Utilities', val: electricity, set: setElectricity },
                { label: 'Labour & Helper Wages', val: labour, set: setLabour },
                { label: 'Transport & Logistics', val: transport, set: setTransport },
                { label: 'Marketing & Local Outreach', val: marketing, set: setMarketing },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#252525]">{item.label}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[#7FA99B] font-bold">?</span>
                    <input
                      type="number"
                      value={item.val}
                      onChange={(e) => item.set(Number(e.target.value) || 0)}
                      className="w-24 px-2 py-1 text-right font-bold text-[#252525] rounded-lg border border-[#E5E1D8] bg-[#F8F7F2] focus:bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Total Monthly & 3-Month Cushion */}
            <div className="bg-gradient-to-br from-rose-50 via-white to-blue-50/80 text-[#252525] p-4 rounded-2xl space-y-2 border border-[#E5E1D8] shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#68706D] font-semibold">Total Monthly Cost:</span>
                <span className="font-bold text-[#252525]">
                  ?{monthlyOperatingExpense.toLocaleString('en-IN')} / mo
                </span>
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t border-rose-100">
                <span className="font-extrabold text-[#252525]">Mandatory 3-Month Cushion:</span>
                <span className="font-extrabold text-[#0F4E4B] text-base">
                  ?{reserve3Months.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-[#68706D]">
              * Bank officers recommend having this reserve in your savings account before applying for commercial loan disbursement.
            </p>
          </div>
        </div>
      )}



      {/* 3. Bottom Action Buttons */}
      <div className="space-y-2 pt-1">
        {onOpenSchemes && (
          <button
            onClick={onOpenSchemes}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-700 to-rose-800 hover:from-rose-800 hover:to-rose-900 active:scale-[0.99] text-white font-extrabold text-sm shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 font-heading"
          >
            <Landmark className="w-4 h-4" />
            <span>View Matching Government Schemes</span>
          </button>
        )}
      </div>
    </div>
  );
};
