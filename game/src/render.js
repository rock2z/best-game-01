// All drawing. The world shakes; the words do not, so the HUD stays sharp.
import { TUNE } from './tune.js';
import { formatScore } from './world.js';

const SANS = '"Inter", "Liberation Sans", "Noto Sans", sans-serif';
const SERIF = '"Liberation Serif", "DejaVu Serif", Georgia, serif';

export function drawFrame(ctx, world) {
  const shake = world.shake;
  const sx = Math.sin(world.time * 48) * shake;
  const sy = Math.cos(world.time * 41) * shake;
  drawBackdrop(ctx, world);
  ctx.save();
  ctx.translate(sx, sy);
  drawMandala(ctx, world);
  if (world.mode === 'title') drawOrnaments(ctx, world);
  drawTrail(ctx, world);
  drawSeals(ctx, world);
  drawEnemies(ctx, world);
  drawParticles(ctx, world);
  drawShots(ctx, world);
  drawShip(ctx, world);
  if (world.mode === 'play' || world.mode === 'title') drawFloaters(ctx, world);
  ctx.restore();
  drawVignette(ctx, world);
  if (world.flash > 0.01) {
    ctx.fillStyle = `rgba(255, 236, 200, ${world.flash * 0.45})`;
    ctx.fillRect(0, 0, TUNE.viewW, TUNE.viewH);
  }
  if (world.hurt > 0.01) {
    const alpha = world.hurt * 0.55;
    const g = ctx.createRadialGradient(640, 360, 280, 640, 360, 760);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(255, 40, 70, ${alpha})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, TUNE.viewW, TUNE.viewH);
  }
  if (world.mode === 'title') drawTitleScreen(ctx, world);
  else if (world.mode === 'win' || world.mode === 'lose') drawResultScreen(ctx, world);
  else drawPlayHud(ctx, world);
  if (world.callout && world.mode === 'play') drawCallout(ctx, world.callout);
}

export function drawTitleScreen(ctx, world) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const bloom = ctx.createRadialGradient(640, 300, 20, 640, 300, 340);
  bloom.addColorStop(0, 'rgba(255, 170, 60, 0.28)');
  bloom.addColorStop(0.45, 'rgba(255, 60, 120, 0.08)');
  bloom.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, TUNE.viewW, TUNE.viewH);
  ctx.restore();

  if (world.bestScore > 0) {
    text(ctx, `BEST  ${formatScore(world.bestScore)}`, 640, 36, { size: 16, fill: '#cbb8a0', font: SANS, tracking: 2 });
  }
  drawTracked(ctx, 'AUREOLE', 640, 176, 68, {
    font: SERIF,
    fill: goldGradient(ctx, 140, 210),
    stroke: '#1a0708',
    strokeWidth: 8,
    tracking: 10,
    glow: 'rgba(255, 150, 40, 0.95)',
  });
  drawTracked(ctx, 'SEAL THE CINDERWELL', 640, 222, 18, {
    font: SANS,
    fill: '#ffd78a',
    tracking: 5,
  });

  panel(ctx, 430, 248, 420, 156);
  const rows = [
    ['WASD  /  ARROWS', 'Fly the Wick'],
    ['MOUSE', 'Aim the lance'],
    ['CLICK  /  SPACE', 'Fire'],
    ['CROSS YOUR TRAIL', 'Seal a ring'],
  ];
  for (let i = 0; i < rows.length; i += 1) {
    const y = 276 + i * 28;
    drawTracked(ctx, rows[i][0], 456, y, 16, { font: SANS, fill: '#ffc14a', tracking: 1, align: 'left' });
    drawTracked(ctx, rows[i][1], 690, y, 16, { font: SANS, fill: '#fff6e8', tracking: 0.2, align: 'left' });
  }
  text(ctx, 'A ×4 chorus mends one hull.', 640, 388, {
    size: 15,
    fill: '#9dffce',
    font: SANS,
  });

  text(ctx, 'Seal the Cinder Heart inside a ring before your hull breaks.', 640, 560, {
    size: 18,
    fill: '#fff6e8',
    font: SANS,
  });
  drawTracked(ctx, 'VERSE I   ·   A HYMN FOR A DYING STAR', 640, 596, 13, {
    font: SANS,
    fill: '#cbb8a0',
    tracking: 3,
  });

  const pulse = 0.55 + 0.45 * Math.sin(world.time * 3.2);
  promptPlate(ctx, 360, 628, 560, 64);
  text(ctx, 'CLICK OR PRESS ENTER', 640, 660, {
    size: 26,
    fill: `rgba(255, 226, 150, ${0.55 + pulse * 0.45})`,
    font: SANS,
    stroke: '#14060a',
    strokeWidth: 5,
  });
}

