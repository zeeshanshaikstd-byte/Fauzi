import React, { useEffect, useRef, useState } from 'react';
import { OutfitId } from '../types/game';
import { OUTFITS } from '../game/constants';
import { PosterRenderer } from '../game/posterRenderer';
import { sound } from '../services/sound';
import { Volume2, VolumeX, Shield, Play, Save, RotateCcw, Image as ImageIcon } from 'lucide-react';

interface TeaserPosterProps {
  heroName: string;
  onUpdateHeroName: (name: string) => void;
  onStartGame: () => void;
  onOpenArmory: () => void;
  equippedOutfit: OutfitId;
  coins: number;
  highScore: number;
  hasSavedData: boolean;
  saveNotice?: string | null;
  onResetSaveData?: () => void;
}

export const TeaserPoster: React.FC<TeaserPosterProps> = ({
  heroName,
  onUpdateHeroName,
  onStartGame,
  onOpenArmory,
  equippedOutfit,
  coins,
  highScore,
  hasSavedData,
  saveNotice,
  onResetSaveData,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [inputName, setInputName] = useState(heroName);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showPosterArtwork, setShowPosterArtwork] = useState(false);
  const rendererRef = useRef<PosterRenderer | null>(null);

  useEffect(() => {
    rendererRef.current = new PosterRenderer();

    // Dramatic war drum on load
    const drumTimer = setTimeout(() => {
      sound.playPosterWarDrum();
    }, 450);

    return () => clearTimeout(drumTimer);
  }, []);

  // Sync heroName prop changes
  useEffect(() => {
    setInputName(heroName);
  }, [heroName]);

  // Poster canvas animation loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const outfit = OUTFITS[equippedOutfit] || OUTFITS.standard;

    const loop = () => {
      if (rendererRef.current && ctx && canvas) {
        rendererRef.current.render(ctx, canvas.width, canvas.height, outfit.colors.bandana);
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [equippedOutfit]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputName(val);
    onUpdateHeroName(val);
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const muted = sound.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      sound.playPosterWarDrum();
    }
  };

  const handleStart = () => {
    sound.playButtonClick();
    onStartGame();
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-stone-950 font-sans">
      {/* Background Canvas: Hero Back Silhouette, Sunset, Sun, Barbed Wire, Embers */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[12000ms] ease-out scale-100 hover:scale-[1.03]"
      />

      {/* Film Grain & Scratched Poster Overlay */}
      <div
        className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.5) 100%)`,
        }}
      />

      {/* Top Header Bar: Teaser Tag, Save Status, High Score & Mute */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 max-w-5xl mx-auto">
        {/* Left: Teaser Badge & Save Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="border border-amber-500/60 bg-amber-950/50 px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-mono tracking-widest text-amber-300 font-bold uppercase shadow-sm">
            FIRST LOOK
          </div>

          {/* Save Status Readout */}
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono text-emerald-400 bg-black/50 border border-emerald-900/60 px-2 py-0.5 rounded">
            <Save className="w-3 h-3 text-emerald-400" />
            <span>{hasSavedData ? 'SAVE LOADED' : 'READY TO SAVE'}</span>
          </div>
        </div>

        {/* Right Corner: Coins, High Score & Sound Toggle */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 text-xs font-mono text-amber-100/90 bg-black/40 px-2.5 py-1 rounded border border-amber-900/50">
            <span>RECORD <strong className="text-amber-400 tabular-nums">{highScore.toLocaleString()}</strong></span>
            <span className="text-amber-500/40">/</span>
            <span>COINS <strong className="text-amber-300 tabular-nums">{coins.toLocaleString()}</strong></span>
          </div>

          {/* Toggle Picture Poster Artwork Button */}
          <button
            onClick={() => {
              sound.playButtonClick();
              setShowPosterArtwork(!showPosterArtwork);
            }}
            className="p-2 rounded bg-black/40 border border-amber-900/60 text-amber-200 hover:text-white hover:bg-black/60 transition-colors flex items-center gap-1 text-xs font-mono"
            title="View Original Movie Poster"
          >
            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">POSTER PIC</span>
          </button>

          <button
            onClick={handleToggleMute}
            className="p-2 rounded bg-black/40 border border-amber-900/60 text-amber-200 hover:text-white hover:bg-black/60 transition-colors"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label="Sound Toggle"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Save Notification Toast if present */}
      {saveNotice && (
        <div className="relative z-20 flex justify-center mt-2 px-4 animate-in fade-in duration-200">
          <div className="bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs font-mono px-3 py-1 rounded shadow-lg flex items-center gap-2">
            <Save className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>{saveNotice}</span>
          </div>
        </div>
      )}

      {/* Center Cinematic Poster Titles & Hero Branding */}
      <div className="relative z-10 flex flex-col items-center justify-start text-center pt-5 sm:pt-10 px-4 max-w-3xl mx-auto">
        {/* Big Cinematic Title in bold scratched military style */}
        <h1
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-200 to-amber-600 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] uppercase"
          style={{
            fontFamily: "'Black Ops One', 'Oswald', sans-serif",
            letterSpacing: '0.04em',
            textShadow: '0 2px 0 #3f1d0b, 0 8px 24px rgba(0,0,0,0.85)',
          }}
        >
          THE LONE BATTALION
        </h1>

        {/* Tagline */}
        <p className="mt-1.5 sm:mt-2 text-sm sm:text-base md:text-lg text-amber-200/90 font-medium tracking-wide drop-shadow-md">
          One soldier. One gun. One battalion to stop.
        </p>

        {/* Star Card: Hero Name Banner */}
        <div className="mt-2 text-xs sm:text-sm font-mono text-amber-400/90 tracking-widest uppercase bg-black/40 px-3 py-1 rounded border border-amber-900/40">
          FEATURING <strong className="text-amber-200 underline decoration-amber-500/60 underline-offset-4">{heroName}</strong> AS THE LONE GUNNER
        </div>
      </div>

      {/* PICTURE POSTER PREVIEW MODAL / DRAWER (Requested: "Add a simple picture of our game poster with name at beginning of game start ok") */}
      {showPosterArtwork && (
        <div
          onClick={() => setShowPosterArtwork(false)}
          className="fixed inset-0 z-40 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in zoom-in-95 duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-sm sm:max-w-md bg-stone-900 border-2 border-amber-800 rounded-2xl overflow-hidden shadow-2xl p-4 flex flex-col items-center"
          >
            {/* Poster Header */}
            <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-stone-800">
              <span className="text-xs font-mono text-amber-400 uppercase font-bold">
                OFFICIAL TEASER POSTER
              </span>
              <button
                onClick={() => setShowPosterArtwork(false)}
                className="text-stone-400 hover:text-stone-200 text-xs font-mono px-2 py-0.5 rounded bg-stone-800"
              >
                CLOSE [ESC]
              </button>
            </div>

            {/* Generated Poster Image */}
            <div className="relative rounded-lg overflow-hidden border border-amber-700/60 shadow-xl max-h-[60vh]">
              <img
                src="/src/assets/images/lone_battalion_poster_1792906093499.jpg"
                alt="The Lone Battalion Official Movie Poster"
                referrerPolicy="no-referrer"
                className="w-full h-auto object-cover max-h-[58vh]"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 text-center">
                <h3
                  className="text-lg font-bold text-amber-200 uppercase"
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  THE LONE BATTALION
                </h3>
                <p className="text-xs text-amber-300 font-mono">
                  STARRING: {heroName.toUpperCase()}
                </p>
              </div>
            </div>

            <p className="text-[11px] font-mono text-stone-400 mt-2.5 text-center">
              Original vintage theatrical teaser artwork. Tap anywhere to close.
            </p>
          </div>
        </div>
      )}

      {/* Floating Poster Picture Thumbnail at top-left/center for quick visual touch */}
      <div className="absolute left-4 top-20 sm:top-24 z-20 hidden lg:block">
        <div
          onClick={() => {
            sound.playButtonClick();
            setShowPosterArtwork(true);
          }}
          className="group relative cursor-pointer bg-black/70 border border-amber-800/80 rounded-lg p-1.5 shadow-2xl hover:scale-105 transition-transform"
        >
          <img
            src="/src/assets/images/lone_battalion_poster_1792906093499.jpg"
            alt="Teaser Poster Mini"
            referrerPolicy="no-referrer"
            className="w-20 h-28 object-cover rounded border border-amber-900/60 shadow-md"
          />
          <div className="text-[9px] font-mono text-center text-amber-300 font-semibold mt-1">
            VIEW POSTER
          </div>
        </div>
      </div>

      {/* Bottom Hero Name Input & Call to Action Controls */}
      <div className="absolute z-20 bottom-4 sm:bottom-8 inset-x-0 flex flex-col items-center px-4 max-w-md mx-auto">
        {/* Hero Name Field */}
        <div className="w-full bg-black/75 backdrop-blur-sm border border-amber-900/80 rounded-xl p-3 mb-2.5 shadow-2xl">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-mono uppercase tracking-wider text-amber-300/90 font-bold">
              Enter your hero's name
            </label>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <Save className="w-2.5 h-2.5" />
              SAVES TO STORAGE
            </span>
          </div>

          <div className="relative flex items-center">
            <input
              type="text"
              value={inputName}
              onChange={handleNameChange}
              maxLength={24}
              placeholder="Major Veer"
              className="w-full bg-stone-900/90 border border-stone-700 rounded-lg px-3 py-2 text-sm font-semibold text-amber-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            <span className="absolute right-3 text-[10px] font-mono text-amber-400/80 font-bold">
              SOLDIER
            </span>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="w-full flex items-center gap-2.5">
          {/* Armory & Outfits Preview Button */}
          <button
            onClick={() => {
              sound.playButtonClick();
              onOpenArmory();
            }}
            className="flex-1 py-3.5 px-3 bg-stone-900/95 hover:bg-stone-800 border border-amber-700/60 rounded-xl text-xs font-bold text-amber-200 hover:text-amber-100 transition-all flex items-center justify-center gap-1.5 shadow-lg active:scale-95"
          >
            <Shield className="w-4 h-4 text-amber-400" />
            <span>ARMORY & GEAR</span>
          </button>

          {/* Glowing "TAP TO PLAY" Button */}
          <button
            onClick={handleStart}
            className="flex-[1.6] py-3.5 px-4 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-600 text-stone-950 font-extrabold text-sm sm:text-base tracking-wider uppercase rounded-xl shadow-[0_0_25px_rgba(234,88,12,0.65)] hover:shadow-[0_0_35px_rgba(249,115,22,0.85)] transition-all flex items-center justify-center gap-2 active:scale-95 animate-pulse"
            style={{
              fontFamily: "'Oswald', sans-serif",
            }}
          >
            <Play className="w-4 h-4 fill-stone-950" />
            <span>TAP TO PLAY</span>
          </button>
        </div>

        {/* Reset Progress & Controls hint footer */}
        <div className="w-full flex items-center justify-between mt-2.5 px-1 text-[10px] font-mono text-amber-300/60">
          <span>HOLD TO FIRE · TAP TO SHOOT</span>

          {onResetSaveData && (
            <div>
              {showConfirmReset ? (
                <div className="flex items-center gap-1.5 bg-red-950/90 border border-red-800 px-2 py-0.5 rounded">
                  <span className="text-red-300">Wipe save?</span>
                  <button
                    onClick={() => {
                      onResetSaveData();
                      setShowConfirmReset(false);
                    }}
                    className="text-red-200 hover:text-white font-bold underline"
                  >
                    YES
                  </button>
                  <span>/</span>
                  <button
                    onClick={() => setShowConfirmReset(false)}
                    className="text-stone-300 hover:text-white"
                  >
                    NO
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirmReset(true)}
                  className="hover:text-red-400 transition-colors flex items-center gap-1 text-[10px]"
                  title="Reset saved high score, coins, and unlocks"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>RESET PROGRESS</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
