import React, { useState } from 'react';
import { OutfitId, Upgrades } from '../types/game';
import { getUpgradeCost, OUTFITS, UPGRADE_CONFIG } from '../game/constants';
import { sound } from '../services/sound';
import { Zap, Crosshair, Box, RotateCcw, Shield, Check, Play, ChevronRight } from 'lucide-react';

interface ArmoryModalProps {
  coins: number;
  upgrades: Upgrades;
  unlockedOutfits: OutfitId[];
  equippedOutfit: OutfitId;
  nextWaveNumber: number;
  onUpgrade: (key: keyof Upgrades, cost: number) => void;
  onUnlockOutfit: (id: OutfitId, cost: number) => void;
  onEquipOutfit: (id: OutfitId) => void;
  onStartNextWave: () => void;
  onClose?: () => void;
  isIntermission?: boolean;
}

export const ArmoryModal: React.FC<ArmoryModalProps> = ({
  coins,
  upgrades,
  unlockedOutfits,
  equippedOutfit,
  nextWaveNumber,
  onUpgrade,
  onUnlockOutfit,
  onEquipOutfit,
  onStartNextWave,
  onClose,
  isIntermission = false,
}) => {
  const [activeTab, setActiveTab] = useState<'upgrades' | 'outfits'>('upgrades');

  const upgradeIcons: Record<keyof Upgrades, React.ReactNode> = {
    fireRate: <Zap className="w-5 h-5 text-amber-400" />,
    damage: <Crosshair className="w-5 h-5 text-red-400" />,
    ammoCap: <Box className="w-5 h-5 text-blue-400" />,
    reloadSpeed: <RotateCcw className="w-5 h-5 text-emerald-400" />,
    sandbagWall: <Shield className="w-5 h-5 text-yellow-500" />,
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md select-none font-sans overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-amber-900/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-amber-900/60 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono tracking-widest text-amber-500 uppercase font-bold">
                {isIntermission ? `WAVE ${nextWaveNumber - 1} CLEARED` : 'SUPPLY DEPOT'}
              </span>
            </div>
            <h2
              className="text-2xl sm:text-3xl font-extrabold text-amber-100 uppercase tracking-wide"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              FIELD ARMORY
            </h2>
          </div>

          {/* Coin Badge */}
          <div className="flex items-center gap-2 bg-black/50 border border-amber-800/60 rounded-lg px-3 py-1.5">
            <span className="text-xs font-mono text-stone-400">COINS</span>
            <span className="text-base font-bold text-amber-400 tabular-nums font-mono">
              {coins.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-800 bg-stone-950/60 px-5 pt-2 gap-2">
          <button
            onClick={() => {
              sound.playButtonClick();
              setActiveTab('upgrades');
            }}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-colors flex items-center gap-2 border-t-2 ${
              activeTab === 'upgrades'
                ? 'bg-stone-900 text-amber-300 border-amber-500'
                : 'text-stone-400 hover:text-stone-200 border-transparent'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>WEAPON UPGRADES</span>
          </button>
          <button
            onClick={() => {
              sound.playButtonClick();
              setActiveTab('outfits');
            }}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-colors flex items-center gap-2 border-t-2 ${
              activeTab === 'outfits'
                ? 'bg-stone-900 text-amber-300 border-amber-500'
                : 'text-stone-400 hover:text-stone-200 border-transparent'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>HERO OUTFITS</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {activeTab === 'upgrades' ? (
            /* Upgrades List */
            (Object.keys(UPGRADE_CONFIG) as (keyof Upgrades)[]).map((key) => {
              const cfg = UPGRADE_CONFIG[key];
              const currentLvl = upgrades[key];
              const isMax = currentLvl >= cfg.maxLevel;
              const cost = getUpgradeCost(key, currentLvl);
              const canAfford = coins >= cost;

              return (
                <div
                  key={key}
                  className="bg-stone-950/70 border border-stone-800 hover:border-amber-900/60 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-700 shrink-0">
                      {upgradeIcons[key]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-stone-100 uppercase tracking-wide">
                          {cfg.name}
                        </h4>
                        <span className="text-[11px] font-mono text-amber-400 font-semibold">
                          {cfg.getLabel(currentLvl)}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5 max-w-sm">
                        {cfg.desc}
                      </p>

                      {/* Level Pips */}
                      <div className="flex items-center gap-1.5 mt-2">
                        {Array.from({ length: cfg.maxLevel }).map((_, idx) => (
                          <div
                            key={idx}
                            className={`h-1.5 w-5 sm:w-7 rounded-xs ${
                              idx < currentLvl
                                ? 'bg-amber-400'
                                : 'bg-stone-800 border border-stone-700'
                            }`}
                          />
                        ))}
                        <span className="text-[10px] font-mono text-stone-500 ml-1">
                          LVL {currentLvl}/{cfg.maxLevel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Buy Button */}
                  <div className="sm:self-center shrink-0">
                    {isMax ? (
                      <div className="px-4 py-2 rounded-lg bg-stone-800 border border-stone-700 text-stone-400 text-xs font-mono font-bold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>MAXED</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (canAfford) {
                            sound.playButtonClick();
                            onUpgrade(key, cost);
                          }
                        }}
                        disabled={!canAfford}
                        className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 ${
                          canAfford
                            ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 font-extrabold cursor-pointer'
                            : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                        }`}
                      >
                        <span>UPGRADE</span>
                        <span className="font-mono tabular-nums text-stone-950 font-black">
                          ({cost} C)
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            /* Outfits Wardrobe */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {(Object.keys(OUTFITS) as OutfitId[]).map((outfitId) => {
                const outfit = OUTFITS[outfitId];
                const isUnlocked = unlockedOutfits.includes(outfitId);
                const isEquipped = equippedOutfit === outfitId;
                const canAfford = coins >= outfit.cost;

                return (
                  <div
                    key={outfitId}
                    className={`relative rounded-xl p-3.5 border transition-all flex flex-col justify-between ${
                      isEquipped
                        ? 'bg-amber-950/30 border-amber-500/90 shadow-md ring-1 ring-amber-500/50'
                        : isUnlocked
                        ? 'bg-stone-950/80 border-stone-800 hover:border-amber-900'
                        : 'bg-stone-950/40 border-stone-800/80 opacity-90'
                    }`}
                  >
                    <div>
                      {/* Outfit Palette Preview Pill */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="font-bold text-sm text-stone-100 uppercase"
                          style={{ fontFamily: "'Oswald', sans-serif" }}
                        >
                          {outfit.name}
                        </span>
                        <div className="flex items-center gap-1 p-1 bg-black/60 rounded border border-stone-700">
                          <div
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: outfit.colors.jacket }}
                            title="Jacket"
                          />
                          <div
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: outfit.colors.bandana }}
                            title="Bandana"
                          />
                          <div
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: outfit.colors.bandolier }}
                            title="Bandolier"
                          />
                        </div>
                      </div>

                      <p className="text-xs text-stone-400 mb-2">
                        {outfit.tagline}
                      </p>

                      <div className="text-[11px] font-mono text-amber-300/90 mb-3 bg-stone-900/80 rounded px-2 py-1 border border-stone-800">
                        {outfit.bonusDescription}
                      </div>
                    </div>

                    {/* Outfit Action */}
                    <div>
                      {isEquipped ? (
                        <div className="w-full py-2 bg-amber-500/20 border border-amber-500/60 rounded-lg text-amber-300 text-xs font-bold uppercase flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>EQUIPPED</span>
                        </div>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => {
                            sound.playButtonClick();
                            onEquipOutfit(outfitId);
                          }}
                          className="w-full py-2 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded-lg text-xs font-bold text-stone-200 uppercase transition-colors"
                        >
                          EQUIP OUTFIT
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (canAfford) {
                              sound.playButtonClick();
                              onUnlockOutfit(outfitId, outfit.cost);
                            }
                          }}
                          disabled={!canAfford}
                          className={`w-full py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-1 ${
                            canAfford
                              ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 font-black cursor-pointer'
                              : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                          }`}
                        >
                          <span>UNLOCK</span>
                          <span className="font-mono tabular-nums">({outfit.cost} C)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-stone-800 bg-stone-950 flex items-center justify-between gap-3">
          {onClose && !isIntermission ? (
            <button
              onClick={() => {
                sound.playButtonClick();
                onClose();
              }}
              className="px-4 py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold uppercase transition-colors"
            >
              CLOSE
            </button>
          ) : (
            <div className="text-xs font-mono text-stone-400">
              NEXT THREAT: <strong className="text-amber-400">WAVE {nextWaveNumber}</strong>
            </div>
          )}

          <button
            onClick={() => {
              sound.playButtonClick();
              onStartNextWave();
            }}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-stone-950 font-extrabold text-sm uppercase tracking-wide shadow-lg hover:shadow-orange-600/30 transition-all flex items-center gap-2 active:scale-95"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            <span>{isIntermission ? `DEPLOY TO WAVE ${nextWaveNumber}` : 'DEPLOY NOW'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
