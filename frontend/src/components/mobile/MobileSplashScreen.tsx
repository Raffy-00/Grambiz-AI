import React, { useEffect, useState } from 'react';
import { ArrowRight, ShieldCheck, TrendingUp } from 'lucide-react';
import { Language } from '../../types';

interface Props {
  onComplete: () => void;
  language: Language;
}

export const MobileSplashScreen: React.FC<Props> = ({ onComplete }) => {
  const [fadeState, setFadeState] = useState<'in' | 'visible' | 'out'>('in');

  useEffect(() => {
    const t1 = setTimeout(() => setFadeState('visible'), 50);
    const t2 = setTimeout(() => setFadeState('out'), 1600);
    const t3 = setTimeout(() => onComplete(), 1900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div
      onClick={onComplete}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-br from-rose-50/95 via-white to-blue-50/95 text-[#252525] px-6 py-12 transition-opacity duration-300 select-none cursor-pointer ${
        fadeState === 'out' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Top Subtle Status Tag */}
      <div className="w-full flex justify-between items-center text-[11px] text-[#68706D] font-medium tracking-wide">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#176B67] animate-pulse" />
          <span className="tracking-wider text-[10px] uppercase font-bold text-[#252525]">FINANCIAL INTELLIGENCE</span>
        </span>
        <span className="text-[10px] bg-[#EDF3F1] border border-[#E5E1D8] px-2.5 py-0.5 rounded-full text-[#0F4E4B] font-bold">
          MSME & Rural Advisory
        </span>
      </div>

      {/* Centered Brand Identity */}
      <div className="flex flex-col items-center text-center space-y-6 my-auto">
        {/* Minimal Geometric Emblem */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-700 via-rose-700 to-rose-800 text-white flex items-center justify-center shadow-xl shadow-rose-700/20 border-4 border-white transform transition-transform active:scale-95">
          <div className="flex flex-col items-center justify-center">
            <span className="text-3xl font-black font-heading tracking-tighter text-white">GB</span>
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight font-heading text-[#252525]">
            GramBiz <span className="text-[#0F4E4B]">AI</span>
          </h1>
          <p className="text-sm font-medium text-[#68706D] tracking-wide">
            Smart rural business feasibility & advisory.
          </p>
        </div>
      </div>

      {/* Bottom Minimal Loading & Trust Indicator */}
      <div className="w-full flex flex-col items-center space-y-4">
        {/* Minimal Loading Indicator */}
        <div className="w-36 h-1.5 bg-[#E5E1D8] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-rose-600 to-rose-700 rounded-full animate-pulse w-3/4" />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#68706D] font-semibold">
          <span>Tap anywhere to continue</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#0F4E4B]" />
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-[#68706D]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0F4E4B]" />
          <span>Market Viability • Concessional Loans • PMEGP</span>
        </div>
      </div>
    </div>
  );
};
