import { FloatingText, Particle } from '../types/game';

export class ParticleSystem {
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  private nextTextId = 1;

  public update(dt: number) {
    // 1. Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.rotation !== undefined && p.vRot !== undefined) {
        p.rotation += p.vRot * dt;
      }

      // Physics based on particle type
      if (p.type === 'casing') {
        p.vy += 700 * dt; // Gravity
        // Trench floor bounce
        if (p.y > 600) {
          p.y = 600;
          p.vy = -p.vy * 0.4;
          p.vx *= 0.6;
        }
      } else if (p.type === 'smoke' || p.type === 'dust') {
        p.vy -= 15 * dt; // Rise slowly
        p.vx *= 0.95;   // Air drag
        p.size += 8 * dt; // Expand
      } else if (p.type === 'spark') {
        p.vy += 300 * dt; // Light gravity
        p.vx *= 0.96;
      } else if (p.type === 'debris') {
        p.vy += 600 * dt;
      }

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    // 2. Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life += dt;
      ft.y -= 45 * dt; // Drift upward
      if (ft.life >= ft.maxLife) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  public emitMuzzle(x: number, y: number, angle: number) {
    // Muzzle sparks
    const count = 8;
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 0.5;
      const speed = 250 + Math.random() * 300;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle + spread) * speed,
        vy: Math.sin(angle + spread) * speed,
        size: 2.5 + Math.random() * 2.5,
        color: Math.random() > 0.3 ? '#fef08a' : '#f97316',
        type: 'spark',
        life: 0,
        maxLife: 0.12 + Math.random() * 0.08,
      });
    }

    // Barrel smoke puff
    this.particles.push({
      x,
      y,
      vx: Math.cos(angle) * 40,
      vy: Math.sin(angle) * 40 - 20,
      size: 7 + Math.random() * 5,
      color: '#a8a29e',
      type: 'smoke',
      life: 0,
      maxLife: 0.45,
    });
  }

  public emitShellCasing(x: number, y: number) {
    this.particles.push({
      x,
      y,
      vx: -70 - Math.random() * 90,
      vy: -180 - Math.random() * 80,
      size: 4,
      color: '#eab308', // Shiny brass
      type: 'casing',
      life: 0,
      maxLife: 1.4,
      rotation: Math.random() * Math.PI,
      vRot: 12 + Math.random() * 8,
    });
  }

  public emitHitSparks(x: number, y: number, isArmored: boolean) {
    const count = isArmored ? 12 : 7;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 180;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 2,
        color: isArmored ? (Math.random() > 0.5 ? '#fef08a' : '#ffffff') : '#f97316',
        type: 'spark',
        life: 0,
        maxLife: 0.2 + Math.random() * 0.15,
      });
    }

    // Dust poof
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 40,
      vy: -20 - Math.random() * 30,
      size: 8 + Math.random() * 6,
      color: '#d6d3d1',
      type: 'dust',
      life: 0,
      maxLife: 0.35,
    });
  }

  public emitEnemyDefeat(x: number, y: number, isBoss: boolean = false) {
    const smokeCount = isBoss ? 16 : 8;
    for (let i = 0; i < smokeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (isBoss ? 80 : 40) + Math.random() * (isBoss ? 160 : 80);
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        size: (isBoss ? 16 : 10) + Math.random() * 8,
        color: Math.random() > 0.4 ? '#a8a29e' : '#78716c',
        type: 'smoke',
        life: 0,
        maxLife: 0.6 + Math.random() * 0.3,
      });
    }

    // Spark shower
    const sparkCount = isBoss ? 24 : 10;
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 220;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 2,
        color: '#fbbf24',
        type: 'spark',
        life: 0,
        maxLife: 0.35 + Math.random() * 0.2,
      });
    }

    // Flying debris (helmet / weapon silhouette piece)
    const debrisCount = isBoss ? 4 : 2;
    for (let i = 0; i < debrisCount; i++) {
      this.particles.push({
        x,
        y: y - 10,
        vx: (Math.random() - 0.5) * 140,
        vy: -150 - Math.random() * 120,
        size: 5 + Math.random() * 3,
        color: '#292524',
        type: 'debris',
        life: 0,
        maxLife: 0.8,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 15,
      });
    }
  }

  public emitSandbagDust(x: number, y: number) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 15,
        y: y + (Math.random() - 0.5) * 20,
        vx: 30 + Math.random() * 60,
        vy: -20 - Math.random() * 40,
        size: 8 + Math.random() * 6,
        color: '#d6c096', // Sand color
        type: 'dust',
        life: 0,
        maxLife: 0.4,
      });
    }
  }

  public addDamageText(x: number, y: number, damage: number, isCrit: boolean = false) {
    this.floatingTexts.push({
      id: this.nextTextId++,
      x: x + (Math.random() - 0.5) * 16,
      y: y - 10,
      text: `-${damage}`,
      color: isCrit ? '#facc15' : '#ffffff',
      size: isCrit ? 18 : 14,
      life: 0,
      maxLife: 0.65,
      isCrit,
    });
  }

  public addNoticeText(x: number, y: number, text: string, color: string = '#22c55e') {
    this.floatingTexts.push({
      id: this.nextTextId++,
      x,
      y,
      text,
      color,
      size: 16,
      life: 0,
      maxLife: 0.9,
    });
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // 1. Render particles
    for (const p of this.particles) {
      const alpha = Math.max(0, 1 - p.life / p.maxLife);
      ctx.globalAlpha = alpha;

      if (p.type === 'casing') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size * 0.7, -p.size * 0.35, p.size * 1.4, p.size * 0.7);
        ctx.restore();
      } else if (p.type === 'smoke' || p.type === 'dust') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'debris') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size * 0.5, -p.size * 0.5, p.size, p.size);
        ctx.restore();
      } else {
        // sparks
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 2. Render floating damage numbers
    ctx.font = '700 14px "Oswald", sans-serif';
    ctx.textAlign = 'center';
    for (const ft of this.floatingTexts) {
      const progress = ft.life / ft.maxLife;
      const alpha = Math.max(0, 1 - progress);
      const scale = ft.isCrit ? 1.2 : 1.0;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(ft.x, ft.y);
      ctx.scale(scale, scale);

      // Dark shadow outline for readability
      ctx.fillStyle = '#000000';
      ctx.fillText(ft.text, 1, 1);
      ctx.fillText(ft.text, -1, -1);

      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, 0, 0);
      ctx.restore();
    }

    ctx.restore();
  }

  public clear() {
    this.particles = [];
    this.floatingTexts = [];
  }
}
