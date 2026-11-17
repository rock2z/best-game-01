// Particles, rising numbers, and the decay of shake and flashes.
const PARTICLE_CAP = 420;

export function burst(world, x, y, color, count, speed) {
  const rng = world.rng;
  for (let i = 0; i < count; i += 1) {
    const angle = rng() * Math.PI * 2;
    const fast = speed * (0.25 + rng() * 0.85);
    world.particles.push({
      x,
      y,
      vx: Math.cos(angle) * fast,
      vy: Math.sin(angle) * fast,
      age: 0,
      life: 0.32 + rng() * 0.55,
      size: 1.6 + rng() * 4.2,
      color,
      spin: rng() * Math.PI,
      spinRate: (rng() - 0.5) * 10,
      shard: rng() < 0.62,
    });
  }
  if (world.particles.length > PARTICLE_CAP) {
    world.particles.splice(0, world.particles.length - PARTICLE_CAP);
  }
}

export function pushFloater(world, x, y, text, color, size) {
  world.floaters.push({
    x,
    y,
    text,
    color,
    size,
    age: 0,
    life: 0.9,
    vy: -46,
  });
}

export function stepFx(world, dt) {
  const particles = world.particles;
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const speck = particles[i];
    speck.age += dt;
    if (speck.age >= speck.life) {
      particles.splice(i, 1);
      continue;
    }
    speck.x += speck.vx * dt;
    speck.y += speck.vy * dt;
    speck.vx *= 0.985;
    speck.vy *= 0.985;
    speck.spin += speck.spinRate * dt;
  }
  const seals = world.sealsFx;
  for (let i = seals.length - 1; i >= 0; i -= 1) {
    seals[i].age += dt;
    if (seals[i].age >= seals[i].life) seals.splice(i, 1);
  }
  const floaters = world.floaters;
  for (let i = floaters.length - 1; i >= 0; i -= 1) {
    const floater = floaters[i];
    floater.age += dt;
    floater.y += floater.vy * dt;
    if (floater.age >= floater.life) floaters.splice(i, 1);
  }
  if (world.callout) {
    world.callout.age += dt;
    if (world.callout.age >= world.callout.life) world.callout = null;
  }
  world.shake *= Math.exp(-3.4 * dt);
  if (world.shake < 0.2) world.shake = 0;
  world.flash = Math.max(0, world.flash - dt * 1.4);
  world.hurt = Math.max(0, world.hurt - dt);
  world.pulse = Math.max(0, world.pulse - dt * 0.8);
}
