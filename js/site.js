// Page navigation and chart loading. Existing Vega-Lite specifications remain unchanged.
const chartIds = [1, 2, 3, 4, 5, 7, 8, 6, 10, 11, 9, 12];
const chartOptions = { actions: { export: true, source: false, compiled: false, editor: false }, renderer: 'svg' };
const ready = () => {
  // Charts 2, 3, 6 and 12 need a plot width that accounts for labels. Size to the
  // available card width so they never need an inner horizontal scrollbar.
  chartIds.forEach(async (id) => {
    const target = document.getElementById(`chart${id}`);
    if (!target) return;
    try {
      if ([2, 3, 6, 11, 12].includes(id)) {
        const response = await fetch(`js/chart${id}.json`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const spec = await response.json();
        // Measure the PARENT content box, not the chart itself: observing the
        // chart being replaced by vegaEmbed caused a resize feedback loop.
        const panel = target.closest('.viz-main');
        let lastWidth = -1;
        let raf = null;
        let rendering = Promise.resolve();
        const redraw = () => {
          const panelStyle = getComputedStyle(panel);
          const panelInnerWidth = panel.clientWidth
            - parseFloat(panelStyle.paddingLeft)
            - parseFloat(panelStyle.paddingRight);
          // Reserve space for the y-axis category names, the axis ticks and
          // labels, and the Vega view padding. Width is the PLOT width.
          // Figure 6 has a numeric y-axis and bottom legend. Figure 12 has
          // long category labels plus change-percent labels to the right.

          const labelBudget =
            id === 6 ? 105 :
              id === 11 ? 270 :
                id === 12 ? 265 :
                  Math.min(
                    185,
                    Math.max(105, Math.round(panelInnerWidth * 0.22))
                  );
          const preferredWidth =
            id === 6 ? 740 :
              id === 11 ? 680 :
                id === 12 ? 680 : 700;
          const plotWidth = Math.max(100, Math.floor(Math.min(preferredWidth,
            panelInnerWidth - labelBudget - 35)));
          if (Math.abs(plotWidth - lastWidth) < 3) return;
          lastWidth = plotWidth;
          const layers = spec.layer?.map(layer => {
            const y = layer.encoding?.y;
            if (!y?.field) return layer;
            return {
              ...layer, encoding: {
                ...layer.encoding,
                y: { ...y, axis: { ...y.axis, labelLimit: labelBudget } }
              }
            };
          });
          const adjustedSpec = {
            ...spec,
            width: plotWidth,
            // Fit-x recalculates inner dimensions while using the chart as
            // a measuring target. Use explicit plotting width instead.
            autosize: { type: 'pad', contains: 'padding' },
            ...(layers ? { layer: layers } : {}),
            ...(id === 3 ? {
              encoding: {
                ...spec.encoding,
                y: {
                  ...spec.encoding.y, axis: {
                    ...spec.encoding.y.axis, labelLimit: labelBudget
                  }
                }
              }
            } : {})
          };
          rendering = rendering.catch(() => { }).then(() => vegaEmbed(target, adjustedSpec, chartOptions))
            .catch(error => {
              console.error(`Chart ${id} resize failed:`, error);
              target.textContent = `Chart ${id} could not load. Check the browser console.`;
            });
        };
        redraw();
        const observer = new ResizeObserver(() => {
          if (raf !== null) cancelAnimationFrame(raf);
          raf = requestAnimationFrame(() => { raf = null; redraw(); });
        });
        observer.observe(panel);
      } else {
        await vegaEmbed(target, `js/chart${id}.json`, chartOptions);
      }
    } catch (error) {
      console.error(`Chart ${id} failed:`, error);
      target.innerHTML = `<div class="error-msg">Chart ${id} could not load. Check the browser console and data filename.</div>`;
    }
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
