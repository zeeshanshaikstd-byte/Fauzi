/**
 * The Lone Battalion - 1940s Frontline Trench Defense
 * Mobile-first HTML5 Canvas & Web Audio game with Air Combat, Zeppelins, Big Bosses & Direct-Hit Fire Controls.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bullet, Enemy, EnemyType, GameState, OutfitId, Upgrades } from './types/game';
import { BOSS_NAMES, OUTFITS, UPGRADE_CONFIG } from './game/constants';
import { GameRenderer } from './game/renderer';
import { ParticleSystem } from './game/particles';
import { sound } from './services/sound';
import { SaveData, storage } from './services/storage';
import { TeaserPoster } from './components/TeaserPoster';
import { GameHUD } from './components/GameHUD';
import { ArmoryModal } from './components/ArmoryModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { VictoryLevelModal } from './components/VictoryLevelModal';

export default function App() {
  // Persistent Save State
  const [heroName, setHeroName] = useState<string>(() => storage.getHeroName());
  const [highScore, setHighScore] = useState<number>(() => storage.getHighScore());
  const [coins, setCoins] = useState<number>(() => storage.getCoins());
  const [equippedOutfit, setEquippedOutfit] = useState<OutfitId>(() => storage.getEquippedOutfit());
  const [unlockedOutfits, setUnlockedOutfits] = useState<OutfitId[]>(() => storage.getUnlockedOutfits());
  const [upgrades, setUpgrades] = useState<Upgrades>(() => storage.getUpgrades());
  const [currentLevel, setCurrentLevel] = useState<number>(() => storage.loadGame().data.level || 1);
  const [hasSavedData, setHasSavedData] = useState<boolean>(() => storage.hasSavedData());
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // UI Flow State
  const [gameState, setGameState] = useState<GameState>('POSTER');
  const [showArmory, setShowArmory] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());

  // Direct-Hit Fire Button & Elevation Controls
  const [elevation, setElevation] = useState<number>(0); // -1.0 (sky) to +1.0 (ground)
  const [autoLockEnabled, setAutoLockEnabled] = useState<boolean>(true);
  const [isHoldingFireButton, setIsHoldingFireButton] = useState<boolean>(false);
  const [lockedTargetHUD, setLockedTargetHUD] = useState<{ name: string; hp: number; maxHp: number; type: string } | null>(null);

  // Level Victory Modal State
  const [levelVictoryData, setLevelVictoryData] = useState<{
    completedLevel: number;
    completedWave: number;
    score: number;
    bonusCoins: number;
    bossName: string;
  } | null>(null);

  // React HUD Mirroring State
  const [hudHp, setHudHp] = useState<number>(100);
  const [hudMaxHp] = useState<number>(100);
  const [hudSandbagHp, setHudSandbagHp] = useState<number>(0);
  const [hudMaxSandbagHp, setHudMaxSandbagHp] = useState<number>(0);
  const [hudAmmo, setHudAmmo] = useState<number>(30);
  const [hudMaxAmmo, setHudMaxAmmo] = useState<number>(30);
  const [hudIsReloading, setHudIsReloading] = useState<boolean>(false);
  const [hudReloadProgress, setHudReloadProgress] = useState<number>(0);
  const [hudWave, setHudWave] = useState<number>(1);
  const [hudScore, setHudScore] = useState<number>(0);
  const [hudCoins, setHudCoins] = useState<number>(() => storage.getCoins());
  const [hudBossHp, setHudBossHp] = useState<number | null>(null);
  const [hudBossMaxHp, setHudBossMaxHp] = useState<number | null>(null);
  const [hudBossName, setHudBossName] = useState<string | null>(null);

  // Game Over summary state
  const [gameOverStats, setGameOverStats] = useState<{
    wavesSurvived: number;
    score: number;
    highScore: number;
    isNewRecord: boolean;
    enemiesDefeated: number;
    coinsEarned: number;
  }>({
    wavesSurvived: 0,
    score: 0,
    highScore: 0,
    isNewRecord: false,
    enemiesDefeated: 0,
    coinsEarned: 0,
  });

  // Canvas & Simulation Engine Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<GameRenderer>(new GameRenderer());
  const particlesRef = useRef<ParticleSystem>(new ParticleSystem());

  // Mutable Game Loop State Ref
  const gRef = useRef({
    state: 'POSTER' as GameState,
    heroHp: 100,
    maxHp: 100,
    sandbagHp: 0,
    maxSandbagHp: 0,
    ammo: 30,
    maxAmmo: 30,
    isReloading: false,
    reloadTimer: 0,
    reloadDuration: 1.5,
    fireCooldown: 0,
    fireDelay: 0.2, // 200ms base
    bulletDamage: 25,
    level: 1,
    wave: 1,
    score: 0,
    coinsEarnedThisRun: 0,
    enemiesKilled: 0,
    enemiesRemainingToSpawn: 0,
    spawnTimer: 0,
    spawnInterval: 1.6,
    isWaveEnding: false,
    waveEndTimer: 0,
    screenShake: 0,
    recoil: 0,
    barrelHeat: 0,
    muzzleFlash: 0,
    aimAngle: 0,
    aimPoint: null as { x: number; y: number } | null,
    isPointerDown: false,
    elevation: 0, // -1.0 to 1.0
    autoLock: true,
    trenchX: 180,
    enemies: [] as Enemy[],
    bullets: [] as Bullet[],
    nextBulletId: 1,
    nextEnemyId: 1,
    lastTime: 0,
    totalTime: 0,
    hudThrottle: 0,
  });

  // Calculate stats from upgrades
  const refreshStatsFromUpgrades = useCallback((currentUpgrades: Upgrades) => {
    const g = gRef.current;
    g.fireDelay = UPGRADE_CONFIG.fireRate.getValue(currentUpgrades.fireRate) / 1000;
    g.bulletDamage = UPGRADE_CONFIG.damage.getValue(currentUpgrades.damage);
    g.maxAmmo = UPGRADE_CONFIG.ammoCap.getValue(currentUpgrades.ammoCap);
    g.reloadDuration = UPGRADE_CONFIG.reloadSpeed.getValue(currentUpgrades.reloadSpeed);
    g.maxSandbagHp = UPGRADE_CONFIG.sandbagWall.getValue(currentUpgrades.sandbagWall);
    g.sandbagHp = g.maxSandbagHp;
    g.ammo = g.maxAmmo;
    setHudMaxAmmo(g.maxAmmo);
    setHudAmmo(g.ammo);
    setHudMaxSandbagHp(g.maxSandbagHp);
    setHudSandbagHp(g.sandbagHp);
  }, []);

  // Save helper function that updates localStorage whenever a relevant change occurs
  const saveGameData = useCallback((partial: Partial<SaveData>) => {
    const updated = storage.saveGame(partial);
    setHasSavedData(true);
    if (partial.coins !== undefined) {
      setCoins(updated.coins);
      setHudCoins(updated.coins);
    }
    if (partial.highScore !== undefined) setHighScore(updated.highScore);
    if (partial.unlockedOutfits !== undefined) setUnlockedOutfits(updated.unlockedOutfits);
    if (partial.equippedOutfit !== undefined) setEquippedOutfit(updated.equippedOutfit);
    if (partial.heroName !== undefined) setHeroName(updated.heroName);
    if (partial.level !== undefined) setCurrentLevel(updated.level);
    if (partial.upgrades !== undefined) {
      setUpgrades(updated.upgrades);
      refreshStatsFromUpgrades(updated.upgrades);
    }
    return updated;
  }, [refreshStatsFromUpgrades]);

  // When game starts: Check if data exists in localStorage and load it
  useEffect(() => {
    const exists = storage.hasSavedData();
    setHasSavedData(exists);
    const { data, isNewSave } = storage.loadGame();

    setHeroName(data.heroName);
    setHighScore(data.highScore);
    setCoins(data.coins);
    setHudCoins(data.coins);
    setEquippedOutfit(data.equippedOutfit);
    setUnlockedOutfits(data.unlockedOutfits);
    setUpgrades(data.upgrades);
    setCurrentLevel(data.level || 1);
    gRef.current.level = data.level || 1;
    refreshStatsFromUpgrades(data.upgrades);

    if (exists && !isNewSave) {
      setSaveNotice(`Save Loaded: ${data.coins} Coins · High Score ${data.highScore.toLocaleString()}`);
      const timer = setTimeout(() => setSaveNotice(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [refreshStatsFromUpgrades]);

  // Update hero name with reactive save
  const handleUpdateHeroName = (name: string) => {
    const clean = name.trim() || 'Major Veer';
    setHeroName(clean);
    saveGameData({ heroName: clean });
  };

  // Reset save data back to factory defaults
  const handleResetSaveData = () => {
    const fresh = storage.resetSaveData();
    setHeroName(fresh.heroName);
    setHighScore(fresh.highScore);
    setCoins(fresh.coins);
    setHudCoins(fresh.coins);
    setEquippedOutfit(fresh.equippedOutfit);
    setUnlockedOutfits(fresh.unlockedOutfits);
    setUpgrades(fresh.upgrades);
    setCurrentLevel(1);
    gRef.current.level = 1;
    refreshStatsFromUpgrades(fresh.upgrades);
    setHasSavedData(false);
    setSaveNotice('Progress reset to default');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  // Start new game run
  const startNewGame = useCallback(() => {
    const g = gRef.current;
    g.state = 'PLAYING';
    g.heroHp = 100;
    g.maxHp = 100;
    g.wave = 1;
    g.score = 0;
    g.coinsEarnedThisRun = 0;
    g.enemiesKilled = 0;
    g.enemies = [];
    g.bullets = [];
    g.isReloading = false;
    g.reloadTimer = 0;
    g.isWaveEnding = false;
    g.screenShake = 0;
    g.recoil = 0;
    g.barrelHeat = 0;
    g.muzzleFlash = 0;

    particlesRef.current.clear();
    refreshStatsFromUpgrades(upgrades);

    // Initialize Wave 1
    initWave(1, g.level);

    setGameState('PLAYING');
    setShowArmory(false);
  }, [refreshStatsFromUpgrades, upgrades]);

  // Setup wave parameters
  const initWave = (waveNum: number, lvl: number) => {
    const g = gRef.current;
    g.wave = waveNum;
    g.level = lvl;
    // 5 waves per level; wave 5 is the final Boss wave!
    const isBossWave = waveNum % 5 === 0;
    g.enemiesRemainingToSpawn = isBossWave ? 7 + lvl * 3 : 5 + waveNum * 3 + lvl * 2;
    g.spawnTimer = 0.5;
    g.spawnInterval = Math.max(0.6, 1.7 - waveNum * 0.08 - lvl * 0.05);
    g.isWaveEnding = false;
    g.waveEndTimer = 0;

    // Reset sandbag fortification per wave if unlocked
    if (g.maxSandbagHp > 0) {
      g.sandbagHp = g.maxSandbagHp;
    }

    if (isBossWave) {
      sound.playAirRaidSiren();
      g.screenShake = 1.4;
      particlesRef.current.addNoticeText(
        window.innerWidth * 0.5,
        window.innerHeight * 0.35,
        `⚠ LEVEL ${lvl} CLIMAX: COLOSSAL DREADNOUGHT ⚠`,
        '#ef4444'
      );
    } else {
      particlesRef.current.addNoticeText(
        window.innerWidth * 0.5,
        window.innerHeight * 0.35,
        `LEVEL ${lvl} · WAVE ${waveNum}`,
        '#f59e0b'
      );
    }
  };

  // Start next wave after intermission
  const startNextWave = useCallback(() => {
    const g = gRef.current;
    g.state = 'PLAYING';
    initWave(g.wave + 1, g.level);
    refreshStatsFromUpgrades(upgrades);
    setGameState('PLAYING');
    setShowArmory(false);
  }, [refreshStatsFromUpgrades, upgrades]);

  // Advance to next level after defeating Big Boss
  const handleAdvanceToNextLevel = useCallback(() => {
    const nextLvl = currentLevel + 1;
    setCurrentLevel(nextLvl);
    gRef.current.level = nextLvl;
    saveGameData({ level: nextLvl });

    setLevelVictoryData(null);
    gRef.current.state = 'PLAYING';
    gRef.current.heroHp = 100;
    gRef.current.enemies = [];
    gRef.current.bullets = [];
    initWave(1, nextLvl);
    refreshStatsFromUpgrades(upgrades);
    setGameState('PLAYING');
  }, [currentLevel, refreshStatsFromUpgrades, saveGameData, upgrades]);

  // Trigger manual reload
  const triggerReload = useCallback(() => {
    const g = gRef.current;
    if (g.isReloading || g.ammo >= g.maxAmmo) return;
    g.isReloading = true;
    g.reloadTimer = 0;
    sound.playReloadStart();
  }, []);

  // Find priority enemy for Direct-Hit / Auto-Lock Aiming
  const findTargetEnemy = useCallback(() => {
    const g = gRef.current;
    const candidates = g.enemies.filter(e => e.hp > 0 && e.state !== 'dying' && e.x > g.trenchX + 25);
    if (candidates.length === 0) return null;

    const elev = g.elevation; // -1 to +1

    // Sort candidates according to target priority & elevation alignment
    return candidates.sort((a, b) => {
      // 1. High priority for falling bombs close to trench
      if (a.type === 'bomb' && a.x < g.trenchX + 250) return -1;
      if (b.type === 'bomb' && b.x < g.trenchX + 250) return 1;

      // 2. Elevation matching preference:
      // If elevation < -0.2 (aiming up): heavily favor air units
      if (elev < -0.2) {
        const aAir = a.type === 'fighter' || a.type === 'airship' || a.type === 'bomb';
        const bAir = b.type === 'fighter' || b.type === 'airship' || b.type === 'bomb';
        if (aAir && !bAir) return -1;
        if (!aAir && bAir) return 1;
      }
      // If elevation > 0.2 (aiming down): favor ground units
      if (elev > 0.2) {
        const aGround = a.type === 'infantry' || a.type === 'heavy' || a.type === 'scout' || (a.type === 'boss' && a.y > 300);
        const bGround = b.type === 'infantry' || b.type === 'heavy' || b.type === 'scout' || (b.type === 'boss' && b.y > 300);
        if (aGround && !bGround) return -1;
        if (!aGround && bGround) return 1;
      }

      // 3. Otherwise, target closest threat to trench
      return a.x - b.x;
    })[0] || null;
  }, []);

  // Firing function: handles both manual point-aim and direct-hit auto-lock
  const fireBullet = useCallback(() => {
    const g = gRef.current;
    if (g.state !== 'PLAYING') return;

    if (g.isReloading) {
      sound.playEmptyClick();
      return;
    }

    if (g.ammo <= 0) {
      sound.playEmptyClick();
      triggerReload();
      return;
    }

    if (g.fireCooldown > 0) return;

    // Expend ammo
    g.ammo -= 1;
    g.fireCooldown = g.fireDelay;
    g.recoil = 1.0;
    g.barrelHeat = Math.min(1.0, g.barrelHeat + 0.15);
    g.muzzleFlash = 0.06;

    sound.playGunshot();

    setTimeout(() => {
      sound.playShellDrop();
    }, 180);

    const canvas = canvasRef.current;
    const height = canvas ? canvas.height : window.innerHeight;
    const trenchY = height * 0.72 - 5;
    const muzzleOriginX = g.trenchX + 48;
    const muzzleOriginY = trenchY - 48;

    // Determine target point: Direct-Hit auto-lock or manual aim
    let targetX = window.innerWidth;
    let targetY = muzzleOriginY;

    const lockedEnemy = g.autoLock ? findTargetEnemy() : null;

    if (lockedEnemy) {
      // Direct hit auto-lock: calculate lead point directly on enemy center
      targetX = lockedEnemy.x;
      targetY = lockedEnemy.y - (lockedEnemy.height ? lockedEnemy.height * 0.45 : 0);
    } else if (g.aimPoint) {
      // Manual mouse/touch pointer
      targetX = g.aimPoint.x;
      targetY = g.aimPoint.y;
    } else {
      // Elevation slider default trajectory
      targetX = muzzleOriginX + 600;
      targetY = muzzleOriginY + g.elevation * 260;
    }

    // Angle & Velocity
    const dx = targetX - muzzleOriginX;
    const dy = targetY - muzzleOriginY;
    const angle = Math.atan2(dy, dx);
    g.aimAngle = Math.max(-0.75, Math.min(0.4, angle)); // Clamped machine gun pitch

    const bulletSpeed = 1650;
    const vx = Math.cos(angle) * bulletSpeed;
    const vy = Math.sin(angle) * bulletSpeed;

    // Add bullet
    g.bullets.push({
      id: g.nextBulletId++,
      x: muzzleOriginX,
      y: muzzleOriginY,
      startX: muzzleOriginX,
      startY: muzzleOriginY,
      targetX,
      targetY,
      vx,
      vy,
      damage: g.bulletDamage,
      speed: bulletSpeed,
      life: 0,
      maxLife: 1.25,
      tracerLength: 48,
    });

    // Emit muzzle particles
    particlesRef.current.emitMuzzle(muzzleOriginX, muzzleOriginY, angle);
    particlesRef.current.emitShellCasing(g.trenchX - 25, trenchY - 40);

    g.screenShake = Math.max(g.screenShake, 0.15);

    if (g.ammo <= 0) {
      triggerReload();
    }
  }, [findTargetEnemy, triggerReload]);

  // Spawn Enemy (Ground & Air Units)
  const spawnEnemy = (wave: number, lvl: number, width: number, height: number) => {
    const g = gRef.current;
    const groundY = height * 0.72;
    const isBossWave = wave % 5 === 0;

    let type: EnemyType = 'infantry';

    if (isBossWave && g.enemiesRemainingToSpawn === 1 && !g.enemies.some(e => e.type === 'boss')) {
      type = 'boss';
    } else {
      const rand = Math.random();
      // Wave 2+ introduces Air Fighters; Wave 3+ introduces Zeppelins/Airships
      if (wave >= 3 && rand < 0.22) {
        type = 'airship'; // War Zeppelin
      } else if (wave >= 2 && rand < (wave >= 3 ? 0.48 : 0.38)) {
        type = 'fighter'; // Raider Fighter Monoplane
      } else if (wave >= 3 && rand < 0.65) {
        type = 'heavy'; // Armored trooper
      } else if (rand < 0.85) {
        type = 'scout'; // Fast runner
      } else {
        type = 'infantry'; // Standard rifleman
      }
    }

    let hp = 45 + wave * 10 + lvl * 15;
    let speed = 65 + Math.random() * 20;
    let damage = 8 + Math.floor(wave * 1.5);
    let sizeW = 20;
    let sizeH = 48;
    let spawnY = groundY;
    let bossName: string | undefined = undefined;
    let diveAngle = 0;
    let bombDropCooldown = 0;

    if (type === 'fighter') {
      hp = Math.round(55 + wave * 12 + lvl * 15);
      speed = 190 + Math.random() * 40;
      damage = 12 + Math.floor(wave * 2);
      sizeW = 54;
      sizeH = 26;
      spawnY = height * (0.18 + Math.random() * 0.24); // High sky
      diveAngle = -0.08 + Math.random() * 0.05;
      sound.playPlaneDive();
    } else if (type === 'airship') {
      hp = Math.round(240 + wave * 45 + lvl * 60);
      speed = 32 + Math.random() * 10;
      damage = 25;
      sizeW = 86;
      sizeH = 38;
      spawnY = height * (0.14 + Math.random() * 0.12); // Upper sky
      bombDropCooldown = 2.0 + Math.random() * 1.5;
    } else if (type === 'scout') {
      hp = Math.round(25 + wave * 6 + lvl * 8);
      speed = 115 + Math.random() * 25;
      damage = 5 + Math.floor(wave * 0.8);
      sizeH = 42;
    } else if (type === 'heavy') {
      hp = Math.round(110 + wave * 24 + lvl * 30);
      speed = 38 + Math.random() * 12;
      damage = 14 + Math.floor(wave * 2.2);
      sizeW = 26;
      sizeH = 54;
    } else if (type === 'boss') {
      hp = Math.round(650 + wave * 150 + lvl * 280);
      speed = 22;
      damage = 35 + wave * 5;
      sizeW = 75;
      sizeH = 90;
      spawnY = groundY;
      bossName = BOSS_NAMES[(lvl - 1) % BOSS_NAMES.length] || 'Battalion Commander Ironheart';
    }

    g.enemies.push({
      id: g.nextEnemyId++,
      x: width + 60 + Math.random() * 60,
      y: spawnY,
      type,
      hp,
      maxHp: hp,
      speed,
      baseSpeed: speed,
      damage,
      width: sizeW,
      height: sizeH,
      walkFrame: 0,
      attackCooldown: 0,
      state: 'walking',
      deathTimer: 0.6,
      color: '#475569',
      isHitFlash: 0,
      name: bossName,
      diveAngle,
      bombDropCooldown,
    });
  };

  // Drop an Aerial Bomb from an Airship or Fighter
  const dropAerialBomb = (fromX: number, fromY: number) => {
    const g = gRef.current;
    sound.playBombWhistle();
    g.enemies.push({
      id: g.nextEnemyId++,
      x: fromX,
      y: fromY + 15,
      type: 'bomb',
      hp: 15, // Can be shot out of the air in 1 hit!
      maxHp: 15,
      speed: 120,
      baseSpeed: 120,
      damage: 25,
      width: 14,
      height: 22,
      walkFrame: 0,
      attackCooldown: 0,
      state: 'walking',
      deathTimer: 0.3,
      color: '#ef4444',
      isHitFlash: 0,
      vy: 160 + Math.random() * 60,
      vx: -40,
    });
  };

  // Main 60fps Game Simulation Loop
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
      gRef.current.trenchX = Math.max(100, Math.min(220, window.innerWidth * 0.2));
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const loop = (timestamp: number) => {
      const g = gRef.current;

      if (!g.lastTime) g.lastTime = timestamp;
      const rawDt = (timestamp - g.lastTime) / 1000;
      g.lastTime = timestamp;
      const dt = Math.min(rawDt, 0.05); // Clamped delta-time
      g.totalTime += dt;

      if (g.state === 'PLAYING') {
        // Continuous shooting when pointer or fire button is held
        if (g.isPointerDown) {
          fireBullet();
        }

        // Fire cooldown & Gun Recoil Decay
        if (g.fireCooldown > 0) g.fireCooldown -= dt;
        if (g.recoil > 0) g.recoil = Math.max(0, g.recoil - dt * 5);
        if (g.barrelHeat > 0) g.barrelHeat = Math.max(0, g.barrelHeat - dt * 0.35);
        if (g.muzzleFlash > 0) g.muzzleFlash = Math.max(0, g.muzzleFlash - dt);
        if (g.screenShake > 0) g.screenShake = Math.max(0, g.screenShake - dt * 3.5);

        // Reload Timer
        if (g.isReloading) {
          g.reloadTimer += dt;
          if (g.reloadTimer >= g.reloadDuration) {
            g.isReloading = false;
            g.reloadTimer = 0;
            g.ammo = g.maxAmmo;
            sound.playReloadFinish();
          }
        }

        // Enemy Spawning
        if (g.enemiesRemainingToSpawn > 0) {
          g.spawnTimer -= dt;
          if (g.spawnTimer <= 0) {
            spawnEnemy(g.wave, g.level, canvas.width, canvas.height);
            g.enemiesRemainingToSpawn -= 1;
            g.spawnTimer = g.spawnInterval + (Math.random() - 0.5) * 0.35;
          }
        }

        // Update Bullets
        for (let i = g.bullets.length - 1; i >= 0; i--) {
          const b = g.bullets[i];
          b.life += dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;

          let bulletHit = false;

          for (const enemy of g.enemies) {
            if (enemy.hp <= 0 || enemy.state === 'dying') continue;

            const enemyLeft = enemy.x - enemy.width * 0.5;
            const enemyRight = enemy.x + enemy.width * 0.5;
            const enemyTop = enemy.type === 'fighter' || enemy.type === 'airship' || enemy.type === 'bomb'
              ? enemy.y - enemy.height * 0.5
              : enemy.y - enemy.height;
            const enemyBottom = enemy.type === 'fighter' || enemy.type === 'airship' || enemy.type === 'bomb'
              ? enemy.y + enemy.height * 0.5
              : enemy.y;

            if (b.x >= enemyLeft && b.x <= enemyRight && b.y >= enemyTop && b.y <= enemyBottom) {
              bulletHit = true;

              // Black coat bonus: higher crit chance
              const critChance = equippedOutfit === 'black_coat' ? 0.32 : 0.15;
              const isCrit = Math.random() < critChance;
              const finalDamage = isCrit ? Math.round(b.damage * 1.5) : b.damage;

              enemy.hp -= finalDamage;
              enemy.isHitFlash = 0.1;

              const isArmored = enemy.type === 'heavy' || enemy.type === 'airship';
              sound.playEnemyHit(isArmored);
              particlesRef.current.emitHitSparks(b.x, b.y, isArmored);
              particlesRef.current.addDamageText(b.x, b.y, finalDamage, isCrit);

              // Enemy Defeated!
              if (enemy.hp <= 0) {
                enemy.state = 'dying';

                if (enemy.type === 'bomb') {
                  sound.playBombExplosion();
                  particlesRef.current.emitEnemyDefeat(enemy.x, enemy.y, false);
                  particlesRef.current.addNoticeText(enemy.x, enemy.y - 15, 'BOMB INTERCEPTED! +15', '#22c55e');
                } else if (enemy.type === 'fighter' || enemy.type === 'airship') {
                  sound.playBombExplosion();
                  particlesRef.current.emitEnemyDefeat(enemy.x, enemy.y, enemy.type === 'airship');
                } else {
                  sound.playEnemyDeath();
                  particlesRef.current.emitEnemyDefeat(enemy.x, enemy.y - enemy.height * 0.5, enemy.type === 'boss');
                }

                g.enemiesKilled += 1;

                // Coin calculation
                let coinYield = enemy.type === 'boss' ? 100 : enemy.type === 'airship' ? 35 : enemy.type === 'fighter' ? 18 : enemy.type === 'heavy' ? 12 : enemy.type === 'bomb' ? 4 : 5;
                if (equippedOutfit === 'golden_bandana') {
                  coinYield = Math.round(coinYield * 1.2);
                }

                const scoreYield = enemy.type === 'boss' ? 2500 : enemy.type === 'airship' ? 700 : enemy.type === 'fighter' ? 400 : enemy.type === 'heavy' ? 300 : enemy.type === 'bomb' ? 150 : 100;

                g.score += scoreYield;
                g.coinsEarnedThisRun += coinYield;
                storage.addCoins(coinYield);
                setCoins(storage.getCoins());
              }
              break;
            }
          }

          if (bulletHit || b.x > canvas.width + 80 || b.y < -50 || b.y > canvas.height + 50 || b.life >= b.maxLife) {
            g.bullets.splice(i, 1);
          }
        }

        // Update Enemies
        const sandbagWallX = g.maxSandbagHp > 0 && g.sandbagHp > 0 ? g.trenchX + 50 : null;
        const trenchStopX = g.trenchX + 15;
        const groundLevelY = canvas.height * 0.72;

        for (let i = g.enemies.length - 1; i >= 0; i--) {
          const enemy = g.enemies[i];

          if (enemy.isHitFlash > 0) {
            enemy.isHitFlash -= dt;
          }

          if (enemy.state === 'dying') {
            enemy.deathTimer -= dt;
            if (enemy.deathTimer <= 0) {
              g.enemies.splice(i, 1);
            }
            continue;
          }

          // Special behaviors for Air Units
          if (enemy.type === 'fighter') {
            // Raider Fighter monoplane flight & strafing run
            enemy.x -= enemy.speed * dt;
            enemy.y += Math.sin(g.totalTime * 4 + enemy.id) * 35 * dt;

            // Strafe fire when approaching trench
            if (enemy.x > g.trenchX + 40 && enemy.x < g.trenchX + 450) {
              enemy.attackCooldown -= dt;
              if (enemy.attackCooldown <= 0) {
                enemy.attackCooldown = 0.6;
                enemy.state = 'attacking';
                // Bullet tracer towards trench
                particlesRef.current.emitHitSparks(g.trenchX + 20, groundLevelY - 30, false);
                g.heroHp = Math.max(0, g.heroHp - enemy.damage * 0.4);
                sound.playEnemyHit(false);
              }
            } else {
              enemy.state = 'walking';
            }

            // Fly off screen past trench
            if (enemy.x < -80) {
              g.enemies.splice(i, 1);
              continue;
            }
          } else if (enemy.type === 'airship') {
            // War Zeppelin: glides forward and drops aerial bombs!
            enemy.x -= enemy.speed * dt;
            if (enemy.bombDropCooldown !== undefined) {
              enemy.bombDropCooldown -= dt;
              if (enemy.bombDropCooldown <= 0 && enemy.x > g.trenchX + 80) {
                enemy.bombDropCooldown = 3.2 + Math.random() * 2;
                dropAerialBomb(enemy.x - 10, enemy.y);
              }
            }

            if (enemy.x < g.trenchX - 40) {
              // Breached trench from above!
              g.heroHp = Math.max(0, g.heroHp - enemy.damage);
              sound.playBombExplosion();
              g.enemies.splice(i, 1);
              continue;
            }
          } else if (enemy.type === 'bomb') {
            // Falling Aerial Bomb
            if (enemy.vy) enemy.y += enemy.vy * dt;
            if (enemy.vx) enemy.x += enemy.vx * dt;

            // Check if bomb hit ground or trench
            if (enemy.y >= groundLevelY - 15 || enemy.x <= g.trenchX + 40) {
              sound.playBombExplosion();
              particlesRef.current.emitEnemyDefeat(enemy.x, enemy.y, false);
              g.screenShake = 0.55;

              if (sandbagWallX !== null && g.sandbagHp > 0) {
                g.sandbagHp = Math.max(0, g.sandbagHp - enemy.damage);
                particlesRef.current.emitSandbagDust(sandbagWallX, groundLevelY - 20);
              } else {
                g.heroHp = Math.max(0, g.heroHp - enemy.damage);
              }

              g.enemies.splice(i, 1);
              continue;
            }
          } else {
            // Ground units (Scouts, Infantry, Heavies, Boss)
            const targetStop = sandbagWallX !== null ? sandbagWallX : trenchStopX;

            if (enemy.x > targetStop) {
              enemy.x -= enemy.speed * dt;
            } else {
              // Attacking barricade or trench!
              enemy.attackCooldown -= dt;
              if (enemy.attackCooldown <= 0) {
                enemy.attackCooldown = 0.85;

                if (sandbagWallX !== null && g.sandbagHp > 0) {
                  g.sandbagHp = Math.max(0, g.sandbagHp - enemy.damage);
                  sound.playSandbagHit();
                  particlesRef.current.emitSandbagDust(sandbagWallX, enemy.y - 20);
                  g.screenShake = 0.2;
                } else {
                  g.heroHp = Math.max(0, g.heroHp - enemy.damage);
                  sound.playEnemyHit(false);
                  g.screenShake = 0.45;

                  if (g.heroHp <= 0) {
                    g.state = 'GAME_OVER';
                    sound.playGameOver();

                    const currentHigh = storage.getHighScore();
                    const newHigh = Math.max(currentHigh, g.score);
                    const isRecord = g.score > currentHigh;

                    saveGameData({
                      highScore: newHigh,
                      coins: storage.getCoins(),
                      highestWave: Math.max(storage.getHighestWave(), g.wave),
                    });

                    setGameOverStats({
                      wavesSurvived: g.wave - 1,
                      score: g.score,
                      highScore: newHigh,
                      isNewRecord: isRecord,
                      enemiesDefeated: g.enemiesKilled,
                      coinsEarned: g.coinsEarnedThisRun,
                    });
                    setGameState('GAME_OVER');
                    break;
                  }
                }
              }
            }
          }
        }

        // Check Wave & Boss Completion
        if (g.enemiesRemainingToSpawn <= 0 && g.enemies.length === 0 && !g.isWaveEnding) {
          g.isWaveEnding = true;
          const isBossWave = g.wave % 5 === 0;

          if (isBossWave) {
            // Big Boss Defeated! Advance to next level!
            g.waveEndTimer = 1.8;
            const levelBonusCoins = 250 + g.level * 100;
            g.coinsEarnedThisRun += levelBonusCoins;
            storage.addCoins(levelBonusCoins);
            setCoins(storage.getCoins());
            sound.playLevelVictory();

            particlesRef.current.addNoticeText(
              canvas.width * 0.5,
              canvas.height * 0.35,
              `★ BOSS DESTROYED! LEVEL ${g.level} COMPLETE! (+${levelBonusCoins} COINS) ★`,
              '#facc15'
            );
          } else {
            // Standard wave clear
            g.waveEndTimer = 1.3;
            const bonusCoins = 25 + g.wave * 10;
            g.coinsEarnedThisRun += bonusCoins;
            storage.addCoins(bonusCoins);
            setCoins(storage.getCoins());
            sound.playWaveComplete();

            particlesRef.current.addNoticeText(
              canvas.width * 0.5,
              canvas.height * 0.4,
              `VICTORY! WAVE ${g.wave} CLEARED (+${bonusCoins} COINS)`,
              '#22c55e'
            );
          }
        }

        if (g.isWaveEnding) {
          g.waveEndTimer -= dt;
          if (g.waveEndTimer <= 0) {
            g.isWaveEnding = false;
            const isBossWave = g.wave % 5 === 0;

            if (isBossWave) {
              // Open Victory Level Modal
              setLevelVictoryData({
                completedLevel: g.level,
                completedWave: g.wave,
                score: g.score,
                bonusCoins: 250 + g.level * 100,
                bossName: BOSS_NAMES[(g.level - 1) % BOSS_NAMES.length] || 'Battalion Commander Ironheart',
              });
              g.state = 'VICTORY_LEVEL';
              setGameState('VICTORY_LEVEL');
            } else {
              g.state = 'WAVE_INTERMISSION';
              setGameState('WAVE_INTERMISSION');
              setShowArmory(true);
            }
          }
        }

        // Update Particle Systems
        particlesRef.current.update(dt);

        // Throttle React HUD updates to 15fps
        g.hudThrottle += dt;
        if (g.hudThrottle >= 0.066) {
          g.hudThrottle = 0;
          setHudHp(g.heroHp);
          setHudSandbagHp(g.sandbagHp);
          setHudAmmo(g.ammo);
          setHudIsReloading(g.isReloading);
          setHudReloadProgress(g.isReloading ? g.reloadTimer / g.reloadDuration : 0);
          setHudWave(g.wave);
          setHudScore(g.score);
          setHudCoins(storage.getCoins());

          const activeBoss = g.enemies.find(e => e.type === 'boss' && e.hp > 0);
          if (activeBoss) {
            setHudBossHp(activeBoss.hp);
            setHudBossMaxHp(activeBoss.maxHp);
            setHudBossName(activeBoss.name || 'BATTALION COMMANDER');
          } else {
            setHudBossHp(null);
            setHudBossMaxHp(null);
            setHudBossName(null);
          }

          // Active target for HUD
          const curTarget = findTargetEnemy();
          if (curTarget) {
            setLockedTargetHUD({
              name: curTarget.type === 'fighter' ? 'RAIDER FIGHTER' : curTarget.type === 'airship' ? 'WAR AIRSHIP' : curTarget.type === 'bomb' ? 'INCOMING BOMB' : curTarget.name || curTarget.type.toUpperCase(),
              hp: curTarget.hp,
              maxHp: curTarget.maxHp,
              type: curTarget.type,
            });
          } else {
            setLockedTargetHUD(null);
          }
        }
      }

      // Render Active Game
      if (rendererRef.current && ctx && canvas && g.state !== 'POSTER') {
        const outfit = OUTFITS[equippedOutfit] || OUTFITS.standard;
        rendererRef.current.render({
          ctx,
          width: canvas.width,
          height: canvas.height,
          heroName,
          heroHp: g.heroHp,
          maxHp: g.maxHp,
          sandbagHp: g.sandbagHp,
          maxSandbagHp: g.maxSandbagHp,
          outfit,
          aimAngle: g.aimAngle,
          isFiring: g.isPointerDown && g.ammo > 0 && !g.isReloading,
          recoil: g.recoil,
          barrelHeat: g.barrelHeat,
          muzzleFlash: g.muzzleFlash,
          trenchX: g.trenchX,
          enemies: g.enemies,
          bullets: g.bullets,
          particles: particlesRef.current,
          time: g.totalTime,
          aimPoint: g.aimPoint,
          screenShake: g.screenShake,
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [equippedOutfit, findTargetEnemy, fireBullet, heroName, saveGameData]);

  // Canvas Mouse & Touch controls (Manual override)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (gameState !== 'PLAYING') return;
    const g = gRef.current;
    g.isPointerDown = true;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      g.aimPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      const height = rect.height;
      const muzzleOriginX = g.trenchX + 48;
      const muzzleOriginY = height * 0.72 - 53;
      g.aimAngle = Math.atan2(g.aimPoint.y - muzzleOriginY, g.aimPoint.x - muzzleOriginX);
    }
    fireBullet();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (gameState !== 'PLAYING') return;
    const g = gRef.current;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      g.aimPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      const height = rect.height;
      const muzzleOriginX = g.trenchX + 48;
      const muzzleOriginY = height * 0.72 - 53;
      g.aimAngle = Math.atan2(g.aimPoint.y - muzzleOriginY, g.aimPoint.x - muzzleOriginX);
    }
  };

  const handlePointerUp = () => {
    gRef.current.isPointerDown = false;
  };

  // Dedicated Fire Button handlers
  const handleFireButtonStart = () => {
    setIsHoldingFireButton(true);
    gRef.current.isPointerDown = true;
    fireBullet();
  };

  const handleFireButtonEnd = () => {
    setIsHoldingFireButton(false);
    gRef.current.isPointerDown = false;
  };

  // Elevation Scroll handler
  const handleChangeElevation = (val: number) => {
    setElevation(val);
    gRef.current.elevation = val;
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        triggerReload();
      } else if (e.key === 'Escape') {
        if (gameState === 'PLAYING') {
          gRef.current.state = 'PAUSED';
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          gRef.current.state = 'PLAYING';
          setGameState('PLAYING');
        }
      } else if (e.key === ' ' || e.key === 'Enter') {
        if (gameState === 'POSTER') {
          startNewGame();
        } else if (gameState === 'GAME_OVER') {
          startNewGame();
        } else if (gameState === 'PLAYING') {
          fireBullet();
        }
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        handleChangeElevation(Math.max(-1.0, gRef.current.elevation - 0.4));
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        handleChangeElevation(Math.min(1.0, gRef.current.elevation + 0.4));
      }
    };

    const handleBlur = () => {
      gRef.current.isPointerDown = false;
      setIsHoldingFireButton(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
    };
  }, [fireBullet, gameState, startNewGame, triggerReload]);

  // Upgrades & Outfits purchases
  const handleUpgrade = (key: keyof Upgrades, cost: number) => {
    if (storage.spendCoins(cost)) {
      const updated = { ...upgrades, [key]: upgrades[key] + 1 };
      saveGameData({
        coins: storage.getCoins(),
        upgrades: updated,
      });
    }
  };

  const handleUnlockOutfit = (id: OutfitId, cost: number) => {
    if (storage.spendCoins(cost)) {
      const updatedOutfits = Array.from(new Set([...unlockedOutfits, id]));
      saveGameData({
        coins: storage.getCoins(),
        unlockedOutfits: updatedOutfits,
        equippedOutfit: id,
      });
    }
  };

  const handleEquipOutfit = (id: OutfitId) => {
    saveGameData({ equippedOutfit: id });
  };

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950 text-stone-100 select-none touch-none">
      {/* 1. START SCREEN: 1940s MOVIE-POSTER TEASER LOOK */}
      {gameState === 'POSTER' && (
        <TeaserPoster
          heroName={heroName}
          onUpdateHeroName={handleUpdateHeroName}
          onStartGame={startNewGame}
          onOpenArmory={() => setShowArmory(true)}
          equippedOutfit={equippedOutfit}
          coins={coins}
          highScore={highScore}
          hasSavedData={hasSavedData}
          saveNotice={saveNotice}
          onResetSaveData={handleResetSaveData}
        />
      )}

      {/* 2. GAME CANVAS VIEWPORT */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`w-full h-full block cursor-crosshair ${
          gameState === 'POSTER' ? 'hidden' : 'block'
        }`}
      />

      {/* 3. LOW-OCCLUSION PLAYING HUD WITH FIRE BUTTON & ELEVATION SCROLL */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <GameHUD
          heroName={heroName}
          hp={hudHp}
          maxHp={hudMaxHp}
          sandbagHp={hudSandbagHp}
          maxSandbagHp={hudMaxSandbagHp}
          ammo={hudAmmo}
          maxAmmo={hudMaxAmmo}
          isReloading={hudIsReloading}
          reloadProgress={hudReloadProgress}
          wave={hudWave}
          level={currentLevel}
          score={hudScore}
          coins={hudCoins}
          bossHp={hudBossHp}
          bossMaxHp={hudBossMaxHp}
          bossName={hudBossName}
          isMuted={isMuted}
          onToggleMute={toggleSound}
          onPause={() => {
            gRef.current.state = 'PAUSED';
            setGameState('PAUSED');
          }}
          onManualReload={triggerReload}
          isHoldingFire={isHoldingFireButton}
          onFireStart={handleFireButtonStart}
          onFireEnd={handleFireButtonEnd}
          elevation={elevation}
          onChangeElevation={handleChangeElevation}
          autoLockEnabled={autoLockEnabled}
          onToggleAutoLock={() => {
            const next = !autoLockEnabled;
            setAutoLockEnabled(next);
            gRef.current.autoLock = next;
          }}
          lockedTarget={lockedTargetHUD}
        />
      )}

      {/* 4. BETWEEN-WAVES / ARMORY MODAL */}
      {showArmory && (
        <ArmoryModal
          coins={coins}
          upgrades={upgrades}
          unlockedOutfits={unlockedOutfits}
          equippedOutfit={equippedOutfit}
          nextWaveNumber={gameState === 'WAVE_INTERMISSION' ? hudWave + 1 : hudWave}
          isIntermission={gameState === 'WAVE_INTERMISSION'}
          onUpgrade={handleUpgrade}
          onUnlockOutfit={handleUnlockOutfit}
          onEquipOutfit={handleEquipOutfit}
          onStartNextWave={gameState === 'WAVE_INTERMISSION' ? startNextWave : () => setShowArmory(false)}
          onClose={() => setShowArmory(false)}
        />
      )}

      {/* 5. LEVEL VICTORY / BIG BOSS DEFEAT MODAL */}
      {gameState === 'VICTORY_LEVEL' && levelVictoryData && (
        <VictoryLevelModal
          heroName={heroName}
          completedLevel={levelVictoryData.completedLevel}
          completedWave={levelVictoryData.completedWave}
          score={levelVictoryData.score}
          bonusCoins={levelVictoryData.bonusCoins}
          totalCoins={coins}
          bossName={levelVictoryData.bossName}
          onProceedToNextLevel={handleAdvanceToNextLevel}
          onOpenArmory={() => setShowArmory(true)}
        />
      )}

      {/* 6. PAUSE MODAL */}
      {gameState === 'PAUSED' && (
        <PauseModal
          heroName={heroName}
          wave={hudWave}
          score={hudScore}
          isMuted={isMuted}
          onResume={() => {
            gRef.current.state = 'PLAYING';
            setGameState('PLAYING');
          }}
          onRestart={startNewGame}
          onHome={() => {
            gRef.current.state = 'POSTER';
            setGameState('POSTER');
          }}
          onToggleMute={toggleSound}
        />
      )}

      {/* 7. GAME OVER MODAL */}
      {gameState === 'GAME_OVER' && (
        <GameOverModal
          heroName={heroName}
          wavesSurvived={gameOverStats.wavesSurvived}
          score={gameOverStats.score}
          highScore={gameOverStats.highScore}
          isNewRecord={gameOverStats.isNewRecord}
          enemiesDefeated={gameOverStats.enemiesDefeated}
          coinsEarned={gameOverStats.coinsEarned}
          totalCoins={coins}
          onPlayAgain={startNewGame}
          onOpenArmory={() => setShowArmory(true)}
        />
      )}
    </div>
  );
}
