// The Wick flies, leaves a gold trail, and seals a ring wherever that trail crosses itself.
// Everything inside the ring shatters. Chain the seals to raise Chorus. The Cinder Heart
// ignores the lance and dies only inside a ring.
import { burst, pushFloater, stepFx } from './fx.js';
import { createRng } from './rng.js';
import { TUNE } from './tune.js';

const IDLE = { moveX: 0, moveY: 0, aimX: 640, aimY: 360, fire: false };

export function createWorld(seed) {
  const world = {
    rng: createRng(seed),
    time: 0,
    mode: 'title',
    demoTime: 0,
    wave: 1,
    waveTime: 0,
    score: 0,
    bestScore: 0,
    hull: TUNE.hullMax,
    invuln: 0,
    chorus: 1,
    chorusUntil: 0,
    bestChorus: 1,
    seals: 0,
    shake: 0,
    flash: 0,
    hurt: 0,
    pulse: 0,
    player: { x: TUNE.haloX, y: TUNE.haloY - TUNE.haloRy, vx: 0, vy: 0, angle: 0, fireCd: 0 },
    trail: [],
    shots: [],
    enemies: [],
    ornaments: [],
    particles: [],
    floaters: [],
    sealsFx: [],
    callout: null,
    heartSpawned: false,
    spawnAcc: 0,
    bellAcc: 0,
    banner: '',
    bannerUntil: 0,
    scripted: false,
    objective: 'CROSS YOUR TRAIL TO SEAL A RING',
    objectiveLock: '',
    history: [],
    sfx: [],
  };
  parkOnHalo(world);
  seedOrnaments(world);
  return world;
}

export function parkOnHalo(world) {
  world.demoTime = 0;
  const pose = haloPose(0);
  world.player.x = pose.x;
  world.player.y = pose.y;
  world.player.angle = pose.angle;
  world.trail = [{ x: pose.x, y: pose.y, t: world.time }];
}

export function haloPose(demoTime) {
  const ang = -Math.PI / 2 + demoTime * TUNE.haloOmega;
  const x = TUNE.haloX + Math.cos(ang) * TUNE.haloRx;
  const y = TUNE.haloY + Math.sin(ang) * TUNE.haloRy;
  const tx = -TUNE.haloRx * Math.sin(ang);
  const ty = TUNE.haloRy * Math.cos(ang);
  return { x, y, angle: Math.atan2(ty, tx) };
}

export function resetRun(world) {
  world.mode = 'play';
  world.time = 0;
  world.wave = 1;
  world.waveTime = 0;
  world.score = 0;
  world.hull = TUNE.hullMax;
  world.invuln = 1.25;
  world.chorus = 1;
  world.chorusUntil = 0;
  world.bestChorus = 1;
  world.seals = 0;
  world.shake = 0;
  world.flash = 0;
  world.hurt = 0;
  world.pulse = 0;
  world.player.x = 640;
  world.player.y = 470;
  world.player.vx = 0;
  world.player.vy = 0;
  world.player.angle = -Math.PI / 2;
  world.player.fireCd = 0.2;
  world.trail = [];
  world.shots = [];
  world.enemies = [];
  world.particles = [];
  world.floaters = [];
  world.sealsFx = [];
  world.callout = null;
  world.heartSpawned = false;
  world.spawnAcc = 0.4;
  world.bellAcc = 1.6;
  world.banner = 'WAVE 1 OF 4   ·   GLASS VERMIN';
  world.bannerUntil = 2.15;
  world.scripted = false;
  world.objective = 'CROSS YOUR TRAIL TO SEAL A RING';
  world.objectiveLock = '';
  world.history = [];
  world.sfx.push('start');
  for (let i = 0; i < 4; i += 1) {
    const edge = spawnEdge(world.rng, 28);
    spawnShard(world, edge.x, edge.y);
  }
}

export function stepWorld(world, dt, input) {
  world.time += dt;
  if (world.mode === 'title') {
    stepDemo(world, dt);
    stepFx(world, dt);
    return;
  }
  if (world.mode === 'win' || world.mode === 'lose') {
    stepFx(world, dt);
    return;
  }
  const pad = input || IDLE;
  movePlayer(world, dt, pad);
  recordTrail(world);
  rememberHistory(world);
  trySeal(world);
  coolAndFire(world, dt, pad);
  stepShots(world, dt);
  if (!world.scripted) {
    world.waveTime += dt;
    maybeAdvanceWave(world);
    spawnFoes(world, dt);
  }
  stepEnemies(world, dt);
  touchPlayer(world);
  if (world.mode === 'play' && world.time > world.chorusUntil) world.chorus = 1;
  stepFx(world, dt);
  refreshObjective(world);
}

