// Plays the real rules forward to a single frame: title, a firefight, a chorus seal, a win.
import { resetRun, spawnBell, spawnHeart, spawnShard, stepWorld } from './world.js';

const STEP = 1 / 60;

export function stageShot(name, world) {
  if (name === 'play' || name === 'action') return stageAction(world);
  if (name === 'chorus' || name === 'combo') return stageChorus(world);
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
  while (world.sealsFx.length > 0 && world.sealsFx[0].age < 0.42 && guard < 1000) {
    stepWorld(world, STEP, null);
    guard += 1;
  }
  return { scene: 'title', frames: guard, seals: world.sealsFx.length };
}

function stageAction(world) {
  resetRun(world);
  world.scripted = true;
  world.wave = 2;
  world.score = 12840;
  world.hull = 4;
  world.chorus = 3;
  world.chorusUntil = 99;
  world.seals = 4;
  world.bestChorus = 3;
  world.banner = '';
  world.bannerUntil = 0;
  world.objectiveLock = 'CROSS YOUR TRAIL TO SEAL A RING';
  world.enemies.length = 0;
  world.shots.length = 0;
  world.particles.length = 0;
  const cluster = [
    [210, 150], [280, 110], [360, 150], [250, 210], [330, 230],
    [170, 200], [410, 190], [300, 170], [230, 120],
  ];
  for (let i = 0; i < cluster.length; i += 1) spawnShard(world, cluster[i][0], cluster[i][1]);
  const flank = [
    [980, 170], [1088, 230], [1004, 300], [900, 150], [1140, 200], [860, 240],
  ];
  for (let i = 0; i < flank.length; i += 1) spawnShard(world, flank[i][0], flank[i][1]);
  spawnBell(world, 150, 320);
  spawnBell(world, 1040, 250);
  spawnBell(world, 470, 120);
  const duration = 0.72;
  for (let i = 0; i < duration / STEP; i += 1) {
    const t = i * STEP;
    const x = 1120 - t * 460;
    const y = 520 + Math.sin(t * 3.1) * 64;
    const nt = t + STEP;
    const x2 = 1120 - nt * 460;
    const y2 = 520 + Math.sin(nt * 3.1) * 64;
    stepWorld(world, STEP, {
      moveX: 0,
      moveY: 0,
      fire: true,
      aimX: 260,
      aimY: 160,
      place: {
        x,
        y,
        vx: (x2 - x) / STEP,
        vy: (y2 - y) / STEP,
        angle: Math.atan2(160 - y, 260 - x),
      },
    });
  }
  world.aim = { x: 260, y: 160 };
  return { scene: 'play', shots: world.shots.length, foes: world.enemies.length };
}

function stageChorus(world) {
  armShowcase(world, {
    wave: 3,
    score: 18660,
    hull: 3,
    chorus: 3,
    seals: 5,
  });
  const cx = 640;
  const cy = 372;
  const spots = [
    [cx - 60, cy - 10], [cx + 50, cy + 24], [cx - 10, cy + 70],
    [cx + 16, cy - 68], [cx - 80, cy + 36], [cx + 78, cy - 20], [cx, cy],
  ];
  for (let i = 0; i < spots.length; i += 1) spawnShard(world, spots[i][0], spots[i][1]);
  spawnBell(world, cx - 36, cy + 8);
  spawnBell(world, cx + 44, cy - 36);
  flyLoop(world, cx, cy, 214, 2.75);
  return { scene: 'chorus', mode: world.mode, callout: world.callout && world.callout.text, seals: world.seals };
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
  flyLoop(world, cx, cy, 348, 2.12);
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
  world.bestChorus = pose.chorus;
  world.banner = '';
  world.bannerUntil = 0;
  world.enemies.length = 0;
  world.shots.length = 0;
  world.particles.length = 0;
  world.floaters.length = 0;
  world.objectiveLock = '';
}

function flyLoop(world, cx, cy, radius, omega) {
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
    if (sealedAt > 0 && world.time >= sealedAt + 0.3) break;
  }
  return sealedAt;
}
