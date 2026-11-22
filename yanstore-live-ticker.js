/* Live products are sourced from the same in-page products array as the catalog.
   No extra API calls; when catalog is refreshed, ticker follows.
   No hardcoded prices. No auto-motion for users preferring reduced motion. */
(() => {
  const root=document.getElementById('ysLiveTicker');
  const track=document.getElementById('ysTickerTrack');
  const toggle=document.getElementById('ysTickerToggle');
  const grid=document.getElementById('productGrid');
  if(!root||!track||!toggle||!grid)return;
  let lastKey='',refreshQueued=false,paused=false;

  function getProducts() {
    try { return typeof products!=='undefined' && Array.isArray(products) ? products : []; }
    catch(e) { return []; }
  }
  function logoUrl(key) {
    try { return typeof LOGO_DATA!=='undefined' ? LOGO_DATA[key] || '' : ''; }
    catch(e) { return ''; }
  }
  function makeCard(product,clone) {
    const button=document.createElement('button');
    button.type='button';button.className='ys-ticker-card';
    button.dataset.ysTickerProduct=String(product.name||'');
    button.setAttribute('aria-label','Lihat produk '+String(product.name||'')+' di katalog');
    if(clone)button.tabIndex=-1;
    const thumb=document.createElement('span');thumb.className='ys-ticker-thumb';
    // Uploaded product banners are full HTTPS URLs. Keep built-in icons as
    // legacy fallbacks, but never replace a missing image with another brand.
    const value=String(product.logo||'').trim();
    const isBanner=/^https:\/\//i.test(value);
    const src=isBanner?value:logoUrl(value);
    const initials=String(product.name||'P').trim().slice(0,2).toUpperCase();
    if(src) {
      const img=document.createElement('img');
      img.alt='';img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
      if(isBanner)thumb.classList.add('ys-ticker-thumb-banner');
      img.onerror=()=>{img.remove();thumb.classList.remove('ys-ticker-thumb-banner');thumb.textContent=initials;};
      img.src=src;
      thumb.appendChild(img);
    } else thumb.textContent=initials;
    const copy=document.createElement('span');copy.className='ys-ticker-copy';
    const title=document.createElement('span');title.className='ys-ticker-title';title.textContent=String(product.name||'');
    const price=document.createElement('span');price.className='ys-ticker-price';price.textContent=String(product.price||'Lihat harga');
    copy.append(title,price);button.append(thumb,copy);
    return button;
  }
  function update() {
    refreshQueued=false;
    const all=getProducts().filter(p=>p && p.name && String(p.stockStatus||'READY').toUpperCase()!=='HABIS');
    const unique=new Map();
    for(const p of all) if(!unique.has(String(p.id||p.name))) unique.set(String(p.id||p.name),p);
    const picked=[...unique.values()].slice(0,14);
    const key=JSON.stringify(picked.map(p=>[p.id,p.name,p.price,p.logo,p.stockStatus]));
    if(key===lastKey)return;
    lastKey=key;
    track.replaceChildren();
    root.hidden=!picked.length;
    if(!picked.length)return;
    // Duplicate within each group when needed so the scrolling rail feels full.
    const display=picked.length<5?Array.from({length:Math.ceil(5/picked.length)},()=>picked).flat():picked;
    for(let g=0;g<2;g++){
      const group=document.createElement('div');group.className='ys-ticker-group';
      if(g)group.setAttribute('aria-hidden','true');
      display.forEach(p=>group.appendChild(makeCard(p,g===1)));
      track.appendChild(group);
    }
  }
  function scheduleUpdate(){
    if(refreshQueued)return;
    refreshQueued=true;
    window.requestAnimationFrame(update);
  }
  function navigate(name){
    const search=document.getElementById('search'),category=document.getElementById('category');
    if(!search||!category)return;
    // Use existing streaming/premium service navigation, search and product detail flow.
    document.querySelector('#ysDigitalServices [data-ys-service="premium"]')?.click();
    category.value='all';category.dispatchEvent(new Event('change',{bubbles:true}));
    search.value=name;search.dispatchEvent(new Event('input',{bubbles:true}));
    const cards=[...grid.querySelectorAll('.ys-market-card')];
    const exact=cards.find(card=>(card.querySelector('h3')?.textContent||'').trim().toLowerCase()===name.trim().toLowerCase());
    const chosen=exact || (cards.length===1?cards[0]:null);
    (chosen||grid).scrollIntoView({behavior:'smooth',block:'center'});
    if(chosen)window.setTimeout(()=>chosen.querySelector('.ys-market-detail')?.click(),250);
  }
  track.addEventListener('click',event=>{
    const card=event.target.closest('.ys-ticker-card[data-ys-ticker-product]');
    if(card)navigate(card.dataset.ysTickerProduct);
  });
  toggle.addEventListener('click',()=>{
    paused=!paused;root.classList.toggle('is-paused',paused);
    toggle.textContent=paused?'▶':'Ⅱ';
    toggle.setAttribute('aria-label',paused?'Lanjutkan animasi produk':'Jeda animasi produk');
    toggle.setAttribute('aria-pressed',String(paused));
  });
  const observer=new MutationObserver(scheduleUpdate);
  observer.observe(grid,{childList:true,subtree:false});
  scheduleUpdate();
})();
