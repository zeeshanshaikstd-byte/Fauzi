import React from 'react';
import { sound } from '../services/sound';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';

interface PauseModalProps {
  heroName: string;
  wave: number;
  score: number;
  isMuted: boolean;
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  heroName,
  wave,
  score,
  isMuted,
  onResume,
  onRestart,
  onHome,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none font-sans">
      <div className="w-full max-w-sm bg-stone-900 border border-amber-900/80 rounded-2xl p-6 text-center shadow-2xl">
        <span className="text-[11px] font-mono tracking-widest text-amber-500 uppercase font-bold">
          TACTICAL CEASEFIRE
        </span>
        <h2
          className="text-3xl font-extrabold text-stone-100 uppercase tracking-wide mt-1 mb-2"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          GAME PAUSED
        </h2>

        <div className="text-xs font-mono text-stone-400 mb-6 flex justify-center gap-4">
          <span>{heroName}</span>
          <span>·</span>
          <span>WAVE {wave}</span>
          <span>·</span>
          <span className="text-amber-400 tabular-nums">SCORE {score.toLocaleString()}</span>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={() => {
              sound.playButtonClick();
              onResume();
            }}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-stone-950 font-extrabold text-sm uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg"
          >
            <Play className="w-4 h-4 fill-stone-950" />
            <span>RESUME MISSION</span>
          </button>

          <button
            onClick={() => {
              sound.playButtonClick();
              onToggleMute();
            }}
            className="w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold uppercase rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            <span>{isMuted ? 'UNMUTE AUDIO' : 'MUTE AUDIO'}</span>
          </button>

          <button
            onClick={() => {
              sound.playButtonClick();
              onRestart();
            }}
            className="w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold uppercase rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART BATTLE</span>
          </button>

          <button
            onClick={() => {
              sound.playButtonClick();
              onHome();
            }}
            className="w-full py-2.5 px-4 bg-stone-950 hover:bg-black text-stone-400 hover:text-stone-200 text-xs font-bold uppercase rounded-xl border border-stone-800 transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>MAIN MENU / POSTER</span>
          </button>
        </div>
      </div>
    </div>
  );
};
