import React from 'react';
import { sound } from '../services/sound';
import { Award, ChevronRight, Sparkles, Shield, Trophy } from 'lucide-react';

interface VictoryLevelModalProps {
  heroName: string;
  completedLevel: number;
  completedWave: number;
  score: number;
  bonusCoins: number;
  totalCoins: number;
  bossName: string;
  onProceedToNextLevel: () => void;
  onOpenArmory: () => void;
}

export const VictoryLevelModal: React.FC<VictoryLevelModalProps> = ({
  heroName,
  completedLevel,
  completedWave,
  score,
  bonusCoins,
  totalCoins,
  bossName,
  onProceedToNextLevel,
  onOpenArmory,
}) => {
  return (
    <div className="absolute inset-0 z-35 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none font-sans animate-in fade-in zoom-in-95 duration-200">
      <div className="relative w-full max-w-lg bg-stone-900 border-2 border-amber-500/80 rounded-2xl shadow-[0_0_60px_rgba(245,158,11,0.4)] overflow-hidden flex flex-col p-6 sm:p-8 text-center">
        {/* Victory Badge */}
        <div className="flex justify-center mb-3">
          <div className="p-3.5 bg-gradient-to-b from-amber-600 to-yellow-600 border border-amber-300 rounded-full shadow-lg animate-bounce">
            <Trophy className="w-8 h-8 text-stone-950 stroke-[2.5]" />
          </div>
        </div>

        <span className="text-xs font-mono tracking-widest text-amber-400 font-bold uppercase mb-1 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          LEVEL {completedLevel} DEFENDED · SECTOR LIBERATED
        </span>

        <h2
          className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-200 to-yellow-400 uppercase tracking-wide mb-1"
          style={{ fontFamily: "'Black Ops One', 'Oswald', sans-serif" }}
        >
          BOSS DEFEATED!
        </h2>

        <p className="text-xs sm:text-sm text-amber-200/90 font-medium max-w-sm mx-auto mb-5">
          {heroName} has brought down <strong>{bossName.toUpperCase()}</strong> and broken the enemy siege!
        </p>

        {/* Victory Rewards Card */}
        <div className="grid grid-cols-2 gap-3 mb-6 bg-stone-950/80 border border-amber-900/60 rounded-xl p-4">
          <div className="flex flex-col items-center justify-center p-2 border-r border-stone-800">
            <span className="text-[10px] font-mono uppercase text-stone-400 mb-0.5">
              VICTORY BOUNTY
            </span>
            <span className="text-2xl font-bold text-yellow-400 tabular-nums font-mono">
              +{bonusCoins} COINS
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-2">
            <span className="text-[10px] font-mono uppercase text-stone-400 mb-0.5">
              SCORE TALLY
            </span>
            <span
              className="text-2xl font-bold text-amber-300 tabular-nums"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              {score.toLocaleString()}
            </span>
          </div>

          <div className="col-span-2 pt-2 border-t border-stone-800 text-xs font-mono text-stone-300 flex justify-between px-2">
            <span>SAVED TOTAL COINS: <strong className="text-yellow-400">{totalCoins.toLocaleString()}</strong></span>
            <span>NEXT STAGE: <strong className="text-amber-400">LEVEL {completedLevel + 1}</strong></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              sound.playButtonClick();
              onOpenArmory();
            }}
            className="flex-1 py-3 px-4 bg-stone-800 hover:bg-stone-700 border border-amber-800/80 rounded-xl text-xs font-bold text-amber-200 uppercase transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md"
          >
            <Shield className="w-4 h-4 text-amber-400" />
            <span>VISIT ARMORY</span>
          </button>

          <button
            onClick={() => {
              sound.playButtonClick();
              onProceedToNextLevel();
            }}
            className="flex-[1.5] py-3.5 px-6 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-600 text-stone-950 font-extrabold text-sm uppercase tracking-wide rounded-xl shadow-[0_0_25px_rgba(234,88,12,0.6)] transition-all flex items-center justify-center gap-2 active:scale-95"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            <span>ADVANCE TO LEVEL {completedLevel + 1}</span>
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
};
