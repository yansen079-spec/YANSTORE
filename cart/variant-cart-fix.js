/* YanStore cart variant button fix v2 */
(()=>{
'use strict';
if(window.__ysVariantCartFixV2)return;
window.__ysVariantCartFixV2=true;

function clean(s){return String(s||'').replace(/\s+/g,' ').trim()}
function cfg(){
  const c=window.YANSTORE_CHAT_CONFIG||{};
  return {
    url:c.supabaseUrl||'https://ivnohbhlahevaihunmbp.supabase.co',
    key:c.supabaseAnonKey||'sb_publishable_uyzGj6RZJfhDdGqf2rAldg_NRQTNEZH'
  };
}
function getProductName(card){
  const modal=card.closest('#v64VariantModal,[class*="modal"]');
  return clean(modal?.querySelector('#v64ModalTitle,h2,h3')?.textContent||'')
    .replace(/\s*[—-]\s*Pilih Paket.*$/i,'') || 'Produk YANSTORE';
}
function getPackName(card){
  return clean(card.querySelector('.v691-variant-name,h4,strong')?.textContent||'Paket pilihan');
}
function getPrice(card){
  const t=clean(card.querySelector('.v64-price,.price')?.textContent||'');
  return parseInt(t.replace(/[^0-9]/g,''),10)||0;
}
function findProductId(product){
  try{
    if(typeof products!=='undefined'&&Array.isArray(products)){
      const p=products.find(x=>clean(x?.name).toLowerCase()===clean(product).toLowerCase());
      if(p)return p.id;
    }
  }catch(_){}
  return null;
}
async function resolveVariant(card){
  const product=getProductName(card), pack=getPackName(card), price=getPrice(card);
  let productId=findProductId(product);
  const c=cfg();
  let q=c.url+'/rest/v1/product_variants?select=id,product_id,name,price,stock_status,active&active=eq.true&name=eq.'+encodeURIComponent(pack);
  if(productId)q+='&product_id=eq.'+encodeURIComponent(productId);
  const r=await fetch(q,{headers:{apikey:c.key,Authorization:'Bearer '+c.key}});
  const d=await r.json().catch(()=>[]);
  if(!r.ok)throw Error(d?.message||('HTTP '+r.status));
  const v=Array.isArray(d)?d[0]:null;
  if(!v)throw Error('Paket tidak ditemukan di database');
  return {
    key:String(v.id),
    variantId:v.id,
    productId:v.product_id,
    product,
    package:pack,
    price:price||parseInt(String(v.price||'').replace(/[^0-9]/g,''),10)||0,
    status:clean(v.stock_status||'READY').toUpperCase(),
    productStatus:'READY'
  };
}
async function onCartClick(e,btn,card){
  e.preventDefault();
  e.stopImmediatePropagation();
  if(btn.dataset.ysBusy==='1')return;
  btn.dataset.ysBusy='1';
  const old=btn.textContent;
  btn.textContent='MENAMBAHKAN...';
  btn.disabled=true;
  try{
    if(typeof window.v6926AddItem!=='function')throw Error('Keranjang belum siap');
    const info=await resolveVariant(card);
    window.v6926AddItem(info);
    btn.textContent='✅ DITAMBAHKAN';
    setTimeout(()=>{btn.textContent=old;btn.disabled=false;btn.dataset.ysBusy='0'},900);
    return;
  }catch(err){
    console.warn('YanStore variant cart:',err);
    alert('Gagal menambahkan ke keranjang: '+err.message);
  }
  btn.textContent=old;
  btn.disabled=false;
  btn.dataset.ysBusy='0';
}
function bindCard(card){
  const orderBtn=[...card.querySelectorAll('button,a')].find(btn=>{
    const t=clean(btn.textContent).toLowerCase();
    return t.includes('pesan paket')||t==='pesan'||t.includes('pesan sekarang');
  });
  if(!orderBtn)return;
  let cartBtn=card.querySelector('.v6926-add');
  if(!cartBtn){
    cartBtn=document.createElement('button');
    cartBtn.type='button';
    cartBtn.className='v6926-add';
    cartBtn.textContent='🛒 TAMBAH KE KERANJANG';
    orderBtn.insertAdjacentElement('afterend',cartBtn);
  }
  if(cartBtn.dataset.ysVariantBound==='1')return;
  cartBtn.dataset.ysVariantBound='1';
  cartBtn.addEventListener('click',e=>onCartClick(e,cartBtn,card),true);
}
function bindAll(){
  document.querySelectorAll('.v64-variant-card').forEach(bindCard);
}
const obs=new MutationObserver(()=>requestAnimationFrame(bindAll));
obs.observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('click',()=>setTimeout(bindAll,30));
setInterval(bindAll,1200);
setTimeout(bindAll,100);
})();
