import React from 'react';
import { sound } from '../services/sound';
import { Volume2, VolumeX, Pause, RotateCcw, Target, Crosshair, ArrowUp, ArrowDown, Flame } from 'lucide-react';

interface GameHUDProps {
  heroName: string;
  hp: number;
  maxHp: number;
  sandbagHp: number;
  maxSandbagHp: number;
  ammo: number;
  maxAmmo: number;
  isReloading: boolean;
  reloadProgress: number; // 0 to 1
  wave: number;
  level: number;
  score: number;
  coins: number;
  bossHp: number | null;
  bossMaxHp: number | null;
  bossName: string | null;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onManualReload: () => void;
  // Fire Button & Scroll Elevation Controls
  isHoldingFire: boolean;
  onFireStart: () => void;
  onFireEnd: () => void;
  elevation: number; // -1 (high sky) to +1 (low ground)
  onChangeElevation: (val: number) => void;
  autoLockEnabled: boolean;
  onToggleAutoLock: () => void;
  lockedTarget: { name: string; hp: number; maxHp: number; type: string } | null;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  heroName,
  hp,
  maxHp,
  sandbagHp,
  maxSandbagHp,
  ammo,
  maxAmmo,
  isReloading,
  reloadProgress,
  wave,
  level,
  score,
  coins,
  bossHp,
  bossMaxHp,
  bossName,
  isMuted,
  onToggleMute,
  onPause,
  onManualReload,
  isHoldingFire,
  onFireStart,
  onFireEnd,
  elevation,
  onChangeElevation,
  autoLockEnabled,
  onToggleAutoLock,
  lockedTarget,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const sandbagPercent = maxSandbagHp > 0 ? Math.max(0, Math.min(100, (sandbagHp / maxSandbagHp) * 100)) : 0;
  const isBossActive = bossHp !== null && bossMaxHp !== null && bossHp > 0;
  const bossPercent = isBossActive ? Math.max(0, Math.min(100, (bossHp / bossMaxHp) * 100)) : 0;

  // Elevation label
  const elevationLabel = elevation < -0.3 ? 'AIR / SKY' : elevation > 0.3 ? 'GROUND' : 'MID-LEVEL';

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-2 sm:p-4 select-none font-sans">
      {/* TOP BAR CLUSTER */}
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        {/* Left: Hero Status, Name, Health & Sandbag Bar */}
        <div className="pointer-events-auto flex flex-col gap-1.5 bg-black/75 border border-amber-900/60 rounded-xl p-2.5 shadow-xl backdrop-blur-xs min-w-[170px] sm:min-w-[210px]">
          {/* Hero Name & Rank */}
          <div className="flex items-center justify-between text-xs">
            <span
              className="font-bold text-amber-200 tracking-wide uppercase truncate max-w-[120px]"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              {heroName}
            </span>
            <span className="text-[10px] font-mono text-amber-400/90 font-semibold">
              LEVEL {level}
            </span>
          </div>

