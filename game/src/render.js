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
  drawShots(ctx, world);
  drawShip(ctx, world);
  drawParticles(ctx, world);
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
  drawTracked(ctx, 'AUREOLE', 640, 188, 96, {
    font: SERIF,
    fill: goldGradient(ctx, 140, 236),
    stroke: '#1a0708',
    strokeWidth: 10,
    tracking: 10,
    glow: 'rgba(255, 150, 40, 0.9)',
  });
  drawTracked(ctx, 'SEAL THE CINDERWELL', 640, 258, 22, {
    font: SANS,
    fill: '#ffd78a',
    tracking: 6,
  });

  panel(ctx, 300, 300, 680, 268);
  const rows = [
    ['WASD  /  ARROWS', 'Fly the Wick'],
    ['MOUSE', 'Aim the lance'],
    ['CLICK  /  SPACE', 'Fire'],
    ['CROSS YOUR TRAIL', 'Seal a ring'],
  ];
  for (let i = 0; i < rows.length; i += 1) {
    const y = 352 + i * 46;
    drawTracked(ctx, rows[i][0], 420, y, 22, { font: SANS, fill: '#ffc14a', tracking: 1.5, align: 'left' });
    drawTracked(ctx, rows[i][1], 760, y, 22, { font: SANS, fill: '#fff6e8', tracking: 0.4, align: 'left' });
  }
  text(ctx, 'A chorus of ×4 or higher mends one hull.', 640, 538, {
    size: 18,
    fill: '#9dffce',
    font: SANS,
  });

  text(ctx, 'Seal the Cinder Heart inside a ring before your hull breaks.', 640, 604, {
    size: 20,
    fill: '#fff6e8',
    font: SANS,
  });
  const pulse = 0.55 + 0.45 * Math.sin(world.time * 3.2);
  text(ctx, 'CLICK OR PRESS ENTER', 640, 662, {
    size: 28,
    fill: `rgba(255, 214, 130, ${0.45 + pulse * 0.55})`,
    font: SANS,
    stroke: '#14060a',
    strokeWidth: 5,
  });
  if (world.bestScore > 0) {
    text(ctx, `BEST  ${formatScore(world.bestScore)}`, 640, 86, { size: 16, fill: '#cbb8a0', font: SANS, tracking: 2 });
  }
}

export function drawPlayHud(ctx, world) {
  ctx.fillStyle = 'rgba(6, 1, 14, 0.62)';
  ctx.fillRect(0, 0, TUNE.viewW, 96);
  ctx.fillStyle = 'rgba(255, 193, 74, 0.85)';
  ctx.fillRect(0, 96, TUNE.viewW, 2);

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

  ctx.fillStyle = 'rgba(6, 1, 14, 0.62)';
  ctx.fillRect(0, 648, TUNE.viewW, 72);
  ctx.fillStyle = 'rgba(255, 193, 74, 0.85)';
  ctx.fillRect(0, 648, TUNE.viewW, 2);
  const chorusHot = world.chorus > 1 && world.time <= world.chorusUntil;
  text(ctx, chorusHot ? `CHORUS  ×${world.chorus}` : 'CHORUS  ×1', 220, 684, {
    size: chorusHot ? 28 : 20,
    fill: chorusHot ? '#fff1c4' : '#cbb8a0',
    font: SANS,
    align: 'left',
  });
  text(ctx, world.objective, 860, 684, { size: 22, fill: '#fff6e8', font: SANS });

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
  const g = ctx.createRadialGradient(640, 380, 40, 640, 380, 820);
  g.addColorStop(0, '#4a1434');
  g.addColorStop(0.42, '#1a0a22');
  g.addColorStop(1, '#07010f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, TUNE.viewW, TUNE.viewH);
  for (let i = 0; i < 40; i += 1) {
    const drift = (world.time * (12 + (i % 5) * 4) + i * 53) % 780;
    const x = (i * 97 + world.time * (6 + (i % 4))) % 1280;
    const y = 760 - drift;
    ctx.globalAlpha = 0.35 + (i % 3) * 0.12;
    ctx.fillStyle = i % 3 === 0 ? '#ffc14a' : '#ff8a5a';
    ctx.beginPath();
    ctx.arc(x, y, i % 4 === 0 ? 2.2 : 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawMandala(ctx, world) {
  const pulse = 1 + world.pulse * 0.04;
  ctx.save();
  ctx.translate(640, 368);
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
  ctx.arc(640, 368, 86, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 193, 74, 0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawOrnaments(ctx, world) {
  for (let i = 0; i < world.ornaments.length; i += 1) {
    const mark = world.ornaments[i];
    const x = 640 + Math.cos(mark.angle) * mark.radius;
    const y = 368 + Math.sin(mark.angle) * mark.radius * 0.62;
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
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(255, 61, 138, 0.28)';
  ctx.lineWidth = 14;
  strokeTrail(ctx, trail, 3, 0);
  ctx.strokeStyle = 'rgba(255, 193, 74, 0.92)';
  ctx.lineWidth = 7;
  strokeTrail(ctx, trail, 0, 0);
  ctx.strokeStyle = '#fff6e0';
  ctx.lineWidth = 2;
  strokeTrail(ctx, trail, 0, 0);
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

function drawHeart(ctx, foe, world) {
  glow(ctx, foe.x, foe.y, 150, '#ff6a2a', 0.55);
  glow(ctx, foe.x, foe.y, 70, '#ffc14a', 0.8);
  ctx.save();
  ctx.translate(foe.x, foe.y);
  ctx.rotate(foe.spin);
  ctx.strokeStyle = '#ffd78a';
  ctx.lineWidth = 3;
  for (let i = 0; i < 8; i += 1) {
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.ellipse(34, 0, 26, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(foe.x, foe.y, 22 + Math.sin(world.time * 4) * 2, 0, Math.PI * 2);
  ctx.fillStyle = '#fff3c4';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(foe.x, foe.y, 78, 0, Math.PI * 2);
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = 'rgba(255, 193, 74, 0.7)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]);
  text(ctx, 'CINDER HEART', foe.x, foe.y + 96, {
    size: 16,
    fill: '#fff1c4',
    font: SANS,
    stroke: '#14060a',
    strokeWidth: 4,
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
    glow(ctx, 0, 0, 16, '#fff1c4', 0.8);
    ctx.fillStyle = '#fffef8';
    ctx.fillRect(-16, -2, 22, 4);
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
  for (let i = 0; i < world.particles.length; i += 1) {
    const speck = world.particles[i];
    const fade = 1 - speck.age / speck.life;
    ctx.save();
    ctx.globalAlpha = Math.max(0, fade);
    ctx.translate(speck.x, speck.y);
    ctx.rotate(speck.spin);
    ctx.fillStyle = speck.color;
    if (speck.shard) {
      ctx.fillRect(-speck.size, -speck.size * 0.35, speck.size * 2, speck.size * 0.7);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, speck.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
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