export function spawnShard(world, x, y) {
  const angle = world.rng() * Math.PI * 2;
  world.enemies.push({
    kind: 'shard',
    x,
    y,
    vx: Math.cos(angle) * 16,
    vy: Math.sin(angle) * 16,
    hp: 1,
    r: 17,
    spin: world.rng() * Math.PI * 2,
    spinRate: 1.2 + world.rng() * 1.8,
    color: world.rng() < 0.55 ? '#ff3d8a' : '#ff6a2a',
    orbit: angle,
    hist: [],
  });
}

export function spawnBell(world, x, y) {
  world.enemies.push({
    kind: 'bell',
    x,
    y,
    vx: 0,
    vy: 0,
    hp: 3,
    r: 30,
    spin: 0,
    spinRate: 0.7,
    color: '#5dfff0',
    orbit: world.rng() * Math.PI * 2,
    hist: [],
  });
}

export function spawnHeart(world, x, y) {
  world.heartSpawned = true;
  world.enemies.push({
    kind: 'heart',
    x,
    y,
    vx: 0,
    vy: 0,
    hp: 1,
    r: 58,
    spin: 0,
    spinRate: 0.42,
    color: '#ffb03a',
    orbit: 0,
    hist: [],
  });
}

export function formatScore(value) {
  const digits = Math.abs(Math.floor(value)).toString();
  let out = '';
  for (let i = 0; i < digits.length; i += 1) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += ',';
    out += digits[i];
  }
  return out;
}

function stepDemo(world, dt) {
  world.demoTime += dt;
  const pose = haloPose(world.demoTime);
  world.player.x = pose.x;
  world.player.y = pose.y;
  world.player.angle = pose.angle;
  recordTrail(world);
  rememberHistory(world);
  trySeal(world);
  burst(world, world.player.x, world.player.y, world.rng() < 0.45 ? '#fff6d0' : '#ff6a2a', 2, 64);
  for (let i = 0; i < world.ornaments.length; i += 1) {
    world.ornaments[i].angle += world.ornaments[i].speed * dt;
  }
}

function movePlayer(world, dt, pad) {
  const player = world.player;
  if (pad.place) {
    player.x = pad.place.x;
    player.y = pad.place.y;
    player.vx = pad.place.vx || 0;
    player.vy = pad.place.vy || 0;
    if (pad.place.angle !== undefined) player.angle = pad.place.angle;
  } else {
    let mx = pad.moveX || 0;
    let my = pad.moveY || 0;
    const mag = Math.hypot(mx, my);
    if (mag > 1) {
      mx /= mag;
      my /= mag;
    }
    if (mag > 0.05) {
      player.vx += mx * TUNE.accel * dt;
      player.vy += my * TUNE.accel * dt;
    }
    const damp = Math.exp(-TUNE.friction * dt);
    player.vx *= damp;
    player.vy *= damp;
    const speed = Math.hypot(player.vx, player.vy);
    if (speed > TUNE.maxSpeed) {
      player.vx = (player.vx / speed) * TUNE.maxSpeed;
      player.vy = (player.vy / speed) * TUNE.maxSpeed;
    }
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    const margin = 34;
    if (player.x < margin) {
      player.x = margin;
      player.vx *= -0.25;
    }
    if (player.y < margin) {
      player.y = margin;
      player.vy *= -0.25;
    }
    if (player.x > TUNE.viewW - margin) {
      player.x = TUNE.viewW - margin;
      player.vx *= -0.25;
    }
    if (player.y > TUNE.viewH - margin) {
      player.y = TUNE.viewH - margin;
      player.vy *= -0.25;
    }
    const flying = Math.hypot(player.vx, player.vy);
    if (flying > 36) player.angle = Math.atan2(player.vy, player.vx);
    else player.angle = Math.atan2((pad.aimY ?? player.y) - player.y, (pad.aimX ?? player.x) - player.x);
  }
  world.invuln = Math.max(0, world.invuln - dt);
}

function recordTrail(world) {
  const player = world.player;
  const trail = world.trail;
  const last = trail[trail.length - 1];
  if (!last || Math.hypot(player.x - last.x, player.y - last.y) >= TUNE.trailGap) {
    trail.push({ x: player.x, y: player.y, t: world.time });
  }
  while (trail.length > 0 && world.time - trail[0].t > TUNE.trailLife) trail.shift();
  if (trail.length > 520) trail.splice(0, trail.length - 520);
}

