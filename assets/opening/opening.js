(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let cover;
  let clearReveal;

  function installBrush(element) {
    const layer = element.querySelector('.reveal-layer');

    let frame = 0;
    let current = null;
    let trail = [];
    const lifetime = 300;

    function paint(now) {
      frame = 0;
      if (!current) return;
      const bounds = element.getBoundingClientRect();
      const radius = 3 * Math.max(70, Math.min(225, Math.min(bounds.width, bounds.height) * 0.19));
      function spot(point, size) {
        const x = Math.round(point.x - bounds.left);
        const y = Math.round(point.y - bounds.top);
        return 'radial-gradient(circle at ' + x + 'px ' + y + 'px, black 0 ' +
          Math.round(size * 0.54) + 'px, transparent ' + Math.ceil(size) + 'px)';
      }
      trail = trail.filter(point => now - point.time < lifetime);
      const masks = [spot(current, radius)];
      for (const point of trail) {
        masks.push(spot(point, radius * 0.82 * (1 - (now - point.time) / lifetime)));
      }
      layer.style.setProperty('--brush', masks.join(','));
      element.classList.add('is-revealing');
      if (trail.length) frame = requestAnimationFrame(paint);
    }
    function move(event) {
      if (!event.isPrimary) return;
      const now = performance.now();
      if (current && !reducedMotion.matches &&
          Math.hypot(event.clientX - current.x, event.clientY - current.y) >= 8) {
        trail.push({...current, time:now});
        if (trail.length > 6) trail.shift();
      }
      current = {x:event.clientX, y:event.clientY};
      if (!frame) frame = requestAnimationFrame(paint);
    }
    function clear() {
      cancelAnimationFrame(frame);
      frame = 0;
      current = null;
      trail = [];
      element.classList.remove('is-revealing');
    }
    element.addEventListener('pointermove', move);
    element.addEventListener('pointerdown', move);
    element.addEventListener('pointerleave', clear);
    element.addEventListener('pointercancel', clear);
    element.addEventListener('pointerup', event => { if (event.pointerType !== 'mouse') clear(); });
    return clear;
  }

  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) clearReveal?.();
  });
  function syncPage() {
    const hero = document.querySelector('.rain-opening');
    if (hero === cover) return;
    observer.disconnect();
    clearReveal?.();
    cover = hero;
    if (hero) {
      clearReveal = installBrush(hero);
      observer.observe(hero);
    }
  }
  syncPage();
  new MutationObserver(syncPage).observe(document.querySelector('main') || document.body, { childList: true });
  window.addEventListener('blur', () => clearReveal?.());
})();
