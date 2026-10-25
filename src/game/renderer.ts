import { Bullet, Enemy, Outfit } from '../types/game';
import { ParticleSystem } from './particles';

interface RenderOptions {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  heroName: string;
  heroHp: number;
  maxHp: number;
  sandbagHp: number;
  maxSandbagHp: number;
  outfit: Outfit;
  aimAngle: number;
  isFiring: boolean;
  recoil: number;
  barrelHeat: number;
  muzzleFlash: number;
  trenchX: number;
  enemies: Enemy[];
  bullets: Bullet[];
  particles: ParticleSystem;
  time: number;
  aimPoint: { x: number; y: number } | null;
  screenShake: number;
}

export class GameRenderer {
  public render(opts: RenderOptions) {
    const { ctx, width, height, screenShake } = opts;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Apply Screen Shake if active
    if (screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * screenShake * 10;
      const shakeY = (Math.random() - 0.5) * screenShake * 10;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Draw Dusty Orange-Brown Battlefield Sky
    this.drawSky(ctx, width, height, opts.time);

    // 2. Draw Distant Battlefield Silhouettes & Sun
    this.drawDistantBattlefield(ctx, width, height, opts.time);

    // 3. Draw Ground & Shell-Pocked Battlefield
    this.drawBattlefieldGround(ctx, width, height, opts.trenchX);

    // 4. Draw Sandbag Barricade (if active)
    if (opts.maxSandbagHp > 0) {
      this.drawSandbagBastion(ctx, opts.trenchX, height, opts.sandbagHp, opts.maxSandbagHp);
    }

    // 5. Draw Enemies
    this.drawEnemies(ctx, opts.enemies, height, opts.time);

    // 6. Draw Bullets & Tracers
    this.drawBullets(ctx, opts.bullets);

    // 7. Draw Trench & Hero with Mounted Machine Gun
    this.drawTrenchAndHero(opts);

    // 8. Render Particles & Floating Damage Texts
    opts.particles.render(ctx);

    // 9. Draw Crosshair / Aim Reticle
    if (opts.aimPoint) {
      this.drawCrosshair(ctx, opts.aimPoint.x, opts.aimPoint.y, opts.isFiring);
    }

    // 10. Atmospheric Trench Lighting & Vignette
    this.drawAtmosphere(ctx, width, height);

    ctx.restore();
  }

  private drawSky(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#261208');     // Dusk umber
    grad.addColorStop(0.3, '#5c220a');    // Scorched rust
    grad.addColorStop(0.65, '#b45309');   // Dusty amber
    grad.addColorStop(0.85, '#d97706');   // Horizon haze
    grad.addColorStop(1, '#3b1d11');      // Ground merge
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Drifting battlefield smoke sheets in the sky
    ctx.save();
    ctx.fillStyle = 'rgba(45, 20, 10, 0.15)';
    for (let i = 0; i < 3; i++) {
      const sx = ((i * 450 + time * 18) % (width + 500)) - 250;
      const sy = height * 0.35 + Math.sin(time * 0.6 + i) * 15;
      ctx.beginPath();
      ctx.ellipse(sx, sy, 220, 60, -0.05, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawDistantBattlefield(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
    const horizonY = height * 0.68;

    // Huge glowing setting sun in background
    const sunX = width * 0.72;
    const sunY = horizonY - 10;
    const sunR = Math.min(width, height) * 0.22;

    const sunGlow = ctx.createRadialGradient(sunX, sunY, sunR * 0.3, sunX, sunY, sunR * 1.8);
    sunGlow.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
    sunGlow.addColorStop(0.5, 'rgba(249, 115, 22, 0.22)');
    sunGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fillStyle = '#fde047';
    ctx.fill();
    ctx.restore();

    // Distant mountain ridge and burning artillery smoke
    ctx.save();
    ctx.fillStyle = '#241007';
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    for (let x = 0; x <= width; x += 30) {
      const y = horizonY - 18 + Math.sin(x * 0.015) * 12 + Math.cos(x * 0.04) * 6;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Charred skeletal pine trees along horizon
    ctx.fillStyle = '#170803';
    const treeX = [0.18, 0.38, 0.52, 0.64, 0.88];
    treeX.forEach((pct) => {
      const tx = width * pct;
      const ty = horizonY - 14;
      ctx.fillRect(tx - 1.5, ty - 32, 3, 32);
      ctx.beginPath();
      ctx.moveTo(tx, ty - 26);
      ctx.lineTo(tx - 9, ty - 30);
      ctx.moveTo(tx, ty - 18);
      ctx.lineTo(tx + 10, ty - 24);
      ctx.strokeStyle = '#170803';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Faint smoke plumes rising from burning tanks/craters
    for (let i = 0; i < 2; i++) {
      const plumeX = width * (0.35 + i * 0.45);
      const plumeGrad = ctx.createLinearGradient(plumeX, horizonY, plumeX + 25, horizonY - 90);
      plumeGrad.addColorStop(0, 'rgba(30, 15, 8, 0.6)');
      plumeGrad.addColorStop(1, 'rgba(30, 15, 8, 0)');
      ctx.fillStyle = plumeGrad;
      ctx.beginPath();
      ctx.moveTo(plumeX - 8, horizonY);
      ctx.quadraticCurveTo(plumeX + Math.sin(time + i) * 12, horizonY - 50, plumeX + 24, horizonY - 90);
      ctx.lineTo(plumeX + 38, horizonY - 90);
      ctx.quadraticCurveTo(plumeX + 16, horizonY - 50, plumeX + 8, horizonY);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  private drawBattlefieldGround(ctx: CanvasRenderingContext2D, width: number, height: number, trenchX: number) {
    const groundY = height * 0.72;

    // No Man's Land dirt ground with shell craters and mud layers
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
    groundGrad.addColorStop(0, '#3f2113');  // Dry dark mud
    groundGrad.addColorStop(0.4, '#2e170c');
    groundGrad.addColorStop(1, '#1b0b05');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, width, height - groundY);

    // Craters and rough textured ground lines
    ctx.save();
    ctx.fillStyle = '#220d05';
    // Crater 1
    ctx.beginPath();
    ctx.ellipse(width * 0.45, groundY + 45, 42, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Crater 2
    ctx.beginPath();
    ctx.ellipse(width * 0.75, groundY + 30, 55, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tangled barbed wire fences across middle ground
    ctx.strokeStyle = '#120502';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(trenchX + 40, groundY + 20);
    for (let x = trenchX + 40; x <= width; x += 25) {
      const wy = groundY + 18 + Math.sin(x * 0.08) * 4;
      ctx.lineTo(x, wy);
    }
    ctx.stroke();

    // Barbed wire posts
    for (let x = trenchX + 80; x < width; x += 110) {
      ctx.fillStyle = '#0f0402';
      ctx.fillRect(x - 2, groundY + 8, 4, 22);
    }

    ctx.restore();
  }

  private drawSandbagBastion(
    ctx: CanvasRenderingContext2D,
    trenchX: number,
    height: number,
    hp: number,
    maxHp: number
  ) {
    const wallX = trenchX + 50;
    const groundY = height * 0.73;
    const wallY = groundY - 45;
    const hpRatio = Math.max(0, hp / maxHp);

    ctx.save();

    // Sandbags stack
    const bagW = 34;
    const bagH = 16;
    const rows = 4;

    for (let r = 0; r < rows; r++) {
      const cols = r % 2 === 0 ? 2 : 3;
      const offsetY = wallY + (rows - 1 - r) * (bagH - 3);

      for (let c = 0; c < cols; c++) {
        const offsetX = wallX + c * (bagW - 4) - (r % 2 === 0 ? 0 : bagW * 0.5);

        // Damaged look when HP drops
        const isDamaged = hpRatio < 0.4 && (r + c) % 2 === 0;
        ctx.fillStyle = isDamaged ? '#8a7758' : '#bda376';
        ctx.strokeStyle = '#5a462b';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.roundRect(offsetX, offsetY, bagW, bagH, 6);
        ctx.fill();
        ctx.stroke();

        // Stitching line across middle of sandbag
        ctx.strokeStyle = '#6e5839';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(offsetX + 4, offsetY + bagH * 0.5);
        ctx.lineTo(offsetX + bagW - 4, offsetY + bagH * 0.5);
        ctx.stroke();
      }
    }

    // Sandbag Wall Health Bar
    const barW = 60;
    const barH = 5;
    const barX = wallX + 5;
    const barY = wallY - 14;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

    ctx.fillStyle = hpRatio > 0.5 ? '#10b981' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444';
    ctx.fillRect(barX, barY, barW * hpRatio, barH);

    ctx.font = '600 9px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#fde68a';
    ctx.textAlign = 'center';
    ctx.fillText(`SANDBAGS ${Math.ceil(hp)}`, barX + barW * 0.5, barY - 3);

    ctx.restore();
  }

  private drawEnemies(ctx: CanvasRenderingContext2D, enemies: Enemy[], height: number, time: number) {
    const groundY = height * 0.72;

    for (const e of enemies) {
      if (e.hp <= 0 && e.deathTimer <= 0) continue;

      ctx.save();
      const isAirUnit = e.type === 'fighter' || e.type === 'airship' || e.type === 'bomb';
      const enemyY = isAirUnit ? e.y : groundY + (e.y - groundY * 0.85) * 0.25;
      ctx.translate(e.x, enemyY);

      // Hit Flash (white-red flash when struck)
      if (e.isHitFlash > 0) {
        ctx.filter = 'brightness(2.2) contrast(1.5)';
      }

      // Dying animation
      if (e.state === 'dying') {
        const fallProgress = 1 - e.deathTimer / 0.6;
        ctx.globalAlpha = Math.max(0, 1 - fallProgress);
        ctx.translate(0, fallProgress * (isAirUnit ? 40 : 15));
        ctx.rotate(fallProgress * (e.type === 'fighter' ? 1.2 : 0.4));
      }

      if (e.type === 'boss') {
        this.drawBossEnemy(ctx, e, time);
      } else if (e.type === 'fighter') {
        this.drawFighterPlane(ctx, e, time);
      } else if (e.type === 'airship') {
        this.drawWarAirship(ctx, e, time);
      } else if (e.type === 'bomb') {
        this.drawAerialBomb(ctx, e, time);
      } else if (e.type === 'heavy') {
        this.drawHeavyEnemy(ctx, e, time);
      } else if (e.type === 'scout') {
        this.drawScoutEnemy(ctx, e, time);
      } else {
        this.drawInfantryEnemy(ctx, e, time);
      }

      // Draw floating health bar over enemy head (except small falling bombs)
      if (e.state !== 'dying' && e.type !== 'bomb') {
        const hpPercent = Math.max(0, e.hp / e.maxHp);
        const barWidth = e.type === 'boss' ? 84 : e.type === 'airship' ? 68 : e.type === 'fighter' ? 44 : 34;
        const barHeight = e.type === 'boss' ? 7 : 4;
        const barY = -e.height * 0.5 - 12;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(-barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2);

        ctx.fillStyle = e.type === 'boss' ? '#dc2626' : e.type === 'airship' ? '#f59e0b' : e.type === 'fighter' ? '#38bdf8' : hpPercent > 0.4 ? '#ef4444' : '#b91c1c';
        ctx.fillRect(-barWidth / 2, barY, barWidth * hpPercent, barHeight);

        if (e.type === 'boss') {
          ctx.font = '700 9px "Oswald", sans-serif';
          ctx.fillStyle = '#fef08a';
          ctx.textAlign = 'center';
          ctx.fillText(e.name || 'DREADNOUGHT TITAN', 0, barY - 3);
        } else if (e.type === 'airship') {
          ctx.font = '700 8px "Oswald", sans-serif';
          ctx.fillStyle = '#fde68a';
          ctx.textAlign = 'center';
          ctx.fillText('WAR AIRSHIP', 0, barY - 2);
        } else if (e.type === 'fighter') {
          ctx.font = '700 8px "Oswald", sans-serif';
          ctx.fillStyle = '#bae6fd';
          ctx.textAlign = 'center';
          ctx.fillText('RAIDER FIGHTER', 0, barY - 2);
        }
      }

      ctx.restore();
    }
  }

  private drawFighterPlane(ctx: CanvasRenderingContext2D, e: Enemy, time: number) {
    ctx.save();
    // Rotate with dive angle
    const diveAngle = e.diveAngle || 0;
    ctx.rotate(diveAngle);

    // Propeller blur disk at nose
    const propPhase = (time * 60) % (Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(-30, 0, 3, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Propeller blades spinning
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-30, Math.sin(propPhase) * 12);
    ctx.lineTo(-30, -Math.sin(propPhase) * 12);
    ctx.stroke();

    // Fuselage (Streamlined warplane body)
    ctx.fillStyle = '#334155'; // Battleship gray
    ctx.beginPath();
    ctx.moveTo(-30, 0); // Nose tip
    ctx.quadraticCurveTo(-15, -7, 10, -5);
    ctx.lineTo(26, -2); // Tail base
    ctx.lineTo(30, -10); // Tail fin top
    ctx.lineTo(33, -9);
    ctx.lineTo(28, 2);
    ctx.quadraticCurveTo(0, 7, -30, 0);
    ctx.closePath();
    ctx.fill();

    // Yellow engine cowling nose ring
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.quadraticCurveTo(-26, -5, -20, -5);
    ctx.lineTo(-20, 5);
    ctx.quadraticCurveTo(-26, 5, -30, 0);
    ctx.closePath();
    ctx.fill();

    // Cockpit glass canopy
    ctx.fillStyle = '#7dd3fc';
    ctx.beginPath();
    ctx.roundRect(-8, -8, 14, 5, 2);
    ctx.fill();

    // Main monoplane wing (side profile view)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(-12, 1);
    ctx.lineTo(8, 1);
    ctx.lineTo(2, 12);
    ctx.lineTo(-8, 12);
    ctx.closePath();
    ctx.fill();

    // Wingtip machine gun flash when attacking
    if (e.state === 'attacking') {
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(-24, 6, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Engine exhaust smoke when damaged
    if (e.hp < e.maxHp * 0.5) {
      ctx.fillStyle = 'rgba(68, 64, 60, 0.7)';
      ctx.beginPath();
      ctx.arc(20 + Math.random() * 8, Math.sin(time * 10) * 3, 5 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawWarAirship(ctx: CanvasRenderingContext2D, e: Enemy, time: number) {
    ctx.save();
    const bobY = Math.sin(time * 2 + e.id) * 3;
    ctx.translate(0, bobY);

    // Colossal Zeppelin / Airship Hull
    const hullW = 86;
    const hullH = 34;

    // Dark metallic envelope gradient
    const hullGrad = ctx.createLinearGradient(0, -hullH * 0.5, 0, hullH * 0.5);
    hullGrad.addColorStop(0, '#475569');
    hullGrad.addColorStop(0.5, '#334155');
    hullGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = hullGrad;

    ctx.beginPath();
    ctx.ellipse(0, 0, hullW * 0.5, hullH * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Iron hull panel seams & rivets
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.lineWidth = 1;
    for (let x = -hullW * 0.4; x <= hullW * 0.4; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, -Math.sqrt(Math.max(0, 1 - (x * 2 / hullW) ** 2)) * (hullH * 0.5));
      ctx.lineTo(x, Math.sqrt(Math.max(0, 1 - (x * 2 / hullW) ** 2)) * (hullH * 0.5));
      ctx.stroke();
    }

    // Military cross / iron insignia on flank
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-5, -6, 10, 12);
    ctx.fillRect(-9, -2, 18, 4);

    // Gondola / Command bridge hanging beneath hull
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(-18, hullH * 0.45, 36, 10);
    // Glowing bridge windows
    ctx.fillStyle = '#fef08a';
    for (let w = -14; w <= 10; w += 6) {
      ctx.fillRect(w, hullH * 0.45 + 3, 3.5, 3);
    }

    // Tail stabilizing fins (Rudders)
    ctx.fillStyle = '#1e293b';
    // Top fin
    ctx.beginPath();
    ctx.moveTo(hullW * 0.35, -hullH * 0.4);
    ctx.lineTo(hullW * 0.52, -hullH * 0.85);
    ctx.lineTo(hullW * 0.48, 0);
    ctx.closePath();
    ctx.fill();

    // Bottom fin
    ctx.beginPath();
    ctx.moveTo(hullW * 0.35, hullH * 0.4);
    ctx.lineTo(hullW * 0.52, hullH * 0.85);
    ctx.lineTo(hullW * 0.48, 0);
    ctx.closePath();
    ctx.fill();

    // Twin propulsion engines with spinning props
    const propY1 = -8;
    const propY2 = 8;
    [-18, 12].forEach((px) => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px, propY1 - 2, 7, 4);
      ctx.fillRect(px, propY2 - 2, 7, 4);

      // Spinning blur
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px + 7, propY1 - 5);
      ctx.lineTo(px + 7, propY1 + 5);
      ctx.moveTo(px + 7, propY2 - 5);
      ctx.lineTo(px + 7, propY2 + 5);
      ctx.stroke();
    });

    // Searchlight beam pointing downwards into battlefield
    ctx.save();
    const beamGrad = ctx.createLinearGradient(0, hullH * 0.5, -40, hullH * 0.5 + 160);
    beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
    beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(-5, hullH * 0.5 + 8);
    ctx.lineTo(5, hullH * 0.5 + 8);
    ctx.lineTo(-20 + Math.sin(time * 3) * 20, hullH * 0.5 + 170);
    ctx.lineTo(-60 + Math.sin(time * 3) * 20, hullH * 0.5 + 170);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  private drawAerialBomb(ctx: CanvasRenderingContext2D, e: Enemy, time: number) {
    ctx.save();
    // Heavy falling bomb
    ctx.fillStyle = '#1c1917'; // Cast iron
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Red warning nose tip
    const blink = Math.sin(time * 20) > 0;
    ctx.fillStyle = blink ? '#ef4444' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(0, 11, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Tail stabilizing fins
    ctx.fillStyle = '#292524';
    ctx.beginPath();
    ctx.moveTo(-6, -11);
    ctx.lineTo(-10, -18);
    ctx.lineTo(10, -18);
    ctx.lineTo(6, -11);
    ctx.closePath();
    ctx.fill();

    // Whistling wind streak trail
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(0, -32);
    ctx.stroke();

    ctx.restore();
  }

  private drawScoutEnemy(ctx: CanvasRenderingContext2D, e: Enemy, time: number) {
    const legPhase = Math.sin(time * 16 + e.id) * 0.6;

    ctx.fillStyle = '#0f172a'; // Shadow
    ctx.beginPath();
    ctx.ellipse(0, 2, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fast Runner legs
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    // Back leg
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(Math.sin(-legPhase) * 12, 0);
    ctx.stroke();
    // Front leg
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(Math.sin(legPhase) * 12, 0);
    ctx.stroke();

    // Crouched torso
    ctx.fillStyle = '#64748b'; // Gray-blue light jacket
    ctx.beginPath();
    ctx.roundRect(-7, -35, 14, 18, 3);
    ctx.fill();

    // Head with field cap
    ctx.fillStyle = '#fbcfe8'; // Skin tone
    ctx.beginPath();
    ctx.arc(-2, -40, 6, 0, Math.PI * 2);
    ctx.fill();

    // Field cap with visor pointing left
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(-2, -43, 7, Math.PI, Math.PI * 2);
    ctx.lineTo(-10, -42);
    ctx.closePath();
    ctx.fill();

    // Running forward carbine
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(4, -28);
    ctx.lineTo(-16, -26);
    ctx.stroke();
  }

  private drawInfantryEnemy(ctx: CanvasRenderingContext2D, e: Enemy, time: number) {
    const legPhase = Math.sin(time * 9 + e.id) * 0.5;

    // Shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Marching legs
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(Math.sin(-legPhase) * 10, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(Math.sin(legPhase) * 10, 0);
    ctx.stroke();

    // Trench coat
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.roundRect(-8, -42, 16, 24, 3);
    ctx.fill();

    // Head
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.arc(-2, -48, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // Steel helmet (Stahlhelm silhouette)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(-2, -51, 8.5, Math.PI, Math.PI * 2);
    ctx.lineTo(-10, -49);
    ctx.lineTo(7, -49);
    ctx.closePath();
    ctx.fill();

    // Rifle with bayonet pointing toward trench
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(6, -34);
    ctx.lineTo(-18, -32);
    ctx.stroke();

    // Bayonet tip
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-18, -32);
    ctx.lineTo(-24, -32);
    ctx.stroke();
  }

  private drawHeavyEnemy(ctx: CanvasRenderingContext2D, e: Enemy, time: number) {
    const legPhase = Math.sin(time * 6 + e.id) * 0.35;

    // Heavy ground shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.beginPath();
    ctx.ellipse(0, 3, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stomping legs
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-4, -22);
    ctx.lineTo(-4 + Math.sin(-legPhase) * 9, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(4, -22);
    ctx.lineTo(4 + Math.sin(legPhase) * 9, 0);
    ctx.stroke();

    // Bulk body
    ctx.fillStyle = '#334155';
    ctx.fillRect(-12, -48, 24, 28);

    // Heavy steel chest armor plate
    ctx.fillStyle = '#64748b';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-11, -47, 22, 22);

    // Reinforced helmet
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -56, 10, Math.PI, Math.PI * 2);
    ctx.lineTo(-11, -53);
    ctx.lineTo(11, -53);
    ctx.closePath();
    ctx.fill();

    // Front Riot Shield (facing left)
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-18, -52, 10, 42, 3);
    ctx.fill();
    ctx.stroke();

    // Shield vision slit
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-16, -42, 6, 2.5);
  }

  private drawBossEnemy(ctx: CanvasRenderingContext2D, e: Enemy, time: number) {
    const stepBob = Math.abs(Math.sin(time * 5)) * 4;

    // Boss massive shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 34, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Armored legs
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-8, -28);
    ctx.lineTo(-12, 0);
    ctx.moveTo(8, -28);
    ctx.lineTo(12, 0);
    ctx.stroke();

    // Massive chestplate & heavy officer mantle
    ctx.fillStyle = '#1e1b4b'; // Midnight officer tunic
    ctx.fillRect(-18, -65 - stepBob, 36, 38);

    // Gilded armor trim & shoulder pauldrons
    ctx.fillStyle = '#b45309'; // Bronze pauldrons
    ctx.beginPath();
    ctx.arc(-20, -62 - stepBob, 10, 0, Math.PI * 2);
    ctx.arc(20, -62 - stepBob, 10, 0, Math.PI * 2);
    ctx.fill();

    // Iron faceplate / officer visor
    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.arc(0, -78 - stepBob, 13, 0, Math.PI * 2);
    ctx.fill();

    // Glowing red slit eyes
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-6, -79 - stepBob, 4, 2.5);
    ctx.fillRect(2, -79 - stepBob, 4, 2.5);

    // Commander Officer Peak Cap with gold insignia
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -84 - stepBob, 14, Math.PI, Math.PI * 2);
    ctx.lineTo(-16, -82 - stepBob);
    ctx.lineTo(16, -82 - stepBob);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, -88 - stepBob, 3, 0, Math.PI * 2);
    ctx.fill();

    // Heavy autocannon / sabre in hands
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-10, -50 - stepBob);
    ctx.lineTo(-35, -45 - stepBob);
    ctx.stroke();
  }

  private drawBullets(ctx: CanvasRenderingContext2D, bullets: Bullet[]) {
    ctx.save();
    for (const b of bullets) {
      // Bullet tracer laser streak
      const grad = ctx.createLinearGradient(b.x - b.vx * 0.04, b.y - b.vy * 0.04, b.x, b.y);
      grad.addColorStop(0, 'rgba(234, 88, 12, 0)');
      grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.7)');
      grad.addColorStop(1, '#ffffff');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(b.x - b.vx * 0.035, b.y - b.vy * 0.035);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      // Bright bullet head
      ctx.fillStyle = '#fffbeb';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawTrenchAndHero(opts: RenderOptions) {
    const { ctx, height, trenchX, heroHp, maxHp, outfit, aimAngle, recoil, muzzleFlash } = opts;
    const groundY = height * 0.72;
    const trenchY = groundY - 5;

    ctx.save();

    // 1. Trench Wooden Revetment & Duckboards (Left side)
    const revetmentGrad = ctx.createLinearGradient(0, trenchY - 30, trenchX + 30, trenchY + 80);
    revetmentGrad.addColorStop(0, '#2d1a0f');
    revetmentGrad.addColorStop(1, '#140a04');
    ctx.fillStyle = revetmentGrad;

    ctx.beginPath();
    ctx.moveTo(0, trenchY - 20);
    ctx.lineTo(trenchX + 15, trenchY - 15);
    ctx.lineTo(trenchX + 25, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Wooden timber planks holding the trench wall
    ctx.strokeStyle = '#1a0d07';
    ctx.lineWidth = 3;
    for (let py = trenchY - 10; py < height; py += 18) {
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(trenchX + 20, py);
      ctx.stroke();
    }

    // Trench parapet sandbags directly in front of the gun
    ctx.fillStyle = '#a88a58';
    ctx.strokeStyle = '#5a462b';
    ctx.lineWidth = 2;
    // Layer 1
    ctx.beginPath();
    ctx.roundRect(trenchX - 25, trenchY - 28, 48, 16, 5);
    ctx.fill();
    ctx.stroke();
    // Layer 2
    ctx.beginPath();
    ctx.roundRect(trenchX - 10, trenchY - 42, 42, 16, 5);
    ctx.fill();
    ctx.stroke();

    // Ammo crate sitting beside hero
    ctx.fillStyle = '#3f4728'; // Green army crate
    ctx.fillRect(trenchX - 65, trenchY + 15, 32, 22);
    ctx.strokeStyle = '#222814';
    ctx.lineWidth = 2;
    ctx.strokeRect(trenchX - 65, trenchY + 15, 32, 22);
    // Brass ammo belt spilling out onto trench
    ctx.fillStyle = '#eab308';
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(trenchX - 58 + i * 5, trenchY + 10 - i * 2, 3, 7);
    }

    // 2. HERO CHARACTER (1940s rugged soldier in side view)
    const heroX = trenchX - 42 - recoil * 8; // Recoils backward on firing!
    const heroY = trenchY - 10;
    const hpRatio = heroHp / maxHp;

    ctx.save();
    ctx.translate(heroX, heroY);

    // Torso / Jacket (outfit jacket color)
    ctx.fillStyle = outfit.colors.jacket;
    ctx.beginPath();
    ctx.roundRect(-12, -50, 24, 38, 4);
    ctx.fill();

    // Folded collar
    ctx.fillStyle = outfit.colors.jacketHighlight;
    ctx.beginPath();
    ctx.moveTo(-10, -50);
    ctx.lineTo(-4, -40);
    ctx.lineTo(4, -50);
    ctx.closePath();
    ctx.fill();

    // Worn Leather Bandolier across chest with brass bullet cartridges
    ctx.strokeStyle = outfit.colors.bandolier;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-12, -48);
    ctx.lineTo(10, -18);
    ctx.stroke();

    // Brass cartridges on bandolier
    ctx.fillStyle = '#fbbf24';
    for (let b = 0; b < 4; b++) {
      const bx = -9 + b * 5;
      const by = -44 + b * 8;
      ctx.fillRect(bx, by, 3, 5);
    }

    // Hero Head (Side profile)
    ctx.fillStyle = '#e2a782'; // Rugged tanned skin
    ctx.beginPath();
    ctx.roundRect(-4, -68, 18, 20, 4);
    ctx.fill();

    // Short rugged beard / 5 o'clock shadow
    ctx.fillStyle = '#3a2618';
    ctx.beginPath();
    ctx.moveTo(2, -56);
    ctx.lineTo(14, -56);
    ctx.lineTo(12, -48);
    ctx.lineTo(0, -48);
    ctx.closePath();
    ctx.fill();

    // Determined eye & brow
    ctx.fillStyle = '#1c1917';
    // Brow line
    ctx.fillRect(5, -64, 7, 2);
    // Eye pupil
    ctx.fillRect(7, -61, 3, 2.5);

    // Battle scratches on face when health drops
    if (hpRatio < 0.6) {
      // Dust & dirt smudge
      ctx.fillStyle = 'rgba(68, 43, 27, 0.6)';
      ctx.beginPath();
      ctx.arc(3, -58, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    if (hpRatio < 0.3) {
      // Red battle scratch
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(6, -65);
      ctx.lineTo(12, -59);
      ctx.stroke();
    }

    // Red Bandana around forehead
    ctx.fillStyle = outfit.colors.bandana;
    ctx.beginPath();
    ctx.rect(-6, -70, 22, 6);
    ctx.fill();

    // Bandana Fluttering Wind Tails behind head (animated sine wave)
    const flutter = Math.sin(opts.time * 12) * 5 + Math.cos(opts.time * 6) * 3;
    ctx.strokeStyle = outfit.colors.bandana;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, -67);
    ctx.quadraticCurveTo(-18, -67 + flutter * 0.5, -28, -65 + flutter);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-5, -65);
    ctx.quadraticCurveTo(-16, -63 + flutter * 0.8, -25, -60 + flutter * 1.2);
    ctx.stroke();

    // Hero Arms with rolled sleeves gripping machine gun handles
    ctx.fillStyle = outfit.colors.jacket;
    // Upper arm
    ctx.beginPath();
    ctx.roundRect(0, -42, 16, 8, 3);
    ctx.fill();

    // Bare forearm (rolled sleeve look)
    ctx.fillStyle = '#e2a782';
    ctx.beginPath();
    ctx.roundRect(14, -42, 16, 7, 3);
    ctx.fill();

    ctx.restore();

    // 3. MOUNTED MACHINE GUN (Water-cooled barrel, tripod mount, ammo receiver)
    const gunPivotX = trenchX - 10 - recoil * 6;
    const gunPivotY = trenchY - 48;

    ctx.save();
    ctx.translate(gunPivotX, gunPivotY);

    // Tripod mount legs
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-18, 32);
    ctx.moveTo(0, 0);
    ctx.lineTo(16, 30);
    ctx.stroke();

    // Rotate gun assembly toward aimAngle
    ctx.rotate(aimAngle);

    // Gun receiver box
    ctx.fillStyle = '#27272a';
    ctx.fillRect(-15, -8, 26, 15);

    // Heavy water-jacketed cooling barrel cylinder
    ctx.fillStyle = '#3f3f46';
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1.5;
    ctx.fillRect(11, -7, 44, 13);
    ctx.strokeRect(11, -7, 44, 13);

    // Barrel cooling ribs
    for (let rx = 16; rx < 50; rx += 7) {
      ctx.fillStyle = '#18181b';
      ctx.fillRect(rx, -7, 2, 13);
    }

    // Muzzle flash suppressor tip
    ctx.fillStyle = '#18181b';
    ctx.fillRect(55, -5, 8, 9);
    ctx.fillRect(63, -7, 5, 13); // Flared flash hider

    // Drum / spade grips at rear
    ctx.fillStyle = '#18181b';
    ctx.fillRect(-22, -12, 8, 22);

    // Barrel heat glow when hot
    if (opts.barrelHeat > 0.1) {
      ctx.fillStyle = `rgba(239, 68, 68, ${opts.barrelHeat * 0.45})`;
      ctx.fillRect(11, -7, 44, 13);
    }

    // Muzzle Flash Starburst & Light Cast
    if (muzzleFlash > 0) {
      const flashX = 72;
      const flashY = 0;

      // Outer radial light cast
      const flashGlow = ctx.createRadialGradient(flashX, flashY, 4, flashX, flashY, 90);
      flashGlow.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
      flashGlow.addColorStop(0.3, 'rgba(249, 115, 22, 0.6)');
      flashGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = flashGlow;
      ctx.beginPath();
      ctx.arc(flashX, flashY, 90, 0, Math.PI * 2);
      ctx.fill();

      // Multi-point sharp starburst
      ctx.fillStyle = '#fffbeb';
      ctx.beginPath();
      ctx.moveTo(flashX + 38, flashY);
      ctx.lineTo(flashX + 12, flashY + 9);
      ctx.lineTo(flashX + 18, flashY + 24);
      ctx.lineTo(flashX + 6, flashY + 12);
      ctx.lineTo(flashX, flashY + 28);
      ctx.lineTo(flashX - 4, flashY + 10);
      ctx.lineTo(flashX - 18, flashY + 18);
      ctx.lineTo(flashX - 8, flashY + 5);
      ctx.lineTo(flashX - 22, flashY);
      ctx.lineTo(flashX - 8, flashY - 5);
      ctx.lineTo(flashX - 18, flashY - 18);
      ctx.lineTo(flashX - 4, flashY - 10);
      ctx.lineTo(flashX, flashY - 28);
      ctx.lineTo(flashX + 6, flashY - 12);
      ctx.lineTo(flashX + 18, flashY - 24);
      ctx.lineTo(flashX + 12, flashY - 9);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
    ctx.restore();
  }

  private drawCrosshair(ctx: CanvasRenderingContext2D, x: number, y: number, isFiring: boolean) {
    ctx.save();
    const size = isFiring ? 18 : 14;
    ctx.strokeStyle = isFiring ? '#f59e0b' : 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.5;

    // Outer circle
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshair ticks
    ctx.beginPath();
    ctx.moveTo(x - size - 5, y);
    ctx.lineTo(x - 4, y);
    ctx.moveTo(x + 4, y);
    ctx.lineTo(x + size + 5, y);
    ctx.moveTo(x, y - size - 5);
    ctx.lineTo(x, y - 4);
    ctx.moveTo(x, y + 4);
    ctx.lineTo(x, y + size + 5);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = isFiring ? '#ef4444' : '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawAtmosphere(ctx: CanvasRenderingContext2D, width: number, height: number) {
    // Subtle cinematic vignette & dust warm tone
    const vignette = ctx.createRadialGradient(
      width * 0.5, height * 0.5, Math.min(width, height) * 0.45,
      width * 0.5, height * 0.5, Math.max(width, height) * 0.85
    );
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(0.7, 'rgba(15, 6, 2, 0.22)');
    vignette.addColorStop(1, 'rgba(10, 3, 1, 0.7)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }
}
