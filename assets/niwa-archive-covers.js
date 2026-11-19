/* Stable cover assignment by issue link. Do not reshuffle on refresh. */
(() => {
  const covers = [1, 2, 3, 4, 5, 6].map(n => `assets/niwa-archive-${String(n).padStart(2, '0')}.webp`);
  const items = [...document.querySelectorAll('#archive-list .archive-item')];
  function hash(s) {
    let h = 2166136261;
    for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  // Keep a six-image cycle anchored to the oldest existing issue.
  const ordered = items.slice().reverse();
  const anchor = ordered[0]?.querySelector('.archive-link')?.getAttribute('href') || '';
  const start = hash(anchor) % covers.length;
  ordered.forEach((item, position) => {
    const link = item.querySelector('.archive-link');
    const box = item.querySelector('.archive-thumb');
    if (!link || !box) return;
    const index = (start + position) % covers.length;
    const img = document.createElement('img');
    img.src = covers[index]; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
    img.style.cssText = 'display:block;width:100%;height:100%;object-fit:cover;';
    box.replaceChildren(img);
  });
})();
