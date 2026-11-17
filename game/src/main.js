// Boots Aureole, steps the world, and draws a frame. A ?shot= name freezes one showcase frame.
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { drawFrame } from './render.js';
import { stageShot } from './shots.js';
import { createWorld, formatScore, resetRun, stepWorld } from './world.js';

const STEP = 1 / 60;

export function bootGame(canvas, statusEl) {
  const ctx = canvas.getContext('2d');
  const world = createWorld(7);
  const input = createInput(canvas);
  const audio = createAudio();
  let last = performance.now();
  let acc = 0;
  let lastStatus = '';

  function fit() {
    const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    canvas.style.width = `${Math.floor(1280 * scale)}px`;
    canvas.style.height = `${Math.floor(720 * scale)}px`;
    canvas.style.left = `${Math.floor((window.innerWidth - 1280 * scale) / 2)}px`;
    canvas.style.top = `${Math.floor((window.innerHeight - 720 * scale) / 2)}px`;
  }

  function paint() {
    drawFrame(ctx, world);
    const root = document.documentElement;
    root.dataset.mode = world.mode;
    root.dataset.score = String(world.score);
    const line = `Aureole. ${world.mode}. Score ${formatScore(world.score)}. Hull ${world.hull}. Wave ${world.wave}. Chorus ${world.chorus}.`;
    if (line !== lastStatus) {
      lastStatus = line;
      statusEl.textContent = line;
    }
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    acc += dt;
    const pad = input.snapshot();
    if (pad.pressed || pad.enter || pad.restart || pad.fire) audio.unlock();
    if (world.mode === 'play') world.aim = { x: pad.aimX, y: pad.aimY };
    while (acc >= STEP) {
      act(world, pad, audio);
      acc -= STEP;
    }
    paint();
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', fit);
  fit();
  canvas.width = 1280;
  canvas.height = 720;

  const shot = new URLSearchParams(window.location.search).get('shot');
  if (shot) {
    const report = stageShot(shot, world);
    paint();
    document.documentElement.dataset.shot = 'ready';
    statusEl.textContent = `Aureole showcase ${report.scene}.`;
    return;
  }
  requestAnimationFrame(frame);
}

function act(world, pad, audio) {
  if (world.mode === 'title' && (pad.enter || pad.pressed || pad.restart)) {
    resetRun(world);
    audio.play('start');
    return;
  }
  if ((world.mode === 'win' || world.mode === 'lose') && (pad.restart || pad.enter || pad.pressed)) {
    resetRun(world);
    audio.play('start');
    return;
  }
  const before = world.sfx.length;
  stepWorld(world, STEP, pad);
  for (let i = before; i < world.sfx.length; i += 1) audio.play(world.sfx[i], world.chorus);
  if (world.sfx.length > 24) world.sfx.splice(0, world.sfx.length - 12);
}

const canvas = document.getElementById('aureole');
const statusEl = document.getElementById('status');
if (canvas && statusEl) bootGame(canvas, statusEl);
