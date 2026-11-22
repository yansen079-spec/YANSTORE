/* Progressive enhancement: subtle pointer parallax for floating promo cards.
   Works only on fine-pointer desktop devices; respects reduced-motion. */
(() => {
  const showcase = document.querySelector('.ys-floating-showcase');
  if (!showcase || !window.matchMedia('(hover: hover) and (pointer: fine)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const items = [...showcase.querySelectorAll('[data-float-depth]')];
  let frame = 0;
  function move(e) {
    const rect = showcase.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - .5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - .5) * 2;
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      items.forEach(item => {
        const depth = Number(item.dataset.floatDepth) || 0;
        item.style.setProperty('--mx', (x * depth).toFixed(1) + 'px');
        item.style.setProperty('--my', (y * depth).toFixed(1) + 'px');
      });
      frame = 0;
    });
  }
  function reset() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    items.forEach(item => {
      item.style.setProperty('--mx', '0px');
      item.style.setProperty('--my', '0px');
    });
  }
  showcase.addEventListener('pointermove', move, {passive:true});
  showcase.addEventListener('pointerleave', reset);
  window.addEventListener('blur', reset);
})();