          {/* Trench Health Bar */}
          <div>
            <div className="flex justify-between text-[11px] font-mono text-stone-300 mb-0.5">
              <span>TRENCH HP</span>
              <span className="tabular-nums font-semibold text-amber-300">
                {Math.ceil(hp)} / {maxHp}
              </span>
            </div>
            <div className="w-full h-3 bg-stone-900 rounded-sm overflow-hidden border border-stone-800">
              <div
                className={`h-full transition-all duration-150 ${
                  hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 25 ? 'bg-amber-500' : 'bg-red-600 animate-pulse'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Sandbag Wall Bar (if unlocked) */}
          {maxSandbagHp > 0 && (
            <div>
              <div className="flex justify-between text-[10px] font-mono text-amber-200/80 mb-0.5">
                <span>SANDBAGS</span>
                <span className="tabular-nums font-semibold text-amber-400">
                  {Math.ceil(sandbagHp)} / {maxSandbagHp}
                </span>
              </div>
              <div className="w-full h-1.5 bg-stone-900 rounded-xs overflow-hidden border border-stone-800">
                <div
                  className="h-full bg-amber-400 transition-all duration-150"
                  style={{ width: `${sandbagPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Center: Wave Indicator or Boss Health Bar */}
        <div className="flex flex-col items-center">
          {isBossActive ? (
            /* Boss Health Bar Display */
            <div className="pointer-events-auto flex flex-col items-center bg-black/90 border-2 border-red-600 rounded-xl px-4 py-2 shadow-2xl backdrop-blur-xs min-w-[240px] sm:min-w-[340px] animate-pulse">
              <span
                className="text-xs sm:text-sm font-extrabold text-red-400 tracking-wider uppercase mb-1"
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                ⚠ {bossName || 'BATTALION COMMANDER'}
              </span>
              <div className="w-full h-3 bg-stone-900 rounded-sm overflow-hidden border border-stone-700">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 transition-all duration-150"
                  style={{ width: `${bossPercent}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-amber-300 mt-0.5 tabular-nums">
                {Math.ceil(bossHp)} / {bossMaxHp} HP · FINAL BOSS
              </span>
            </div>
          ) : (
            /* Standard Wave Banner */
            <div className="pointer-events-auto flex items-center gap-2 bg-black/75 border border-amber-900/60 rounded-xl px-3.5 py-1.5 shadow-xl backdrop-blur-xs">
              <span className="text-[11px] font-mono text-amber-400 tracking-wider">
                WAVE
              </span>
              <span
                className="text-lg font-bold text-amber-200 tabular-nums"
                style={{ fontFamily: "'Black Ops One', 'Oswald', sans-serif" }}
              >
                {wave}
              </span>
              <span className="text-stone-500 text-xs">/</span>
              <span className="text-xs font-mono text-stone-300">
                LVL {level}
              </span>
            </div>
          )}

          {/* Active Target Locked HUD Tag */}
          {lockedTarget && (
            <div className="pointer-events-auto mt-1 flex items-center gap-1.5 bg-black/85 border border-amber-500/80 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-amber-300 shadow-lg animate-pulse">
              <Target className="w-3 h-3 text-red-400" />
              <span>LOCK: <strong>{lockedTarget.name}</strong></span>
              <span className="text-stone-400">({Math.ceil(lockedTarget.hp)} HP)</span>
            </div>
          )}
        </div>

        {/* Right: Score, Coins, Mute & Pause */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Stats Box */}
          <div className="hidden sm:flex flex-col items-end bg-black/75 border border-amber-900/60 rounded-xl px-3 py-1.5 shadow-xl backdrop-blur-xs text-xs font-mono">
            <div className="text-amber-100">
              SCORE <strong className="text-amber-300 tabular-nums">{score.toLocaleString()}</strong>
            </div>
            <div className="text-amber-400/90">
              COINS <strong className="text-yellow-400 tabular-nums">{coins.toLocaleString()}</strong>
            </div>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleMute}
            className="p-2 sm:p-2.5 rounded-xl bg-black/75 border border-amber-900/60 text-amber-200 hover:text-white hover:bg-black/90 transition-colors shadow-lg active:scale-95"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label="Sound Toggle"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Pause Button */}
          <button
            onClick={() => {
              sound.playButtonClick();
              onPause();
            }}
            className="p-2 sm:p-2.5 rounded-xl bg-black/75 border border-amber-900/60 text-amber-200 hover:text-white hover:bg-black/90 transition-colors shadow-lg active:scale-95"
            title="Pause Game"
            aria-label="Pause Game"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* BOTTOM CLUSTER: Ammo & Dedicated Fire Button with Elevation Scroll */}
      <div className="flex items-end justify-between gap-3">
        {/* Left Bottom: Ammo Gauge & Manual Reload Button */}
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 bg-black/80 border border-amber-900/70 rounded-2xl p-2.5 sm:p-3 shadow-2xl backdrop-blur-xs">
          {/* Ammo Counter & Bullet Icons */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-amber-300/80">
                AMMO CLIP
              </span>
              {isReloading && (
                <span className="text-[10px] font-mono text-amber-400 font-bold animate-pulse">
                  RELOADING...
                </span>
              )}
            </div>

            {/* Reloading Bar or Bullet Dots */}
            {isReloading ? (
              <div className="w-28 sm:w-40 h-3 bg-stone-900 rounded overflow-hidden border border-amber-700/60">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-orange-500 transition-all duration-75"
                  style={{ width: `${Math.min(100, reloadProgress * 100)}%` }}
                />
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span
                  className={`text-2xl font-bold tabular-nums ${
                    ammo === 0 ? 'text-red-500 animate-pulse' : ammo <= 5 ? 'text-amber-500' : 'text-amber-200'
                  }`}
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  {ammo}
                </span>
                <span className="text-xs sm:text-sm font-mono text-stone-400">/ {maxAmmo}</span>

                {/* Visual bullet pips */}
                <div className="hidden sm:flex items-center gap-0.5 ml-2">
                  {Array.from({ length: Math.min(12, maxAmmo) }).map((_, i) => {
                    const activeRatio = ammo / maxAmmo;
                    const pipRatio = (i + 1) / Math.min(12, maxAmmo);
                    const filled = activeRatio >= pipRatio;
                    return (
                      <div
                        key={i}
                        className={`w-1 h-3 rounded-xs ${
                          filled ? 'bg-amber-400' : 'bg-stone-800'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Manual Reload Button */}
          <button
            onClick={() => {
              if (!isReloading && ammo < maxAmmo) {
                onManualReload();
              }
            }}
            disabled={isReloading || ammo >= maxAmmo}
            className={`px-2.5 sm:px-3 py-2 rounded-xl font-mono text-xs font-bold uppercase transition-all flex items-center gap-1 shadow-md active:scale-95 ${
              isReloading || ammo >= maxAmmo
                ? 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                : 'bg-amber-700/80 hover:bg-amber-600 text-amber-100 border border-amber-500/80 cursor-pointer'
            }`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">RELOAD</span>
          </button>
        </div>

        {/* RIGHT BOTTOM: DEDICATED FIRE BUTTON + SCROLL ELEVATION CONTROL (User request: directly hit enemies with fire button and scroll up/down) */}
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 bg-black/85 border-2 border-amber-800/80 rounded-2xl p-2 sm:p-2.5 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-xs">
          {/* Vertical Elevation / Aim Track (Scroll Up/Down) */}
          <div className="flex flex-col items-center justify-between h-20 sm:h-24 w-12 sm:w-14 bg-stone-950/90 rounded-xl p-1 border border-stone-800">
            {/* Scroll Up button (Sky / Air Fighters) */}
            <button
              onClick={() => {
                sound.playButtonClick();
                onChangeElevation(Math.max(-1.0, elevation - 0.5));
              }}
              className={`w-full py-1 rounded flex items-center justify-center transition-colors text-[9px] font-mono font-bold ${
                elevation < -0.2 ? 'bg-sky-600 text-white' : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Aim Up at Air Fighters & Zeppelins"
            >
              <ArrowUp className="w-3 h-3" />
            </button>

            {/* Vertical Scroll Slider Bar */}
            <div className="relative w-2 h-9 sm:h-11 bg-stone-800 rounded-full my-0.5 overflow-hidden">
              <div
                className="absolute w-full bg-amber-400 transition-all duration-100 rounded-full"
                style={{
                  top: `${((elevation + 1) / 2) * 75}%`,
                  height: '25%',
                }}
              />
            </div>

            {/* Scroll Down button (Ground Infantry / Tanks) */}
            <button
              onClick={() => {
                sound.playButtonClick();
                onChangeElevation(Math.min(1.0, elevation + 0.5));
              }}
              className={`w-full py-1 rounded flex items-center justify-center transition-colors text-[9px] font-mono font-bold ${
                elevation > 0.2 ? 'bg-amber-600 text-stone-950' : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Aim Down at Ground Enemies"
            >
              <ArrowDown className="w-3 h-3" />
            </button>

            <span className="text-[8px] font-mono text-amber-300 font-bold truncate max-w-[46px] text-center">
              {elevationLabel}
            </span>
          </div>

          {/* Auto-Lock Toggle and BIG FIRE BUTTON */}
          <div className="flex flex-col items-center gap-1.5">
            {/* Auto Lock Toggle Pill */}
            <button
              onClick={() => {
                sound.playButtonClick();
                onToggleAutoLock();
              }}
              className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold transition-all flex items-center gap-1 border ${
                autoLockEnabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                  : 'bg-stone-800/80 text-stone-400 border-stone-700'
              }`}
              title="Auto-locks onto nearest enemy when firing"
            >
              <Crosshair className="w-2.5 h-2.5 text-red-400" />
              <span>{autoLockEnabled ? 'DIRECT HIT: ON' : 'MANUAL AIM'}</span>
            </button>

            {/* BIG ROUND FIRE BUTTON */}
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                onFireStart();
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                onFireEnd();
              }}
              onPointerLeave={(e) => {
                e.preventDefault();
                onFireEnd();
              }}
              className={`relative w-18 h-18 sm:w-22 sm:h-22 rounded-full border-4 flex flex-col items-center justify-center transition-all select-none shadow-2xl active:scale-90 ${
                isHoldingFire
                  ? 'bg-gradient-to-br from-red-600 via-orange-600 to-amber-600 border-yellow-300 shadow-[0_0_35px_rgba(239,68,68,0.9)] scale-95'
                  : 'bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 border-amber-400 hover:border-yellow-200 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
              }`}
              style={{
                fontFamily: "'Black Ops One', 'Oswald', sans-serif",
              }}
            >
              <Flame className={`w-5 h-5 sm:w-6 sm:h-6 text-stone-950 ${isHoldingFire ? 'animate-bounce' : ''}`} />
              <span className="text-stone-950 font-black text-sm sm:text-base tracking-widest mt-0.5">
                FIRE
              </span>

              {/* Pulsing firing ring */}
              {isHoldingFire && (
                <div className="absolute inset-0 rounded-full border-2 border-yellow-200 animate-ping opacity-75 pointer-events-none" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
