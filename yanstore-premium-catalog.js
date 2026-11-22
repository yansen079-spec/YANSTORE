/* YANSTORE premium catalog enhancement.
   Runs after the existing marketplace renderer; never replaces its handlers.
   Existing ysOpenProduct, ysPayProduct, ysShareProduct and cart controls are kept.
   Only use actual catalog fields; never invent old prices, discounts, best-seller or warranty claims.
*/
(() => {
  const grid=document.getElementById('productGrid');
  if(!grid)return;
  const normalize=v=>String(v??'').trim().toLocaleLowerCase('id-ID').replace(/\s+/g,' ');
  function catalogProducts(){
    try {return typeof products!=='undefined' && Array.isArray(products) ? products : [];}
    catch {return [];}
  }
  function catalogPhone(){
    try {return typeof PHONE!=='undefined' ? String(PHONE) : '6285783984748';}
    catch {return '6285783984748';}
  }
  function decorate(){
    const catalog=catalogProducts();
    const cards=grid.querySelectorAll(':scope > article.ys-market-card');
    cards.forEach(card=>{
      if(card.dataset.ysCatalogEnhanced==='1')return;
      const body=card.querySelector('.ys-market-body');
      const title=body?.querySelector('h3');
      const thumb=card.querySelector('.ys-market-thumb');
      if(!body||!title||!thumb)return;
      card.dataset.ysCatalogEnhanced='1';
      const name=title.textContent.trim();
      const product=catalog.find(p=>normalize(p.name)===normalize(name));
      const stock=String(product?.stockStatus||card.querySelector('.ys-market-tag')?.textContent||'READY').trim().toUpperCase();
      card.dataset.ysStock=stock;
      const lower=normalize(name);
      card.dataset.ysBrand=['capcut','canva','netflix','chatgpt'].find(v=>lower.includes(v))||'other';

      // Description derives from live catalog, not marketing placeholders.
      const desc=document.createElement('p');
      desc.className='ys-catalog-desc';
      desc.textContent=String(product?.description||'Lihat detail paket dan pilihan yang tersedia di YANSTORE.').trim();
      desc.title=desc.textContent;
      title.insertAdjacentElement('afterend',desc);

      const detail=body.querySelector('.ys-market-detail');
      if(detail)detail.textContent='Lihat detail';

      const contact=document.createElement('a');
      contact.className='ys-catalog-whatsapp';
      if(stock==='HABIS'){
        contact.textContent='Stok Habis';
        contact.setAttribute('aria-disabled','true');
        contact.removeAttribute('href');
      }else if(stock==='RESTOCK'){
        contact.textContent='Menunggu Restock';
        contact.setAttribute('aria-disabled','true');
        contact.removeAttribute('href');
      }else {
        contact.textContent='✆ WhatsApp';
        contact.href='https://wa.me/'+catalogPhone()+'?text='+encodeURIComponent(product?.waText||'Halo Yanstore, saya mau tanya produk '+name+'. Mohon info paket dan stok yang tersedia.');
        contact.target='_blank';contact.rel='noopener noreferrer';
        contact.setAttribute('aria-label','Tanya dan pesan '+name+' lewat WhatsApp');
      }
      body.appendChild(contact);

      // Keep QRIS and share controls, just group them visually.
      const tools=document.createElement('div');
      tools.className='ys-catalog-tools';
      const qr=body.querySelector('.ys-market-qr');
      const share=body.querySelector('.ys-market-share');
      if(qr)tools.appendChild(qr);
      if(share)tools.appendChild(share);
      if(tools.childElementCount)body.appendChild(tools);
    });
  }
  let scheduled=false;
  const schedule=()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;decorate();});
  };
  // Parent-level child changes are produced by product filtering/refresh;
  // decorating descendants won't cause an observer feedback loop.
  new MutationObserver(schedule).observe(grid,{childList:true});
  decorate();
})();
