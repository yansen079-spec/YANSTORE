/* Sync the three floating hero banners with actual product logos from Supabase.
   Never mutate catalog data or replace purchase and navigation handlers.
   If a matching product has no URL or its image fails, retain original artwork. */
(() => {
  const showcase=document.querySelector('.ys-floating-showcase');
  const grid=document.getElementById('productGrid');
  if(!showcase||!grid)return;
  const normalize=value=>String(value||'').toLocaleLowerCase('id-ID').trim();
  function listProducts(){
    try{return typeof products!=='undefined'&&Array.isArray(products)?products:[];}
    catch{return [];}
  }
  function sync(){
    const catalog=listProducts();
    if(!catalog.length)return;
    showcase.querySelectorAll('.ys-float-card[data-ys-product]').forEach(card=>{
      const target=normalize(card.dataset.ysProduct);
      const matches=catalog.filter(product=>normalize(product.name).includes(target));
      const product=matches.find(item=>/^https:\/\//i.test(String(item.logo||'')))||matches[0];
      const src=String(product?.logo||'').trim();
      const art=card.querySelector('.ys-float-art');
      if(!art)return;
      const current=art.querySelector('.ys-float-image');
      if(!/^https:\/\//i.test(src)){
        if(current)current.remove();
        art.classList.remove('ys-float-art-loaded');
        return;
      }
      if(current?.dataset.src===src)return;
      const img=document.createElement('img');
      img.className='ys-float-image';
      img.alt='';
      img.decoding='async';
      img.loading='eager';
      img.dataset.src=src;
      img.onload=()=>{if(img.isConnected)art.classList.add('ys-float-art-loaded');};
      img.onerror=()=>{img.remove();art.classList.remove('ys-float-art-loaded');};
      img.src=src;
      if(current)current.remove();
      art.appendChild(img);
    });
  }
  let frame=0;
  function schedule(){
    if(frame)return;
    frame=requestAnimationFrame(()=>{frame=0;sync();});
  }
  // The existing Supabase catalog renderer fills/replaces the grid asynchronously.
  new MutationObserver(schedule).observe(grid,{childList:true});
  document.addEventListener('DOMContentLoaded',schedule,{once:true});
  schedule();
})();