function rememberHistory(world) {
  world.history.push({ x: world.player.x, y: world.player.y });
  if (world.history.length > 5) world.history.shift();
}

function trySeal(world) {
  const trail = world.trail;
  if (trail.length < TUNE.sealGap + 4) return;
  const head = trail[trail.length - 1];
  const neck = trail[trail.length - 2];
  const limit = trail.length - TUNE.sealGap;
  for (let i = 0; i < limit - 1; i += 1) {
    const hit = segmentsIntersect(neck, head, trail[i], trail[i + 1]);
    if (!hit) continue;
    const poly = trail.slice(i + 1, trail.length - 1).concat([hit]);
    if (Math.abs(shoelace(poly)) >= TUNE.sealMinArea) {
      applySeal(world, poly);
      return;
    }
  }
  for (let i = 0; i < limit; i += 1) {
    const point = trail[i];
    if (Math.hypot(head.x - point.x, head.y - point.y) > TUNE.sealTouch) continue;
    const poly = trail.slice(i);
    if (poly.length < 24) continue;
    if (Math.abs(shoelace(poly)) < TUNE.sealMinArea) continue;
    applySeal(world, poly);
    return;
  }
}

function applySeal(world, poly) {
  const decorative = world.mode === 'title';
  const center = centroid(poly);
  const area = Math.abs(shoelace(poly));
  const radius = Math.sqrt(area / Math.PI);
  if (!decorative) {
    if (world.time <= world.chorusUntil && world.seals > 0) {
      world.chorus = Math.min(TUNE.chorusCap, world.chorus + 1);
    } else {
      world.chorus = 1;
    }
    world.seals += 1;
    world.chorusUntil = world.time + TUNE.chorusWindow;
    if (world.chorus > world.bestChorus) world.bestChorus = world.chorus;
  }
  let popped = 0;
  let heartHit = false;
  let gained = 0;
  if (!decorative) {
    for (let i = world.enemies.length - 1; i >= 0; i -= 1) {
      const foe = world.enemies[i];
      if (!pointInPoly(foe.x, foe.y, poly)) continue;
      const points = foe.kind === 'heart' ? 5000 : foe.kind === 'bell' ? 380 : 190;
      gained += points * world.chorus;
      popped += 1;
      if (foe.kind === 'heart') heartHit = true;
      const bits = foe.kind === 'heart' ? 140 : foe.kind === 'bell' ? 40 : 22;
      const kick = foe.kind === 'heart' ? 720 : foe.kind === 'bell' ? 460 : 420;
      burst(world, foe.x, foe.y, foe.color, bits, kick);
      burst(world, foe.x, foe.y, '#fff6e0', foe.kind === 'heart' ? 28 : 10, kick * 0.55);
      world.enemies.splice(i, 1);
    }
    gained += Math.floor(radius * 1.6) * world.chorus;
    world.score += gained;
    if (world.chorus >= 4 && popped > 0 && world.hull < TUNE.hullMax) {
      world.hull += 1;
      pushFloater(world, world.player.x, world.player.y - 34, 'MEND', '#9dffce', 26);
    }
    world.callout = {
      text: `CHORUS ×${world.chorus}`,
      x: center.x,
      y: center.y,
      age: 0,
      life: 1.2,
    };
    pushFloater(world, center.x, center.y + 58, `+${formatScore(gained)}`, '#fff1c4', 22);
    world.sfx.push(heartHit ? 'win' : 'seal');
    if (heartHit) {
      world.mode = 'win';
      if (world.score > world.bestScore) world.bestScore = world.score;
    }
  } else {
    burst(world, center.x, center.y, '#ffc14a', 22, 160);
  }
  world.sealsFx.push({
    x: center.x,
    y: center.y,
    r: radius,
    poly: simplify(poly, 72),
    age: 0,
    life: decorative ? 1.7 : 1.05,
    fill: decorative ? 0.06 : 0.16,
    chorus: decorative ? 1 : world.chorus,
  });
  world.shake = decorative ? 2.2 : Math.min(15, 5 + radius / 48);
    world.flash = decorative ? 0.08 : 0.4;
  world.pulse = 1;
  world.trail = [{ x: world.player.x, y: world.player.y, t: world.time }];
}