export function drawPlayHud(ctx, world) {
  ctx.fillStyle = 'rgba(6, 1, 14, 0.72)';
  ctx.fillRect(0, 0, TUNE.viewW, 100);
  goldFrame(ctx, 18, 10, TUNE.viewW - 36, 80);

  text(ctx, 'SCORE', 78, 28, { size: 14, fill: '#cbb8a0', font: SANS, align: 'left' });
  text(ctx, formatScore(world.score), 76, 62, {
    size: 36,
    fill: '#fff1c4',
    font: SANS,
    align: 'left',
    stroke: '#1a0708',
    strokeWidth: 4,
  });

  text(ctx, `WAVE  ${world.wave}  /  4`, 640, 32, { size: 22, fill: '#fff6e8', font: SANS });
  text(ctx, TUNE.waveNames[world.wave] || '', 640, 62, { size: 16, fill: '#ffc14a', font: SANS, tracking: 3 });
  const span = world.wave >= 4 ? 1 : world.waveTime / TUNE.waveSeconds[world.wave];
  roundRect(ctx, 560, 78, 160, 6, 3);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fill();
  roundRect(ctx, 560, 78, Math.max(6, 160 * Math.min(1, span)), 6, 3);
  ctx.fillStyle = '#ffc14a';
  ctx.fill();

  text(ctx, 'HULL', 1048, 30, { size: 14, fill: '#cbb8a0', font: SANS, align: 'left' });
  for (let i = 0; i < TUNE.hullMax; i += 1) {
    drawPip(ctx, 1060 + i * 32, 62, i < world.hull);
  }

  ctx.fillStyle = 'rgba(6, 1, 14, 0.78)';
  ctx.fillRect(0, 632, TUNE.viewW, 88);
  goldFrame(ctx, 18, 642, TUNE.viewW - 36, 64);
  drawChorusMeter(ctx, world);
  text(ctx, world.objective, 980, 674, { size: 18, fill: '#fff6e8', font: SANS });

  if (world.banner && world.time < world.bannerUntil) {
    const left = world.bannerUntil - world.time;
    const alpha = Math.min(1, left) * Math.min(1, (2.05 - left) * 3);
    ctx.save();
    ctx.globalAlpha = alpha;
    text(ctx, world.banner, 640, 168, {
      size: 32,
      fill: '#fff6e8',
      font: SANS,
      stroke: '#14060a',
      strokeWidth: 6,
    });
    ctx.restore();
  }
}

export function drawResultScreen(ctx, world) {
  const won = world.mode === 'win';
  ctx.fillStyle = won ? 'rgba(5, 0, 12, 0.18)' : 'rgba(5, 0, 12, 0.38)';
  ctx.fillRect(0, 0, TUNE.viewW, TUNE.viewH);
  panel(ctx, 330, 148, 620, 430);
  drawTracked(ctx, won ? 'CINDERWELL SEALED' : 'HULL BROKEN', 640, 196, 16, {
    font: SANS,
    fill: won ? '#ffc14a' : '#ff8aa0',
    tracking: 4,
  });
  drawTracked(ctx, won ? 'THE WELL HOLDS' : 'THE WICK GOES DARK', 640, 258, 48, {
    font: SERIF,
    fill: '#fff6e8',
    stroke: '#1a0708',
    strokeWidth: 7,
    tracking: 1,
  });
  text(ctx, 'SCORE', 640, 318, { size: 16, fill: '#cbb8a0', font: SANS, tracking: 3 });
  text(ctx, formatScore(world.score), 640, 372, {
    size: 72,
    fill: goldGradient(ctx, 330, 420),
    font: SANS,
    stroke: '#1a0708',
    strokeWidth: 6,
  });
  text(ctx, `SEALS  ${world.seals}      PEAK CHORUS  ×${world.bestChorus}      HULL  ${world.hull}`, 640, 442, {
    size: 18,
    fill: '#fff6e8',
    font: SANS,
  });
  const pulse = 0.55 + 0.45 * Math.sin(world.time * 3.2);
  text(ctx, 'CLICK OR PRESS R TO FORGE AGAIN', 640, 518, {
    size: 22,
    fill: `rgba(255, 214, 130, ${0.5 + pulse * 0.5})`,
    font: SANS,
  });
}

