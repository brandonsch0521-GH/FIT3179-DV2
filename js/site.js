// Page navigation and chart loading. Existing Vega-Lite specifications remain unchanged.
const chartIds = [1, 2, 3, 4, 5, 7, 8, 6, 10, 11, 9, 12];
const chartOptions = { actions: { export: true, source: false, compiled: false, editor: false }, renderer: 'svg' };
const ready = () => {
  chartIds.forEach(async (id) => {
    const target = document.getElementById(`chart${id}`);
    if (!target) return;
    try { await vegaEmbed(target, `js/chart${id}.json`, chartOptions); }
    catch (error) { console.error(`Chart ${id} failed:`, error); target.innerHTML = `<div class="error-msg">Chart ${id} could not load. Check the browser console and data filename.</div>`; }
  });
  const nav = document.getElementById('main-nav');
  const menu = document.getElementById('menu-toggle');
  menu.addEventListener('click', () => { const open = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }));
  const top = document.getElementById('back-to-top');
  top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  const progress = document.getElementById('scroll-progress');
  const update = () => { const available = document.documentElement.scrollHeight - window.innerHeight; progress.style.width = `${available > 0 ? 100 * window.scrollY / available : 0}%`; top.classList.toggle('visible', window.scrollY > 600); };
  window.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', update); update();
  if ('IntersectionObserver' in window) { const links = [...nav.querySelectorAll('a')]; const observer = new IntersectionObserver(entries => { entries.forEach(e => { if (e.isIntersecting) { links.forEach(l => l.classList.toggle('active', l.hash === '#' + e.target.id)); } }); }, { rootMargin: '-20% 0px -68% 0px' }); document.querySelectorAll('.story-chapter, .takeaways').forEach(el => observer.observe(el)); }
};
document.addEventListener('DOMContentLoaded', ready);