function coolAndFire(world, dt, pad) {
  const player = world.player;
  player.fireCd = Math.max(0, player.fireCd - dt);
  if (!pad.fire || player.fireCd > 0 || world.mode !== 'play') return;
  let dx = (pad.aimX ?? player.x + 40) - player.x;
  let dy = (pad.aimY ?? player.y) - player.y;
  let mag = Math.hypot(dx, dy);
  if (mag < 12) {
    dx = Math.cos(player.angle);
    dy = Math.sin(player.angle);
    mag = 1;
  }
  dx /= mag;
  dy /= mag;
  world.shots.push({
    x: player.x + dx * 18,
    y: player.y + dy * 18,
    vx: dx * TUNE.shotSpeed,
    vy: dy * TUNE.shotSpeed,
    life: TUNE.shotLife,
  });
  player.fireCd = TUNE.fireCooldown;
  world.sfx.push('shot');
}

function stepShots(world, dt) {
  for (let i = world.shots.length - 1; i >= 0; i -= 1) {
    const shot = world.shots[i];
    shot.life -= dt;
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    if (shot.life <= 0 || shot.x < -50 || shot.y < -50 || shot.x > TUNE.viewW + 50 || shot.y > TUNE.viewH + 50) {
      world.shots.splice(i, 1);
      continue;
    }
    for (let e = world.enemies.length - 1; e >= 0; e -= 1) {
      const foe = world.enemies[e];
      const reach = foe.r + (foe.kind === 'heart' ? 4 : 6);
      if (Math.hypot(foe.x - shot.x, foe.y - shot.y) > reach) continue;
      world.shots.splice(i, 1);
      if (foe.kind === 'heart') {
        burst(world, shot.x, shot.y, '#ffe1a0', 7, 90);
        world.sfx.push('tick');
        break;
      }
      foe.hp -= 1;
      burst(world, shot.x, shot.y, foe.color, 8, 150);
      if (foe.hp <= 0) {
        const gain = (foe.kind === 'bell' ? 260 : 110) * Math.max(1, world.chorus);
        world.score += gain;
        pushFloater(world, foe.x, foe.y - 8, `+${gain}`, '#fff6e8', 16);
        burst(world, foe.x, foe.y, foe.color, 16, 210);
        world.enemies.splice(e, 1);
        world.sfx.push('crack');
      }
      break;
    }
  }
}

function stepEnemies(world, dt) {
  const player = world.player;
  for (let i = 0; i < world.enemies.length; i += 1) {
    const foe = world.enemies[i];
    foe.spin += foe.spinRate * dt;
    if (!foe.hist) foe.hist = [];
    foe.hist.push({ x: foe.x, y: foe.y });
    if (foe.hist.length > 5) foe.hist.shift();
    if (foe.kind === 'heart') continue;
    if (foe.kind === 'bell') {
      foe.orbit += dt * (0.65 + world.wave * 0.12);
      const tx = player.x + Math.cos(foe.orbit) * 168;
      const ty = player.y + Math.sin(foe.orbit * 1.17) * 120;
      foe.x += (tx - foe.x) * dt * 0.7;
      foe.y += (ty - foe.y) * dt * 0.7;
      continue;
    }
    const dx = player.x - foe.x;
    const dy = player.y - foe.y;
    const mag = Math.hypot(dx, dy) || 1;
    const accel = 120 + world.wave * 32;
    const max = 78 + world.wave * 24;
    foe.vx += (dx / mag) * accel * dt;
    foe.vy += (dy / mag) * accel * dt;
    const speed = Math.hypot(foe.vx, foe.vy);
    if (speed > max) {
      foe.vx = (foe.vx / speed) * max;
      foe.vy = (foe.vy / speed) * max;
    }
    foe.x += foe.vx * dt;
    foe.y += foe.vy * dt;
  }
}

function spawnFoes(world, dt) {
  const shardCap = 8 + world.wave * 2;
  let shards = 0;
  let bells = 0;
  for (let i = 0; i < world.enemies.length; i += 1) {
    if (world.enemies[i].kind === 'shard') shards += 1;
    else if (world.enemies[i].kind === 'bell') bells += 1;
  }
  world.spawnAcc += dt;
  const every = world.wave === 1 ? 0.92 : world.wave === 2 ? 0.68 : 0.48;
  if (world.spawnAcc >= every && shards < shardCap) {
    world.spawnAcc = 0;
    const edge = spawnEdge(world.rng, 18);
    spawnShard(world, edge.x, edge.y);
  }
  if (world.wave < 2) return;
  world.bellAcc += dt;
  const everyBell = world.wave === 2 ? 3.3 : 2.4;
  if (world.bellAcc >= everyBell && bells < 4) {
    world.bellAcc = 0;
    const edge = spawnEdge(world.rng, 48);
    spawnBell(world, edge.x, edge.y);
  }
}

