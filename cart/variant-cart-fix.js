/* YanStore cart variant button fix v1 */
(()=>{
'use strict';
if(window.__ysVariantCartFixV1)return;
window.__ysVariantCartFixV1=true;

function clean(s){return String(s||'').replace(/\s+/g,' ').trim()}
function addButtons(){
  document.querySelectorAll('.v64-variant-card').forEach(card=>{
    if(card.querySelector('.v6926-add'))return;
    const orderBtn=[...card.querySelectorAll('button,a')].find(btn=>{
      const t=clean(btn.textContent).toLowerCase();
      return t.includes('pesan paket')||t==='pesan'||t.includes('pesan sekarang');
    });
    if(!orderBtn)return;
    const cartBtn=document.createElement('button');
    cartBtn.type='button';
    cartBtn.className='v6926-add';
    cartBtn.textContent='🛒 TAMBAH KE KERANJANG';
    cartBtn.addEventListener('click',e=>{
      e.preventDefault();
      e.stopPropagation();
      if(typeof window.v6926AddItem!=='function'){
        alert('Keranjang belum siap. Refresh halaman lalu coba lagi.');
        return;
      }
      const text=clean(card.innerText);
      const modal=card.closest('#v64VariantModal,[class*="modal"]');
      const product=clean(modal?.querySelector('#v64ModalTitle,h2,h3')?.textContent||'').replace(/\s*[—-]\s*Pilih Paket.*$/i,'')||'Produk YANSTORE';
      const pack=clean(card.querySelector('.v691-variant-name,h4,strong')?.textContent||'Paket pilihan');
      const priceText=clean(card.querySelector('.v64-price,.price')?.textContent||'');
      const price=parseInt(priceText.replace(/[^0-9]/g,''),10)||0;
      let variantId=null, productId=null;
      const oc=orderBtn.getAttribute('onclick')||'';
      const m=oc.match(/v64OpenVariants\((\d+)\)/);
      if(m)productId=m[1];
      try{
        if(typeof v64AdminVariants!=='undefined'&&Array.isArray(v64AdminVariants)){
          const v=v64AdminVariants.find(x=>clean(x.name).toLowerCase()===pack.toLowerCase());
          if(v){variantId=v.id;productId=v.product_id}
        }
      }catch(_){}
      try{
        if(typeof v64Variants!=='undefined'&&Array.isArray(v64Variants)){
          const v=v64Variants.find(x=>clean(x.name).toLowerCase()===pack.toLowerCase());
          if(v){variantId=v.id;productId=v.product_id}
        }
      }catch(_){}
      const key=variantId?String(variantId):'fallback:'+product+'|'+pack+'|'+price;
      window.v6926AddItem({key,variantId,productId,product,package:pack,price,status:'READY',productStatus:'READY'});
    });
    orderBtn.insertAdjacentElement('afterend',cartBtn);
  });
}

const obs=new MutationObserver(()=>requestAnimationFrame(addButtons));
obs.observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('click',()=>setTimeout(addButtons,60));
setInterval(addButtons,1500);
setTimeout(addButtons,200);
})();
