// Plays the real rules forward to one frame: title, a crowded fight, a shatter, the boss.
import { burst, pushFloater } from './fx.js';
import { resetRun, spawnBell, spawnHeart, spawnShard, stepWorld } from './world.js';

const STEP = 1 / 60;

export function stageShot(name, world) {
  if (name === 'play' || name === 'action') return stageAction(world);
  if (name === 'chorus' || name === 'combo' || name === 'shatter') return stageChorus(world);
  if (name === 'boss' || name === 'heart') return stageBoss(world);
  if (name === 'win' || name === 'victory') return stageWin(world);
  return stageTitle(world);
}

function stageTitle(world) {
  world.mode = 'title';
  let guard = 0;
  while (world.sealsFx.length === 0 && guard < 900) {
    stepWorld(world, STEP, null);
    guard += 1;
  }
  while (world.sealsFx.length > 0 && world.sealsFx[0].age < 0.36 && guard < 1000) {
    stepWorld(world, STEP, null);
    guard += 1;
  }
  return { scene: 'title', frames: guard, seals: world.sealsFx.length };
}

function stageAction(world) {
  resetRun(world);
  world.scripted = true;
  world.wave = 3;
  world.score = 24680;
  world.hull = 4;
  world.chorus = 3;
  world.chorusUntil = 99;
  world.seals = 6;
  world.bestChorus = 4;
  world.banner = '';
  world.bannerUntil = 0;
  world.objectiveLock = 'CROSS YOUR TRAIL TO SEAL A RING';
  world.enemies.length = 0;
  world.shots.length = 0;
  world.particles.length = 0;
  world.floaters.length = 0;
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 7; col += 1) {
      spawnShard(world, 90 + col * 155 + (row % 2) * 40, 130 + row * 78);
    }
  }
  spawnBell(world, 180, 250);
  spawnBell(world, 460, 180);
  spawnBell(world, 820, 210);
  spawnBell(world, 1080, 280);
  spawnBell(world, 640, 340);
  const duration = 0.62;
  for (let i = 0; i < duration / STEP; i += 1) {
    const t = i * STEP;
    const x = 180 + t * 720;
    const y = 540 + Math.sin(t * 5) * 28;
    const nt = t + STEP;
    const x2 = 180 + nt * 720;
    const y2 = 540 + Math.sin(nt * 5) * 28;
    stepWorld(world, STEP, {
      moveX: 0,
      moveY: 0,
      fire: true,
      aimX: 640,
      aimY: 240,
      place: {
        x,
        y,
        vx: (x2 - x) / STEP,
        vy: (y2 - y) / STEP,
        angle: Math.atan2(240 - y, 640 - x),
      },
    });
  }
  burst(world, 520, 300, '#ff3d8a', 26, 240);
  burst(world, 700, 250, '#ffc14a', 18, 200);
  burst(world, 860, 320, '#5dfff0', 16, 180);
  pushFloater(world, 520, 270, '+990', '#fff6e8', 20);
  pushFloater(world, 710, 220, '+1,140', '#fff1c4', 22);
  pushFloater(world, 880, 290, '+330', '#fff6e8', 18);
  world.aim = { x: 640, y: 240 };
  world.flash = 0.12;
  return { scene: 'play', shots: world.shots.length, foes: world.enemies.length, bits: world.particles.length };
}

