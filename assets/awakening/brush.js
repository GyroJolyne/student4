const art = document.querySelector('#art');
const toggle = document.querySelector('#toggle');
const label = document.querySelector('#label');
function revealAt(event) {
  if (art.classList.contains('full')) return;
  const bounds = art.getBoundingClientRect();
  const radius = Math.max(60, Math.min(bounds.width, bounds.height) * 0.24);
  art.style.setProperty('--x', (event.clientX - bounds.left) + 'px');
  art.style.setProperty('--y', (event.clientY - bounds.top) + 'px');
  art.style.setProperty('--reach', radius + 'px');
  art.style.setProperty('--core', radius * 0.5 + 'px');
  art.classList.add('brush');
}
function clearBrush(){ art.classList.remove('brush'); }
art.addEventListener('pointermove', revealAt);
art.addEventListener('pointerdown', revealAt);
art.addEventListener('pointerleave', clearBrush);
art.addEventListener('pointercancel', clearBrush);
art.addEventListener('pointerup', event => {if(event.pointerType !== 'mouse') clearBrush();});
toggle.addEventListener('click', () => {
  clearBrush();
  const full = art.classList.toggle('full');
  toggle.setAttribute('aria-pressed', String(full));
  label.textContent = full ? '返回墨稿' : '查看全彩';
});
