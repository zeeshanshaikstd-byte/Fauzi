import React from 'react';
import { sound } from '../services/sound';
import { RotateCcw, Trophy, Shield, Skull } from 'lucide-react';

interface GameOverModalProps {
  heroName: string;
  wavesSurvived: number;
  score: number;
  highScore: number;
  isNewRecord: boolean;
  enemiesDefeated: number;
  coinsEarned: number;
  totalCoins: number;
  onPlayAgain: () => void;
  onOpenArmory: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  heroName,
  wavesSurvived,
  score,
  highScore,
  isNewRecord,
  enemiesDefeated,
  coinsEarned,
  totalCoins,
  onPlayAgain,
  onOpenArmory,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none font-sans">
      <div className="relative w-full max-w-lg bg-stone-900 border-2 border-red-900/80 rounded-2xl shadow-[0_0_50px_rgba(185,28,28,0.4)] overflow-hidden flex flex-col p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Skull Icon & Defeat Title */}
        <div className="flex justify-center mb-3">
          <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-full shadow-inner">
            <Skull className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <span className="text-xs font-mono tracking-widest text-red-400 font-bold uppercase mb-1">
          TRENCH OVERRUN
        </span>

        <h2
          className="text-3xl sm:text-4xl font-extrabold text-stone-100 uppercase tracking-wide mb-1"
          style={{ fontFamily: "'Black Ops One', 'Oswald', sans-serif" }}
        >
          FALL OF {heroName}
        </h2>

        <p className="text-xs text-stone-400 max-w-xs mx-auto mb-6">
          The enemy battalion broke through the frontline barricade. Your courage will not be forgotten.
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6 bg-stone-950/80 border border-stone-800 rounded-xl p-4">
          <div className="flex flex-col items-center justify-center p-2 border-r border-stone-800">
            <span className="text-[10px] font-mono uppercase text-stone-400 mb-0.5">
              WAVES SURVIVED
            </span>
            <span
              className="text-2xl font-bold text-amber-300 tabular-nums"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              {wavesSurvived}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-2">
            <span className="text-[10px] font-mono uppercase text-stone-400 mb-0.5">
              FINAL SCORE
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className="text-2xl font-bold text-amber-300 tabular-nums"
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                {score.toLocaleString()}
              </span>
              {isNewRecord && (
                <span className="text-[9px] font-mono font-bold uppercase bg-amber-500 text-stone-950 px-1.5 py-0.5 rounded animate-pulse">
                  NEW BEST
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-2 border-r border-stone-800 border-t border-stone-800">
            <span className="text-[10px] font-mono uppercase text-stone-400 mb-0.5">
              ENEMIES STOPPED
            </span>
            <span className="text-lg font-bold text-stone-200 tabular-nums font-mono">
              {enemiesDefeated}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-2 border-t border-stone-800">
            <span className="text-[10px] font-mono uppercase text-stone-400 mb-0.5">
              COINS RECOVERED
            </span>
            <span className="text-lg font-bold text-yellow-400 tabular-nums font-mono">
              +{coinsEarned}
            </span>
          </div>
        </div>

        {/* High Score & Total Coins readout */}
        <div className="flex items-center justify-between text-xs font-mono text-stone-400 px-2 mb-6">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>RECORD: <strong className="text-stone-200 tabular-nums">{highScore.toLocaleString()}</strong></span>
          </div>
          <div>
            TOTAL COINS: <strong className="text-yellow-400 tabular-nums">{totalCoins.toLocaleString()}</strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              sound.playButtonClick();
              onOpenArmory();
            }}
            className="flex-1 py-3 px-4 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded-xl text-xs font-bold text-stone-200 uppercase transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md"
          >
            <Shield className="w-4 h-4 text-amber-400" />
            <span>VISIT ARMORY</span>
          </button>

          <button
            onClick={() => {
              sound.playButtonClick();
              onPlayAgain();
            }}
            className="flex-[1.4] py-3.5 px-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-stone-950 font-extrabold text-sm uppercase tracking-wide rounded-xl shadow-[0_0_20px_rgba(234,88,12,0.4)] transition-all flex items-center justify-center gap-2 active:scale-95"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            <span>PLAY AGAIN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