function stageChorus(world) {
  armShowcase(world, {
    wave: 3,
    score: 31840,
    hull: 3,
    chorus: 3,
    seals: 5,
  });
  const cx = 640;
  const cy = 360;
  for (let i = 0; i < 14; i += 1) {
    const angle = (i / 14) * Math.PI * 2;
    const radius = 28 + (i % 4) * 16;
    spawnShard(world, cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  spawnBell(world, cx - 20, cy + 8);
  spawnBell(world, cx + 34, cy - 16);
  spawnBell(world, cx + 6, cy + 30);
  flyLoop(world, cx, cy, 210, 2.8, 0.26);
  return {
    scene: 'shatter',
    mode: world.mode,
    callout: world.callout && world.callout.text,
    bits: world.particles.length,
    foes: world.enemies.length,
  };
}

function stageBoss(world) {
  armShowcase(world, {
    wave: 4,
    score: 40220,
    hull: 3,
    chorus: 6,
    seals: 9,
  });
  world.objectiveLock = 'SEAL THE CINDER HEART INSIDE A RING';
  const cx = 640;
  const cy = 348;
  spawnHeart(world, cx, cy);
  for (let i = 0; i < 18; i += 1) {
    const angle = (i / 18) * Math.PI * 2;
    const radius = 196 + (i % 3) * 34;
    spawnShard(world, cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius * 0.78);
  }
  spawnBell(world, cx - 220, cy - 40);
  spawnBell(world, cx + 200, cy + 30);
  spawnBell(world, cx + 20, cy - 200);
  const sweep = Math.PI * 1.45;
  const radius = 236;
  const steps = 78;
  for (let i = 0; i < steps; i += 1) {
    const ang = -2.35 + sweep * (i / steps);
    const x = cx + Math.cos(ang) * radius;
    const y = cy + Math.sin(ang) * radius;
    const ang2 = -2.35 + sweep * ((i + 1) / steps);
    const x2 = cx + Math.cos(ang2) * radius;
    const y2 = cy + Math.sin(ang2) * radius;
    stepWorld(world, STEP, {
      moveX: 0,
      moveY: 0,
      fire: i > steps - 20,
      aimX: cx,
      aimY: cy,
      place: {
        x,
        y,
        vx: (x2 - x) / STEP,
        vy: (y2 - y) / STEP,
        angle: Math.atan2(y2 - y, x2 - x),
      },
    });
  }
  world.aim = { x: cx, y: cy };
  return { scene: 'boss', mode: world.mode, foes: world.enemies.length, heart: world.heartSpawned };
}

function stageWin(world) {
  armShowcase(world, {
    wave: 4,
    score: 21400,
    hull: 4,
    chorus: 5,
    seals: 7,
  });
  const cx = 640;
  const cy = 360;
  spawnHeart(world, cx, cy);
  spawnShard(world, cx - 70, cy + 10);
  spawnShard(world, cx + 64, cy - 16);
  spawnBell(world, cx + 10, cy - 74);
  flyLoop(world, cx, cy, 280, 2.2, 0.28);
  if (world.score > world.bestScore) world.bestScore = world.score;
  return { scene: 'win', mode: world.mode, score: world.score };
}

function armShowcase(world, pose) {
  resetRun(world);
  world.scripted = true;
  world.wave = pose.wave;
  world.score = pose.score;
  world.hull = pose.hull;
  world.chorus = pose.chorus;
  world.chorusUntil = 999;
  world.seals = pose.seals;
  world.bestChorus = Math.max(pose.chorus, world.bestChorus);
  world.banner = '';
  world.bannerUntil = 0;
  world.enemies.length = 0;
  world.shots.length = 0;
  world.particles.length = 0;
  world.floaters.length = 0;
  world.objectiveLock = '';
}

function flyLoop(world, cx, cy, radius, omega, hold) {
  const start = world.seals;
  const ang0 = -Math.PI / 2;
  world.player.x = cx + Math.cos(ang0) * radius;
  world.player.y = cy + Math.sin(ang0) * radius;
  world.trail = [{ x: world.player.x, y: world.player.y, t: world.time }];
  let sealedAt = -1;
  for (let i = 0; i < 460; i += 1) {
    const t = i * STEP;
    const ang = ang0 + omega * t;
    const x = cx + Math.cos(ang) * radius;
    const y = cy + Math.sin(ang) * radius;
    const ang2 = ang0 + omega * (t + STEP);
    const x2 = cx + Math.cos(ang2) * radius;
    const y2 = cy + Math.sin(ang2) * radius;
    stepWorld(world, STEP, {
      moveX: 0,
      moveY: 0,
      fire: false,
      aimX: x2,
      aimY: y2,
      place: {
        x,
        y,
        vx: (x2 - x) / STEP,
        vy: (y2 - y) / STEP,
        angle: Math.atan2(y2 - y, x2 - x),
      },
    });
    if (sealedAt < 0 && world.seals > start) sealedAt = world.time;
    if (sealedAt > 0 && world.time >= sealedAt + hold) break;
  }
  return sealedAt;
}
