// Small deterministic generator so a showcase frame can be played again exactly.
export function createRng(seed) {
  let state = (seed >>> 0) || 1;
  return function rng() {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