function maybeAdvanceWave(world) {
  if (world.wave >= 4) return;
  if (world.waveTime < TUNE.waveSeconds[world.wave]) return;
  world.wave += 1;
  world.waveTime = 0;
  world.banner = `WAVE ${world.wave} OF 4   ·   ${TUNE.waveNames[world.wave]}`;
  world.bannerUntil = world.time + 2.05;
  world.sfx.push('wave');
  if (world.wave === 4) spawnHeart(world, 640, 338);
}

function touchPlayer(world) {
  if (world.mode !== 'play' || world.scripted || world.invuln > 0) return;
  const player = world.player;
  for (let i = 0; i < world.enemies.length; i += 1) {
    const foe = world.enemies[i];
    const reach = (foe.kind === 'heart' ? foe.r * 0.78 : foe.r) + TUNE.playerR;
    if (Math.hypot(foe.x - player.x, foe.y - player.y) > reach) continue;
    world.hull -= 1;
    world.invuln = TUNE.invuln;
    world.shake = 10;
    world.hurt = 0.42;
    world.sfx.push('hurt');
    burst(world, player.x, player.y, '#ff4d6a', 20, 240);
    if (world.hull <= 0) {
      world.hull = 0;
      world.mode = 'lose';
      if (world.score > world.bestScore) world.bestScore = world.score;
      world.sfx.push('lose');
    }
    return;
  }
}

function refreshObjective(world) {
  if (world.objectiveLock) {
    world.objective = world.objectiveLock;
    return;
  }
  if (world.heartSpawned) world.objective = 'SEAL THE CINDER HEART INSIDE A RING';
  else if (world.seals === 0) world.objective = 'CROSS YOUR TRAIL TO SEAL A RING';
  else world.objective = 'CHAIN SEALS  ·  A ×4 CHORUS MENDS ONE HULL';
}

function seedOrnaments(world) {
  world.ornaments.length = 0;
  for (let i = 0; i < 11; i += 1) {
    world.ornaments.push({
      kind: i % 4 === 0 ? 'bell' : 'shard',
      angle: world.rng() * Math.PI * 2,
      radius: 500 + world.rng() * 180,
      speed: (world.rng() < 0.5 ? -1 : 1) * (0.08 + world.rng() * 0.16),
      spin: world.rng() * Math.PI,
      size: 12 + world.rng() * 14,
      color: i % 2 === 0 ? '#ff3d8a' : '#5dfff0',
    });
  }
}

function spawnEdge(rng, pad) {
  const side = Math.floor(rng() * 4);
  if (side === 0) return { x: pad + rng() * (TUNE.viewW - pad * 2), y: pad };
  if (side === 1) return { x: TUNE.viewW - pad, y: pad + rng() * (TUNE.viewH - pad * 2) };
  if (side === 2) return { x: pad + rng() * (TUNE.viewW - pad * 2), y: TUNE.viewH - pad };
  return { x: pad, y: pad + rng() * (TUNE.viewH - pad * 2) };
}

function segmentsIntersect(a, b, c, d) {
  const d1x = b.x - a.x;
  const d1y = b.y - a.y;
  const d2x = d.x - c.x;
  const d2y = d.y - c.y;
  const den = d1x * d2y - d1y * d2x;
  if (Math.abs(den) < 1e-8) return null;
  const t = ((c.x - a.x) * d2y - (c.y - a.y) * d2x) / den;
  const u = ((c.x - a.x) * d1y - (c.y - a.y) * d1x) / den;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return { x: a.x + t * d1x, y: a.y + t * d1y };
}

function shoelace(poly) {
  let sum = 0;
  for (let i = 0; i < poly.length; i += 1) {
    const next = poly[(i + 1) % poly.length];
    sum += poly[i].x * next.y - next.x * poly[i].y;
  }
  return sum * 0.5;
}

function centroid(poly) {
  let x = 0;
  let y = 0;
  for (let i = 0; i < poly.length; i += 1) {
    x += poly[i].x;
    y += poly[i].y;
  }
  const n = poly.length || 1;
  return { x: x / n, y: y / n };
}

function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const yi = poly[i].y;
    const yj = poly[j].y;
    const xi = poly[i].x;
    const xj = poly[j].x;
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function simplify(poly, max) {
  if (poly.length <= max) return poly.map((point) => ({ x: point.x, y: point.y }));
  const out = [];
  const step = poly.length / max;
  for (let i = 0; i < max; i += 1) {
    const point = poly[Math.floor(i * step)];
    out.push({ x: point.x, y: point.y });
  }
  return out;
}
