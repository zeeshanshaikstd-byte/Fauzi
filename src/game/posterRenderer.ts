/**
 * Teaser Poster Canvas Renderer for The Lone Battalion.
 * Renders the 1940s cinematic war film teaser poster with dynamic embers and wind.
 */

interface PosterParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxAlpha: number;
  life: number;
  maxLife: number;
  color: string;
}

export class PosterRenderer {
  private particles: PosterParticle[] = [];
  private time: number = 0;

  constructor() {
    // Seed initial drifting embers & smoke
    for (let i = 0; i < 45; i++) {
      this.particles.push({
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        vx: (Math.random() - 0.3) * 0.4,
        vy: -0.6 - Math.random() * 0.9,
        size: 1.5 + Math.random() * 3,
        alpha: Math.random() * 0.8,
        maxAlpha: 0.4 + Math.random() * 0.5,
        life: Math.random() * 4,
        maxLife: 3 + Math.random() * 3,
        color: Math.random() > 0.4 ? '#f59e0b' : '#ef4444',
      });
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    bandanaColor: string = '#DC2626'
  ) {
    this.time += 0.016;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // 1. Dusty Orange Sunset Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#1c0903');      // Deep dusky umber
    skyGrad.addColorStop(0.25, '#4a1705');   // Burnt rust
    skyGrad.addColorStop(0.5, '#9a3412');    // Rich fiery red-orange
    skyGrad.addColorStop(0.72, '#ea580c');   // Blaze orange
    skyGrad.addColorStop(0.85, '#f59e0b');   // Warm golden horizon
    skyGrad.addColorStop(1, '#291107');      // Ground trench dark silhouette
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Huge Setting Sun on Horizon
    const sunCenterX = width * 0.5;
    const sunCenterY = height * 0.68;
    const sunRadius = Math.min(width, height) * 0.28;

    // Sun outer corona glow
    const sunGlow = ctx.createRadialGradient(
      sunCenterX, sunCenterY, sunRadius * 0.2,
      sunCenterX, sunCenterY, sunRadius * 2.2
    );
    sunGlow.addColorStop(0, 'rgba(254, 240, 138, 0.5)');
    sunGlow.addColorStop(0.35, 'rgba(249, 115, 22, 0.3)');
    sunGlow.addColorStop(0.7, 'rgba(220, 38, 38, 0.12)');
    sunGlow.addColorStop(1, 'rgba(28, 9, 3, 0)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, 0, width, height);

    // Sun solid blazing disk
    const sunDisk = ctx.createRadialGradient(
      sunCenterX, sunCenterY, 0,
      sunCenterX, sunCenterY, sunRadius
    );
    sunDisk.addColorStop(0, '#fffbeb');
    sunDisk.addColorStop(0.65, '#fef08a');
    sunDisk.addColorStop(0.9, '#f97316');
    sunDisk.addColorStop(1, '#ea580c');
    ctx.beginPath();
    ctx.arc(sunCenterX, sunCenterY, sunRadius, 0, Math.PI * 2);
    ctx.fillStyle = sunDisk;
    ctx.fill();

    // 3. Atmospheric Smoke Clouds drifting from distant burning fires
    ctx.save();
    for (let i = 0; i < 4; i++) {
      const cloudX = ((i * 320 + this.time * 15) % (width + 400)) - 200;
      const cloudY = height * 0.45 + Math.sin(this.time * 0.5 + i) * 20;
      const cloudGrad = ctx.createRadialGradient(cloudX, cloudY, 20, cloudX, cloudY, 180);
      cloudGrad.addColorStop(0, 'rgba(35, 14, 6, 0.35)');
      cloudGrad.addColorStop(0.6, 'rgba(25, 10, 5, 0.18)');
      cloudGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = cloudGrad;
      ctx.beginPath();
      ctx.arc(cloudX, cloudY, 180, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 4. Distant Burning Battlefield Silhouette
    ctx.save();
    ctx.fillStyle = '#170904'; // Dark smoky silhouette
    ctx.beginPath();
    const horizonY = height * 0.72;
    ctx.moveTo(0, horizonY);

    // Uneven war-torn terrain & ruined landscape
    const segments = 24;
    for (let i = 0; i <= segments; i++) {
      const segX = (width / segments) * i;
      const bump = Math.sin(i * 1.5) * 14 + Math.cos(i * 2.8) * 9;
      ctx.lineTo(segX, horizonY + bump);
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Ruined watchtowers and charred trees in silhouette
    const trees = [0.12, 0.22, 0.36, 0.74, 0.86, 0.94];
    trees.forEach((pct, idx) => {
      const tx = width * pct;
      const ty = horizonY - 4;
      ctx.fillStyle = '#0f0502';

      // Charred pine trunk
      const treeH = 35 + (idx % 3) * 15;
      ctx.fillRect(tx - 2, ty - treeH, 4, treeH);

      // Skeletal branches
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#0f0502';
      ctx.beginPath();
      ctx.moveTo(tx, ty - treeH * 0.8);
      ctx.lineTo(tx - 12, ty - treeH * 0.9);
      ctx.moveTo(tx, ty - treeH * 0.6);
      ctx.lineTo(tx + 14, ty - treeH * 0.75);
      ctx.moveTo(tx, ty - treeH * 0.4);
      ctx.lineTo(tx - 10, ty - treeH * 0.5);
      ctx.stroke();
    });

    // Ruined fortress/chimney silhouette on left
    const fortX = width * 0.28;
    ctx.fillRect(fortX - 16, horizonY - 48, 28, 48);
    ctx.fillRect(fortX - 8, horizonY - 60, 12, 14);

    ctx.restore();

    // 5. Foreground Parapet / Trench Base (Black silhouette)
    ctx.save();
    ctx.fillStyle = '#0a0301';
    ctx.beginPath();
    const trenchY = height * 0.82;
    ctx.moveTo(0, trenchY);
    ctx.bezierCurveTo(
      width * 0.3, trenchY - 20,
      width * 0.7, trenchY - 10,
      width, trenchY - 5
    );
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Barbed wire posts along the bottom
    const postPositions = [0.08, 0.25, 0.42, 0.6, 0.78, 0.92];
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    postPositions.forEach((pos, idx) => {
      const px = width * pos;
      const py = height * 0.87 + (idx % 2) * 8;
      // Crossed wooden posts (Cheval de frise)
      ctx.beginPath();
      ctx.moveTo(px - 14, py + 30);
      ctx.lineTo(px + 12, py - 35);
      ctx.moveTo(px + 14, py + 30);
      ctx.lineTo(px - 12, py - 35);
      ctx.stroke();
    });

    // Tangled wire strands across bottom
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#050201';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.89);
    for (let x = 0; x <= width; x += 30) {
      const wy = height * 0.88 + Math.sin(x * 0.05 + this.time) * 6;
      ctx.lineTo(x, wy);
    }
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, height * 0.93);
    for (let x = 0; x <= width; x += 35) {
      const wy = height * 0.92 + Math.cos(x * 0.04) * 8;
      ctx.lineTo(x, wy);
    }
    ctx.stroke();
    ctx.restore();

    // 6. HERO SILHOUETTE (Standing proud in center seen from behind)
    ctx.save();
    const heroX = width * 0.5;
    const heroBaseY = height * 0.84;
    const heroScale = Math.min(width * 0.0018, height * 0.0015) * 1.05;

    ctx.translate(heroX, heroBaseY);
    ctx.scale(heroScale, heroScale);

    // Deep hero silhouette fill
    ctx.fillStyle = '#060201';

    // Boots & Legs
    ctx.beginPath();
    // Left leg
    ctx.moveTo(-28, 0);
    ctx.lineTo(-24, -75);
    ctx.lineTo(-6, -75);
    ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.fill();

    // Right leg
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(6, -75);
    ctx.lineTo(24, -75);
    ctx.lineTo(28, 0);
    ctx.closePath();
    ctx.fill();

    // Trench coat / field jacket lower skirts
    ctx.beginPath();
    ctx.moveTo(-36, -70);
    ctx.lineTo(-44, -25);
    ctx.lineTo(44, -25);
    ctx.lineTo(36, -70);
    ctx.closePath();
    ctx.fill();

    // Rugged Torso with broad shoulders & rolled sleeves
    ctx.beginPath();
    ctx.moveTo(-38, -75);
    ctx.lineTo(-52, -145); // Left shoulder
    ctx.lineTo(-22, -155); // Neck base
    ctx.lineTo(22, -155);  // Neck base
    ctx.lineTo(52, -145);  // Right shoulder
    ctx.lineTo(38, -75);   // Right waist
    ctx.closePath();
    ctx.fill();

    // Arms seen from behind
    // Left arm resting slightly forward holding rifle sling
    ctx.beginPath();
    ctx.moveTo(-52, -145);
    ctx.lineTo(-62, -100);
    ctx.lineTo(-54, -70);
    ctx.lineTo(-44, -70);
    ctx.lineTo(-46, -105);
    ctx.lineTo(-38, -140);
    ctx.closePath();
    ctx.fill();

    // Right arm slightly angled outward
    ctx.beginPath();
    ctx.moveTo(52, -145);
    ctx.lineTo(60, -100);
    ctx.lineTo(52, -65);
    ctx.lineTo(42, -65);
    ctx.lineTo(46, -105);
    ctx.lineTo(38, -140);
    ctx.closePath();
    ctx.fill();

    // Slung military rifle across the hero's back
    ctx.save();
    ctx.strokeStyle = '#040101';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-45, -60);
    ctx.lineTo(35, -190); // Barrel extending over right shoulder
    ctx.stroke();

    // Rifle barrel thin muzzle tip
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(35, -190);
    ctx.lineTo(42, -205);
    ctx.stroke();

    // Leather sling strap across jacket
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#180a04';
    ctx.beginPath();
    ctx.moveTo(-30, -78);
    ctx.lineTo(25, -145);
    ctx.stroke();
    ctx.restore();

    // Head seen from behind
    ctx.beginPath();
    ctx.arc(0, -172, 21, 0, Math.PI * 2);
    ctx.fill();

    // Soldier rugged hair silhouette
    ctx.beginPath();
    ctx.arc(0, -174, 22.5, Math.PI * 0.7, Math.PI * 2.3);
    ctx.fill();

    // Red Bandana wrapped around head
    ctx.fillStyle = bandanaColor;
    ctx.beginPath();
    ctx.rect(-22, -178, 44, 9);
    ctx.fill();

    // Fluttering Bandana Tails caught in the strong wind (Animated!)
    const windTime = this.time * 6.5;
    const flap1 = Math.sin(windTime) * 12 + Math.cos(windTime * 1.5) * 6;
    const flap2 = Math.sin(windTime + 1.2) * 14;

    ctx.strokeStyle = bandanaColor;
    ctx.fillStyle = bandanaColor;
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';

    // Tail 1
    ctx.beginPath();
    ctx.moveTo(18, -174);
    ctx.bezierCurveTo(
      38, -174 + flap1 * 0.4,
      55, -170 + flap1 * 0.9,
      76, -165 + flap1
    );
    ctx.stroke();

    // Tail 2
    ctx.beginPath();
    ctx.moveTo(16, -172);
    ctx.bezierCurveTo(
      34, -170 + flap2 * 0.3,
      50, -162 + flap2 * 0.8,
      68, -156 + flap2
    );
    ctx.stroke();

    // Bandana knot at back of head
    ctx.beginPath();
    ctx.arc(17, -173, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 7. Drifting Embers & Sparks Animation
    ctx.save();
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life += 0.016;

      if (p.y < 0 || p.x < 0 || p.x > width || p.life > p.maxLife) {
        // Recycle particle
        p.x = Math.random() * width;
        p.y = height * 0.8 + Math.random() * (height * 0.2);
        p.life = 0;
        p.maxLife = 3 + Math.random() * 3;
        p.alpha = 0.5 + Math.random() * 0.5;
      }

      const progress = p.life / p.maxLife;
      const currentAlpha = Math.sin(progress * Math.PI) * p.alpha;

      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, Math.min(1, currentAlpha));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 8. Cinematic Vignette Overlay
    const vignette = ctx.createRadialGradient(
      width * 0.5, height * 0.5, Math.min(width, height) * 0.35,
      width * 0.5, height * 0.5, Math.max(width, height) * 0.75
    );
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(0.7, 'rgba(0,0,0,0.3)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.78)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }
}
