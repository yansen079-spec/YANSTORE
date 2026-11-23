/* YANSTORE detail page: public read-only data from existing catalog tables.
   No privileged keys, no price/stock fabrication, no changes to checkout. */
(() => {
  'use strict';
  const API='https://ivnohbhlahevaihunmbp.supabase.co';
  const KEY='sb_publishable_uyzGj6RZJfhDdGqf2rAldg_NRQTNEZH';
  const PHONE='6285783984748';
  const $=id=>document.getElementById(id);
  const normalize=v=>String(v??'').trim();
  const upper=v=>normalize(v||'READY').toUpperCase();
  const moneyText=v=>normalize(v||'Tanya admin');
  const withPhone=msg=>'https://wa.me/'+PHONE+'?text='+encodeURIComponent(msg);
  const escapeQuery=v=>encodeURIComponent(String(v));
  const getId=()=>new URLSearchParams(location.search).get('id');
  const validId=id=>/^\d{1,15}$/.test(String(id||''));
  function warrantyOf(sources){
    const terms=new Set();let found=false;
    for(const v of sources){
      const value=String(v||'');if(/\bgaransi\b/i.test(value))found=true;
      const re=/\bgaransi\s*(?:[:=–-]\s*)?(\d{1,3})\s*(hari|bulan|tahun)\b|\b(\d{1,3})\s*(hari|bulan|tahun)\s*garansi\b/gi;
      let m;
      while((m=re.exec(value))){
        const n=Number(m[1]||m[3]),unit=(m[2]||m[4]||'').toLowerCase();
        if(n>0&&n<=365)terms.add(n+' '+unit);
      }
    }
    if(terms.size===1)return 'Garansi '+[...terms][0];
    if(terms.size>1)return 'Garansi sesuai pilihan paket';
    return found?'Garansi sesuai ketentuan':'Info garansi: tanya admin';
  }
  function safeImage(raw){
    if(typeof raw!=='string'||!raw.trim())return '';
    try{
      const u=new URL(raw,location.href);
      return ['https:','http:'].includes(u.protocol)?u.href:'';
    }catch{return '';}
  }
  const fallbackLogo={
    netflix:'netflix.svg',capcut:'capcut.svg',spotify:'spotify.svg',
    youtube:'youtube.svg',disney:'disney.svg',vidio:'vidio.svg',
    iqiyi:'iqiyi.svg',viu:'viu.svg',chatgpt:'chatgpt.svg',prime:'prime.svg'
  };
  async function load(path){
    const response=await fetch(API+'/rest/v1/'+path,{
      headers:{apikey:KEY,Authorization:'Bearer '+KEY},cache:'no-store'
    });
    if(!response.ok)throw new Error('Data katalog tidak bisa dimuat ('+response.status+').');
    const result=await response.json();
    if(!Array.isArray(result))throw new Error('Format katalog tidak sesuai.');
    return result;
  }
  function displayStock(status,qty){
    if(qty!==null&&qty!==undefined&&qty!==''){
      const n=Math.max(0,Number(qty)||0);
      return {cls:n===0?'habis':'ready',text:n===0?'Stok habis':'Stok tersedia'};
    }
    const s=upper(status);
    return {cls:s==='HABIS'?'habis':s==='RESTOCK'?'restock':'ready',
      text:s==='HABIS'?'Stok habis':s==='RESTOCK'?'Menunggu restock':'Stok tersedia'};
  }
  function renderImage(p){
    const panel=$('imagePanel'),img=$('productImage'),fallback=$('imageFallback');
    const name=normalize(p.name||'Produk Digital');
    panel.dataset.brand=['capcut','canva','netflix','chatgpt'].find(x=>name.toLowerCase().includes(x))||'other';
    const picture=safeImage(p.image_url||p.image||p.banner_url||p.logo_url||'')
      ||fallbackLogo[p.logo]||safeImage(p.logo)||'';
    fallback.textContent=name;
    if(picture){
      img.onload=()=>{
        // Uploaded 16:9 catalog artwork can be stored as logo rather than image_url.
        // Use natural dimensions so wide banners fill the panel, while square icons stay contained.
        const wide=img.naturalWidth>0&&img.naturalHeight>0&&img.naturalWidth/img.naturalHeight>=1.35;
        img.classList.toggle('is-banner',wide);
        img.hidden=false;fallback.hidden=true;
      };
      img.onerror=()=>{img.hidden=true;fallback.hidden=false;};
      img.alt='Gambar produk '+name;
      img.classList.toggle('is-banner',Boolean(p.image_url||p.image||p.banner_url));
      img.src=picture;
    }
  }
  function setLink(el,msg,disabled){
    if(disabled){
      el.classList.add('disabled');
      el.removeAttribute('href');
      el.setAttribute('aria-disabled','true');
    }else el.href=withPhone(msg);
  }
  function render(p,variants){
    const name=normalize(p.name||'Produk Digital');
    document.title=name+' | YANSTORE';
    $('crumbName').textContent=name;
    $('productName').textContent=name;
    $('productDescription').textContent=normalize(p.description)||'Lihat pilihan paket dan detail produk pada katalog YANSTORE.';
    renderImage(p);
    const active=variants.filter(v=>v.active!==false);
    const ready=active.filter(v=>displayStock(v.stock_status,v.stock_quantity).cls==='ready');
    const hasVariants=active.length>0;
    const productStock=displayStock(p.stock_status);
    const s=hasVariants
      ? (ready.length?'ready':active.some(v=>displayStock(v.stock_status,v.stock_quantity).cls==='restock')?'restock':'habis')
      :productStock.cls;
    $('productStock').className='stock '+s;
    $('productStock').textContent=s==='habis'?'● Stok habis':s==='restock'?'● Menunggu restock':'● Stok tersedia';
    const warranty=warrantyOf([p.warranty,p.garansi,p.description,...active.flatMap(v=>[v.warranty,v.garansi,v.description])]);
    $('productWarranty').textContent=warranty;
    $('productWarranty').classList.toggle('unknown',warranty.startsWith('Info garansi'));
    $('productPrice').textContent=(hasVariants?'Mulai ':'')+moneyText(p.price);
    const wa=hasVariants
      ? 'Halo Yanstore, saya ingin tanya pilihan paket '+name+'. Mohon konfirmasi harga, stok, dan garansi.'
      :normalize(p.wa_text)||'Halo Yanstore, saya mau order '+name+'. Mohon konfirmasi stok dan harga.';
    setLink($('productWhatsApp'),wa,s==='habis');
    if(s==='habis')$('productWhatsApp').textContent='Stok Habis';
    $('chatAdmin').href=withPhone('Halo admin YANSTORE, saya mau tanya produk '+name+'.');
    $('catalogLink').href='./index.html?produk='+escapeQuery(name)+'#produk';
    if(hasVariants){
      $('variantSection').hidden=false;
      const grid=$('variantGrid');
      grid.replaceChildren();
      active.forEach(v=>{
        const stock=displayStock(v.stock_status,v.stock_quantity);
        const warranty=warrantyOf([v.warranty,v.garansi,v.description]);
        const article=document.createElement('article');article.className='variant';
        const status=document.createElement('div');status.className='statusline';
        const st=document.createElement('span');st.className='stock '+stock.cls;st.textContent='● '+stock.text;
        const wr=document.createElement('span');wr.className='warranty'+(warranty.startsWith('Info garansi')?' unknown':'');wr.textContent=warranty;
        status.append(st,wr);
        const h=document.createElement('h3');h.textContent=normalize(v.name)||'Paket '+name;
        const desc=document.createElement('p');desc.textContent=normalize(v.description||v.period)||'Pilihan paket produk YANSTORE';
        const price=document.createElement('div');price.className='price';price.textContent=moneyText(v.price);
        const action=document.createElement('a');action.className='button green';action.textContent=stock.cls==='habis'?'Stok Habis':stock.cls==='restock'?'Menunggu Restock':'Order Paket';
        setLink(action,normalize(v.wa_text)||'Halo Yanstore, saya mau order '+name+' - '+(v.name||'')+'. Mohon konfirmasi stok dan harga.',stock.cls!=='ready');
        if(stock.cls==='ready'){action.target='_blank';action.rel='noopener noreferrer';}
        article.append(h,desc,status,price,action);grid.appendChild(article);
      });
    }
    $('loading').hidden=true;$('productContent').hidden=false;
  }
  async function run(){
    const id=getId();
    if(!validId(id)){
      $('loading').hidden=true;$('error').hidden=false;
      $('error').textContent='Link produk tidak valid. Silakan kembali ke katalog untuk memilih produk.';
      return;
    }
    try{
      const p=await load('products?select=*&id=eq.'+escapeQuery(id)+'&active=eq.true&limit=1');
      if(!p.length)throw new Error('Produk tidak ditemukan atau sedang tidak aktif.');
      let variants=[];
      try{
        variants=await load('product_variants?select=*&product_id=eq.'+escapeQuery(id)+'&active=eq.true&order=sort_order.asc,id.asc');
      }catch(err){console.warn('Varian tidak tersedia:',err);}
      render(p[0],variants);
    }catch(err){
      $('loading').hidden=true;$('error').hidden=false;
      $('error').textContent=err.message||'Detail produk belum tersedia.';
    }
  }
  run();
})();
