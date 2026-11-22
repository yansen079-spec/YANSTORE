/* YANSTORE hero cards -> live catalog products.
   Keeps the existing product catalog and admin system as the source of truth.
   If there is one match, open its existing detail panel; otherwise show filtered matches.
*/
(() => {
  const normalize = value => String(value || '').toLocaleLowerCase('id-ID').trim().replace(/\s+/g, ' ');
  function showProduct(query) {
    const search = document.getElementById('search');
    const category = document.getElementById('category');
    const section = document.getElementById('produk');
    const grid = document.getElementById('productGrid');
    if (!search || !category || !section || !grid) return false;

    // Bring the existing digital-service view into catalog mode.
    const premium = document.querySelector('#ysDigitalServices [data-ys-service="premium"]');
    if (premium) premium.click();
    category.value = 'all';
    category.dispatchEvent(new Event('change', {bubbles:true}));
    search.value = query;
    search.dispatchEvent(new Event('input', {bubbles:true}));

    const matches = [...grid.querySelectorAll('.ys-market-card')];
    const exact = matches.filter(card => normalize(card.querySelector('h3')?.textContent) === normalize(query));
    const chosen = exact.length === 1 ? exact[0] : matches.length === 1 ? matches[0] : null;

    if (chosen) {
      chosen.scrollIntoView({behavior:'smooth',block:'center'});
      // Reuse the existing detail button rather than bypassing checkout/stock logic.
      const detail = chosen.querySelector('.ys-market-detail');
      if (detail) window.setTimeout(() => detail.click(), 200);
    } else {
      grid.scrollIntoView({behavior:'smooth',block:'start'});
      if (matches.length === 0) {
        // The actual database may contain variants under another name. Keep the
        // search visible so visitors can edit it rather than showing a false link.
        search.focus({preventScroll:true});
      }
    }
    return true;
  }
  document.addEventListener('click', event => {
    const card = event.target.closest('.ys-floating-showcase .ys-float-card[data-ys-product]');
    if (!card) return;
    const name = card.dataset.ysProduct;
    if (!name) return;
    if (showProduct(name)) event.preventDefault();
  });
})();