function drawCallout(ctx, callout) {
  const k = Math.min(1, callout.age / 0.18);
  const scale = 1.35 - 0.35 * (1 - (1 - k) * (1 - k));
  const alpha = callout.age > callout.life - 0.25 ? (callout.life - callout.age) / 0.25 : 1;
  ctx.save();
  ctx.translate(callout.x, callout.y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = Math.max(0, alpha);
  roundRect(ctx, -168, -36, 336, 72, 16);
  ctx.fillStyle = 'rgba(8, 2, 16, 0.72)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffc14a';
  ctx.stroke();
  text(ctx, callout.text, 0, 0, {
    size: 36,
    fill: '#fff6e8',
    font: SANS,
    stroke: '#1a0708',
    strokeWidth: 4,
  });
  ctx.restore();
}

function drawBackdrop(ctx, world) {
  const g = ctx.createRadialGradient(640, 360, 40, 640, 380, 860);
  g.addColorStop(0, '#5a1840');
  g.addColorStop(0.38, '#1a0a24');
  g.addColorStop(1, '#05010c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, TUNE.viewW, TUNE.viewH);
  drawGlassPanes(ctx, world);
  drawShafts(ctx, world);
  for (let i = 0; i < 56; i += 1) {
    const drift = (world.time * (10 + (i % 6) * 5) + i * 47) % 820;
    const x = (i * 83 + world.time * (4 + (i % 5)) * (i % 2 === 0 ? 1 : -1) + 1280) % 1280;
    const y = 800 - drift;
    const depth = i % 3;
    ctx.globalAlpha = 0.25 + depth * 0.18;
    ctx.fillStyle = i % 4 === 0 ? '#fff1c4' : i % 4 === 1 ? '#ff8a5a' : '#5dfff0';
    ctx.beginPath();
    ctx.arc(x, y, depth === 0 ? 1.1 : 2.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawGlassPanes(ctx, world) {
  const layers = [
    { speed: 12, alpha: 0.09, color: '#ff3d8a', y: 70, h: 90 },
    { speed: -18, alpha: 0.07, color: '#5dfff0', y: 250, h: 70 },
    { speed: 22, alpha: 0.08, color: '#ffc14a', y: 470, h: 110 },
  ];
  for (let layer = 0; layer < layers.length; layer += 1) {
    const pane = layers[layer];
    ctx.save();
    ctx.globalAlpha = pane.alpha;
    ctx.fillStyle = pane.color;
    for (let i = 0; i < 7; i += 1) {
      const x = ((i * 220 + world.time * pane.speed) % 1600) - 180;
      ctx.beginPath();
      ctx.moveTo(x, pane.y);
      ctx.lineTo(x + 90, pane.y - pane.h * 0.45);
      ctx.lineTo(x + 160, pane.y + 10);
      ctx.lineTo(x + 50, pane.y + pane.h * 0.55);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawShafts(ctx, world) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i += 1) {
    const x = 140 + i * 300 + Math.sin(world.time * 0.15 + i) * 24;
    const g = ctx.createLinearGradient(x, 0, x + 40, 720);
    g.addColorStop(0, 'rgba(255, 210, 120, 0.11)');
    g.addColorStop(0.55, 'rgba(255, 120, 60, 0.03)');
    g.addColorStop(1, 'rgba(255, 210, 120, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x, -30);
    ctx.lineTo(x + 46, -30);
    ctx.lineTo(x + 120, 760);
    ctx.lineTo(x - 36, 760);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawMandala(ctx, world) {
  const pulse = 1 + world.pulse * 0.04;
  ctx.save();
  ctx.translate(TUNE.haloX, TUNE.haloY);
  ctx.scale(pulse, pulse);
  ctx.rotate(world.time * 0.04);
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = '#ffc14a';
  ctx.lineWidth = 1.4;
  const petals = 16;
  for (let i = 0; i < petals; i += 1) {
    ctx.rotate((Math.PI * 2) / petals);
    ctx.beginPath();
    ctx.ellipse(210, 0, 78, 16, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.rotate(world.time * 0.05);
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = '#5dfff0';
  for (let i = 0; i < 12; i += 1) {
    ctx.rotate((Math.PI * 2) / 12);
    ctx.beginPath();
    ctx.ellipse(120, 0, 46, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(TUNE.haloX, TUNE.haloY, 86, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 193, 74, 0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawOrnaments(ctx, world) {
  for (let i = 0; i < world.ornaments.length; i += 1) {
    const mark = world.ornaments[i];
    const x = TUNE.haloX + Math.cos(mark.angle) * mark.radius;
    const y = TUNE.haloY + Math.sin(mark.angle) * mark.radius * 0.62;
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.translate(x, y);
    ctx.rotate(mark.spin + world.time);
    if (mark.kind === 'bell') drawBellShape(ctx, mark.size, mark.color, 3);
    else drawShardShape(ctx, mark.size, mark.color);
    ctx.restore();
  }
}

function drawTrail(ctx, world) {
  const trail = world.trail;
  if (trail.length < 2) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = 'rgba(255, 40, 130, 0.55)';
  ctx.lineWidth = 18;
  strokeTrail(ctx, trail, -5);
  ctx.strokeStyle = 'rgba(70, 255, 240, 0.38)';
  ctx.lineWidth = 16;
  strokeTrail(ctx, trail, 5);
  ctx.strokeStyle = 'rgba(255, 196, 70, 0.95)';
  ctx.lineWidth = 8;
  strokeTrail(ctx, trail, 0);
  ctx.strokeStyle = 'rgba(255, 250, 230, 0.95)';
  ctx.lineWidth = 2.4;
  strokeTrail(ctx, trail, 0);
  ctx.restore();
}

function strokeTrail(ctx, trail, offset) {
  ctx.beginPath();
  ctx.moveTo(trail[0].x + offset, trail[0].y);
  for (let i = 1; i < trail.length; i += 1) ctx.lineTo(trail[i].x + offset, trail[i].y);
  ctx.stroke();
}

function drawSeals(ctx, world) {
  for (let i = 0; i < world.sealsFx.length; i += 1) {
    const seal = world.sealsFx[i];
    const u = seal.age / seal.life;
    const alpha = u < 0.55 ? 1 : 1 - (u - 0.55) / 0.45;
    const grow = 0.92 + 0.14 * Math.min(1, seal.age / 0.25);
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.translate(seal.x, seal.y);
    ctx.scale(grow, grow);
    ctx.translate(-seal.x, -seal.y);
    tracePoly(ctx, seal.poly);
    ctx.fillStyle = `rgba(255, 170, 60, ${seal.fill})`;
    ctx.fill();
    ctx.lineWidth = 16;
    ctx.strokeStyle = 'rgba(255, 61, 138, 0.35)';
    ctx.stroke();
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#ffc14a';
    ctx.stroke();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#fff8e8';
    ctx.stroke();
    if (seal.fill > 0.1) {
      const spread = Math.min(1, seal.age / 0.32);
      for (let n = 0; n < 36; n += 1) {
        const angle = (n / 36) * Math.PI * 2 + seal.age * 1.6;
        const dist = seal.r * (0.16 + 0.78 * spread) * (0.42 + (n % 5) * 0.12);
        ctx.save();
        ctx.translate(seal.x + Math.cos(angle) * dist, seal.y + Math.sin(angle) * dist);
        ctx.rotate(angle + n + seal.age * 4);
        const w = 6 + (n % 4) * 5;
        ctx.fillStyle = n % 3 === 0 ? '#5dfff0' : n % 3 === 1 ? '#ff3d8a' : '#ffe08a';
        ctx.fillRect(-w, -2.2, w * 2, 4.4);
        ctx.restore();
      }
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255, 236, 190, 0.45)';
      for (let ray = 0; ray < 16; ray += 1) {
        const angle = (ray / 16) * Math.PI * 2 + seal.age * 0.6;
        ctx.beginPath();
        ctx.moveTo(seal.x + Math.cos(angle) * seal.r * 0.35, seal.y + Math.sin(angle) * seal.r * 0.35);
        ctx.lineTo(seal.x + Math.cos(angle) * seal.r * 1.18, seal.y + Math.sin(angle) * seal.r * 1.18);
        ctx.stroke();
      }
    }
    ctx.beginPath();
    ctx.arc(seal.x, seal.y, seal.r * (0.55 + u * 0.7), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(93, 255, 240, ${0.45 * (1 - u)})`;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }
}

function drawEnemies(ctx, world) {
  for (let i = 0; i < world.enemies.length; i += 1) {
    const foe = world.enemies[i];
    drawFoeTrail(ctx, foe);
    if (foe.kind === 'heart') drawHeart(ctx, foe, world);
    else if (foe.kind === 'bell') {
      glow(ctx, foe.x, foe.y, foe.r * 2.4, foe.color, 0.45);
      ctx.save();
      ctx.translate(foe.x, foe.y);
      ctx.rotate(foe.spin);
      drawBellShape(ctx, foe.r, foe.color, foe.hp);
      ctx.restore();
    } else {
      glow(ctx, foe.x, foe.y, foe.r * 2.2, foe.color, 0.5);
      ctx.save();
      ctx.translate(foe.x, foe.y);
      ctx.rotate(foe.spin);
      drawShardShape(ctx, foe.r, foe.color);
      ctx.restore();
    }
  }
}

function drawFoeTrail(ctx, foe) {
  const hist = foe.hist;
  if (!hist || hist.length < 2 || foe.kind === 'heart') return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = foe.color;
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = foe.kind === 'bell' ? 6 : 4;
  ctx.beginPath();
  ctx.moveTo(hist[0].x, hist[0].y);
  for (let i = 1; i < hist.length; i += 1) ctx.lineTo(hist[i].x, hist[i].y);
  ctx.lineTo(foe.x, foe.y);
  ctx.stroke();
  ctx.restore();
}

function drawHeart(ctx, foe, world) {
  const pulse = 1 + Math.sin(world.time * 3.2) * 0.06;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const shaft = ctx.createLinearGradient(foe.x, foe.y - 420, foe.x, foe.y + 80);
  shaft.addColorStop(0, 'rgba(255, 220, 140, 0)');
  shaft.addColorStop(0.45, 'rgba(255, 140, 50, 0.28)');
  shaft.addColorStop(1, 'rgba(255, 60, 40, 0)');
  ctx.fillStyle = shaft;
  ctx.beginPath();
  ctx.moveTo(foe.x - 18, foe.y - 460);
  ctx.lineTo(foe.x + 18, foe.y - 460);
  ctx.lineTo(foe.x + 70, foe.y + 40);
  ctx.lineTo(foe.x - 70, foe.y + 40);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  glow(ctx, foe.x, foe.y, 210 * pulse, '#ff3d1a', 0.45);
  glow(ctx, foe.x, foe.y, 120 * pulse, '#ffb03a', 0.85);
  glow(ctx, foe.x, foe.y, 48, '#fff6d0', 0.95);

  ctx.save();
  ctx.translate(foe.x, foe.y);
  ctx.rotate(foe.spin);
  ctx.strokeStyle = '#ffe1a0';
  ctx.lineWidth = 3;
  for (let i = 0; i < 10; i += 1) {
    ctx.rotate(Math.PI / 5);
    ctx.beginPath();
    ctx.ellipse(62, 0, 36, 12, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.rotate(-foe.spin * 2.4);
  ctx.strokeStyle = '#ff3d8a';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i += 1) {
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.ellipse(36, 0, 18, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  for (let i = 0; i < 12; i += 1) {
    const angle = world.time * (i % 2 === 0 ? 0.9 : -0.6) + i;
    const radius = 108 + (i % 3) * 16;
    const x = foe.x + Math.cos(angle) * radius;
    const y = foe.y + Math.sin(angle) * radius * 0.78;
    glow(ctx, x, y, 12, i % 2 === 0 ? '#ffc14a' : '#ff3d8a', 0.9);
  }

  ctx.beginPath();
  ctx.arc(foe.x, foe.y, 26 + Math.sin(world.time * 5) * 3, 0, Math.PI * 2);
  ctx.fillStyle = '#fffaf0';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(foe.x, foe.y, 168, 0, Math.PI * 2);
  ctx.setLineDash([10, 8]);
  ctx.strokeStyle = 'rgba(255, 210, 120, 0.85)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]);

  promptPlate(ctx, foe.x - 92, foe.y + 132, 184, 32);
  text(ctx, 'CINDER HEART', foe.x, foe.y + 148, {
    size: 15,
    fill: '#fff1c4',
    font: SANS,
    tracking: 2,
  });
}

function drawShots(ctx, world) {
  for (let i = 0; i < world.shots.length; i += 1) {
    const shot = world.shots[i];
    const ang = Math.atan2(shot.vy, shot.vx);
    ctx.save();
    ctx.translate(shot.x, shot.y);
    ctx.rotate(ang);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(255, 50, 130, 0.9)';
    ctx.fillRect(-34, -4, 26, 3);
    ctx.fillStyle = 'rgba(80, 255, 240, 0.9)';
    ctx.fillRect(-34, 1, 26, 3);
    ctx.fillStyle = '#fffef8';
    ctx.fillRect(-26, -1.6, 34, 3.2);
    glow(ctx, 4, 0, 14, '#fff1c4', 0.9);
    ctx.restore();
  }
}

function drawShip(ctx, world) {
  const player = world.player;
  for (let i = 0; i < world.history.length - 1; i += 1) {
    const ghost = world.history[i];
    const alpha = ((i + 1) / world.history.length) * 0.22;
    drawKite(ctx, ghost.x, ghost.y, player.angle, alpha, true);
  }
  const blink = world.invuln > 0 && Math.sin(world.time * 36) > 0;
  drawKite(ctx, player.x, player.y, player.angle, blink ? 0.4 : 1, false);
  if (world.mode === 'play') {
    const aim = world.aim || { x: player.x + Math.cos(player.angle) * 80, y: player.y + Math.sin(player.angle) * 80 };
    ctx.save();
    ctx.strokeStyle = 'rgba(93, 255, 240, 0.35)';
    ctx.setLineDash([4, 7]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(aim.x, aim.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
}

function drawKite(ctx, x, y, angle, alpha, ghost) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;
  if (!ghost) glow(ctx, 0, 0, 28, '#5dfff0', 0.65);
  ctx.beginPath();
  ctx.moveTo(22, 0);
  ctx.lineTo(-6, 12);
  ctx.lineTo(-2, 0);
  ctx.lineTo(-6, -12);
  ctx.closePath();
  ctx.fillStyle = ghost ? 'rgba(255, 210, 120, 0.4)' : '#ffe1a0';
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = '#fff8e8';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-2, 0);
  ctx.lineTo(-18, 15);
  ctx.lineTo(-8, 0);
  ctx.lineTo(-18, -15);
  ctx.closePath();
  ctx.fillStyle = '#ff3d8a';
  ctx.globalAlpha = alpha * 0.95;
  ctx.fill();
  if (!ghost) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#f4ffff';
    ctx.beginPath();
    ctx.arc(2, 0, 3.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawParticles(ctx, world) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < world.particles.length; i += 1) {
    const speck = world.particles[i];
    const fade = 1 - speck.age / speck.life;
    ctx.save();
    ctx.translate(speck.x, speck.y);
    ctx.rotate(speck.spin);
    ctx.globalAlpha = Math.max(0, fade) * 0.45;
    ctx.fillStyle = speck.color;
    ctx.beginPath();
    ctx.arc(0, 0, speck.size * 1.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = Math.max(0, fade);
    ctx.fillStyle = speck.color;
    if (speck.shard) {
      ctx.fillRect(-speck.size * 1.35, -speck.size * 0.28, speck.size * 2.7, speck.size * 0.56);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1.1, speck.size * 0.4), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}

function drawFloaters(ctx, world) {
  for (let i = 0; i < world.floaters.length; i += 1) {
    const floater = world.floaters[i];
    const fade = 1 - floater.age / floater.life;
    ctx.save();
    ctx.globalAlpha = Math.max(0, fade);
    text(ctx, floater.text, floater.x, floater.y, {
      size: floater.size,
      fill: floater.color,
      font: SANS,
      stroke: '#14060a',
      strokeWidth: 4,
    });
    ctx.restore();
  }
}

function drawVignette(ctx) {
  const g = ctx.createRadialGradient(640, 360, 260, 640, 360, 780);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, TUNE.viewW, TUNE.viewH);
}

function drawShardShape(ctx, radius, color) {
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(-radius * 0.7, radius * 0.82);
  ctx.lineTo(-radius * 0.7, -radius * 0.82);
  ctx.closePath();
  ctx.fillStyle = '#14060f';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function drawBellShape(ctx, radius, color, hp) {
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    const x = Math.cos(a) * radius;
    const y = Math.sin(a) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#071418';
  ctx.fill();
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.38, 0, Math.PI * 2);
  ctx.strokeStyle = '#e8fffd';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (hp) {
    for (let i = 0; i < hp; i += 1) {
      ctx.fillStyle = '#5dfff0';
      ctx.fillRect(-10 + i * 8, radius * 0.55, 5, 5);
    }
  }
}

function drawPip(ctx, x, y, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(8, 0);
  ctx.lineTo(0, 9);
  ctx.lineTo(-8, 0);
  ctx.closePath();
  ctx.fillStyle = filled ? '#ffc14a' : 'rgba(255,255,255,0.08)';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = filled ? '#fff1c4' : 'rgba(255, 193, 74, 0.7)';
  ctx.stroke();
  ctx.restore();
}

function drawChorusMeter(ctx, world) {
  const hot = world.chorus > 1 && world.time <= world.chorusUntil;
  const mend = hot && world.chorus >= 4;
  text(ctx, mend ? 'MEND READY' : 'CHORUS', 48, 658, {
    size: 12,
    fill: mend ? '#9dffce' : '#cbb8a0',
    font: SANS,
    align: 'left',
    tracking: 1.6,
  });
  for (let i = 0; i < TUNE.chorusCap; i += 1) {
    const lit = i < world.chorus;
    const tip = lit && i === world.chorus - 1;
    const x = 48 + i * 22;
    const h = tip ? 22 : 16;
    roundRect(ctx, x, 684 - h / 2, 14, h, 3);
    ctx.fillStyle = lit ? (mend ? '#9dffce' : '#ffc14a') : 'rgba(255,255,255,0.08)';
    ctx.fill();
    ctx.lineWidth = 1.25;
    ctx.strokeStyle = lit ? '#fff6d4' : 'rgba(255, 193, 74, 0.55)';
    ctx.stroke();
  }
  text(ctx, `×${world.chorus}`, 48 + TUNE.chorusCap * 22 + 8, 684, {
    size: hot ? 26 : 18,
    fill: hot ? '#fff1c4' : '#cbb8a0',
    font: SANS,
    align: 'left',
  });
}

function goldFrame(ctx, x, y, w, h) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 193, 74, 0.95)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x, y + 18);
  ctx.lineTo(x, y);
  ctx.lineTo(x + 22, y);
  ctx.moveTo(x + w - 22, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + 18);
  ctx.moveTo(x, y + h - 18);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + 22, y + h);
  ctx.moveTo(x + w - 22, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w, y + h - 18);
  ctx.stroke();
  ctx.fillStyle = '#ffc14a';
  const gems = [
    [x + 8, y + 8],
    [x + w - 8, y + 8],
    [x + 8, y + h - 8],
    [x + w - 8, y + h - 8],
  ];
  for (let i = 0; i < gems.length; i += 1) {
    ctx.beginPath();
    ctx.moveTo(gems[i][0], gems[i][1] - 5);
    ctx.lineTo(gems[i][0] + 5, gems[i][1]);
    ctx.lineTo(gems[i][0], gems[i][1] + 5);
    ctx.lineTo(gems[i][0] - 5, gems[i][1]);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function promptPlate(ctx, x, y, w, h) {
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = 'rgba(8, 3, 16, 0.88)';
  ctx.fill();
  goldFrame(ctx, x, y, w, h);
}

function panel(ctx, x, y, w, h) {
  roundRect(ctx, x, y, w, h, 18);
  ctx.fillStyle = 'rgba(8, 3, 16, 0.84)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255, 193, 74, 0.95)';
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 243, 196, 0.8)';
  ctx.lineWidth = 2;
  const corners = [
    [x + 14, y + 14],
    [x + w - 14, y + 14],
    [x + 14, y + h - 14],
    [x + w - 14, y + h - 14],
  ];
  for (let i = 0; i < corners.length; i += 1) {
    ctx.beginPath();
    ctx.moveTo(corners[i][0], corners[i][1] - 7);
    ctx.lineTo(corners[i][0] + 7, corners[i][1]);
    ctx.lineTo(corners[i][0], corners[i][1] + 7);
    ctx.lineTo(corners[i][0] - 7, corners[i][1]);
    ctx.closePath();
    ctx.stroke();
  }
}

function glow(ctx, x, y, radius, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, hexAlpha(color, alpha));
  g.addColorStop(0.45, hexAlpha(color, alpha * 0.35));
  g.addColorStop(1, hexAlpha(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function tracePoly(ctx, poly) {
  ctx.beginPath();
  ctx.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i += 1) ctx.lineTo(poly[i].x, poly[i].y);
  ctx.closePath();
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function goldGradient(ctx, y0, y1) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, '#fff6d4');
  g.addColorStop(0.45, '#ffc14a');
  g.addColorStop(1, '#ff7a32');
  return g;
}

function text(ctx, value, x, y, opts) {
  ctx.save();
  ctx.font = `${opts.weight || 700} ${opts.size}px ${opts.font || SANS}`;
  ctx.textAlign = opts.align || 'center';
  ctx.textBaseline = 'middle';
  if (opts.tracking) {
    drawTracked(ctx, value, x, y, opts.size, opts);
    ctx.restore();
    return;
  }
  if (opts.stroke) {
    ctx.lineWidth = opts.strokeWidth || 4;
    ctx.strokeStyle = opts.stroke;
    ctx.lineJoin = 'round';
    ctx.strokeText(value, x, y);
  }
  ctx.fillStyle = opts.fill || '#fff6e8';
  ctx.fillText(value, x, y);
  ctx.restore();
}

function drawTracked(ctx, value, x, y, size, opts) {
  ctx.save();
  ctx.font = `${opts.weight || 700} ${size}px ${opts.font || SANS}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  const tracking = opts.tracking || 0;
  const widths = [];
  let total = 0;
  for (let i = 0; i < value.length; i += 1) {
    const w = ctx.measureText(value[i]).width;
    widths.push(w);
    total += w;
  }
  total += tracking * (value.length - 1);
  let cursor = opts.align === 'left' ? x : x - total / 2;
  if (opts.glow) {
    ctx.shadowColor = opts.glow;
    ctx.shadowBlur = 26;
  }
  for (let pass = 0; pass < 2; pass += 1) {
    let pen = cursor;
    if (pass === 1) {
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
    }
    for (let i = 0; i < value.length; i += 1) {
      if (opts.stroke && pass === 1) {
        ctx.lineWidth = opts.strokeWidth || 4;
        ctx.strokeStyle = opts.stroke;
        ctx.strokeText(value[i], pen, y);
      }
      if (pass === 1 || opts.glow) {
        ctx.fillStyle = opts.fill || '#fff6e8';
        ctx.fillText(value[i], pen, y);
      }
      pen += widths[i] + tracking;
    }
  }
  ctx.restore();
}

function hexAlpha(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}
