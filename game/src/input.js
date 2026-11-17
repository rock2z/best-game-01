// Keyboard flies the Wick. The mouse aims and fires the lance.
export function createInput(canvas) {
  const keys = new Set();
  const edges = new Set();
  const mouse = { x: 640, y: 360, down: false, pressed: false };
  const watch = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'KeyR']);

  function aimFrom(event) {
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || canvas.width;
    const height = rect.height || canvas.height;
    mouse.x = ((event.clientX - rect.left) / width) * 1280;
    mouse.y = ((event.clientY - rect.top) / height) * 720;
  }

  window.addEventListener('keydown', (event) => {
    if (!keys.has(event.code)) edges.add(event.code);
    keys.add(event.code);
    if (watch.has(event.code)) event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
  });
  window.addEventListener('mousemove', aimFrom);
  window.addEventListener('mousedown', (event) => {
    aimFrom(event);
    mouse.down = true;
    mouse.pressed = true;
  });
  window.addEventListener('mouseup', () => {
    mouse.down = false;
  });
  window.addEventListener('blur', () => {
    keys.clear();
    mouse.down = false;
  });

  return {
    snapshot() {
      const left = keys.has('KeyA') || keys.has('ArrowLeft');
      const right = keys.has('KeyD') || keys.has('ArrowRight');
      const up = keys.has('KeyW') || keys.has('ArrowUp');
      const down = keys.has('KeyS') || keys.has('ArrowDown');
      const pressed = mouse.pressed;
      const enter = edges.has('Enter');
      const restart = edges.has('KeyR');
      mouse.pressed = false;
      edges.delete('Enter');
      edges.delete('KeyR');
      return {
        moveX: (right ? 1 : 0) - (left ? 1 : 0),
        moveY: (down ? 1 : 0) - (up ? 1 : 0),
        aimX: mouse.x,
        aimY: mouse.y,
        fire: mouse.down || keys.has('Space'),
        pressed,
        enter,
        restart,
      };
    },
  };
}
