/* Keep catalog search, stock, cart and QRIS implementation unchanged.
   Redirect only "Lihat Detail" click to new public product page.
   If no active catalog record can be matched, let legacy popup handle it. */
(() => {
  const grid=document.getElementById('productGrid');
  if(!grid)return;
  const norm=v=>String(v||'').trim().toLocaleLowerCase('id-ID').replace(/\s+/g,' ');
  grid.addEventListener('click',event=>{
    const detail=event.target.closest('button.ys-market-detail');
    if(!detail||!grid.contains(detail))return;
    const card=detail.closest('article.ys-market-card');
    const name=card?.querySelector('h3')?.textContent?.trim();
    if(!name)return;
    let product;
    try{
      if(typeof products!=='undefined' && Array.isArray(products)){
        product=products.find(p=>norm(p.name)===norm(name));
      }
    }catch(e){return;}
    if(!product || !/^\d{1,15}$/.test(String(product.id)))return;
    event.preventDefault();event.stopImmediatePropagation();
    window.location.assign('produk.html?id='+encodeURIComponent(String(product.id)));
  },true);
})();
