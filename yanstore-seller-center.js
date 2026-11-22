/* Seller Center 1.0: one screen per task, reuse untouched existing DOM modules.
 * Do NOT alter v6Session, Supabase queries, admin save/delete handlers or inventory.
 * Intended only for /?yanstore_admin=1. Falls back to legacy panel if this script fails. */
(() => {
  if(new URLSearchParams(location.search).get('yanstore_admin')!=='1')return;
  const panels=[
    {id:'overview',icon:'▦',name:'Ringkasan',hint:'Pantau kondisi produk tanpa membuka semua formulir.'},
    {id:'products',icon:'◫',name:'Produk',hint:'Tambah, edit, dan cari produk.'},
    {id:'variants',icon:'◈',name:'Paket',hint:'Kelola varian dan pilihan paket.'},
    {id:'stock',icon:'▣',name:'Stok',hint:'Kelola stok aktif dan ketersediaan paket.'},
    {id:'orders',icon:'▤',name:'Pesanan',hint:'Kelola pesanan melalui sistem yang sudah ada.'},
    {id:'finance',icon:'◉',name:'Laporan',hint:'Buka laporan penjualan yang sudah tersedia.'},
    {id:'reviews',icon:'☆',name:'Testimoni',hint:'Kelola ulasan pelanggan dan moderasi.'},
    {id:'promos',icon:'✦',name:'Promosi',hint:'Kelola promosi, badge, dan pengumuman.'},
    {id:'tools',icon:'⚙',name:'Lainnya',hint:'Pengaturan serta fitur tambahan admin.'}
  ];
  let active='overview',pending=false;
  const $=id=>document.getElementById(id);
  const panel=()=> $('v6AdminPanel');
  function authenticated(){
    try{return typeof v6Session!=='undefined' && !!v6Session?.access_token && panel()?.style.display!=='none';}
    catch{return false;}
  }
  function sectionFor(el){
    if(el.id==='ysCenterHeading'||el.id==='ysCenterSummary'||el.classList.contains('ys-center-side')||el.id==='ysCenterStockSearch')return 'shell';
    if(el.matches('input[type=hidden]'))return 'products';
    const id=el.id||'',classes=String(el.className||'');
    if(id==='ysPromoCenter'||classes.includes('ys-promo-center'))return 'promos';
    if(el.matches('a[href*="semi-auto-order"]'))return 'orders';
    if(el.matches('a[href*="sales/index"]'))return 'finance';
    if(/^(v6List|v6Msg|v6Name|v6Id)$/.test(id)||classes.includes('v6head')||classes.includes('v6grid')||classes.includes('v6actions')||classes.includes('v6list')||classes.includes('v6msg'))return 'products';
    const marker=(id+' '+classes+' '+(el.querySelector('h3,h2')?.textContent||'')).toLowerCase();
    if(/testimoni|testimonial|v6915|v6918/.test(marker))return 'reviews';
    if(/stock|stok|inventory|invite|manual/.test(marker))return 'stock';
    if(/variant|varian|paket|v64|v6924/.test(marker))return 'variants';
    if(/banner|promo|badge|announcement|pengumuman|v6914|v6916|v6920/.test(marker))return 'promos';
    return 'tools';
  }
  function view(id){
    active=panels.some(x=>x.id===id)?id:'overview';
    const root=panel();if(!root)return;
    const cfg=panels.find(x=>x.id===active);
    const title=$('ysCenterTitle'),hint=$('ysCenterHint');
    if(title)title.textContent=cfg.name;
    if(hint)hint.textContent=cfg.hint;
    root.querySelectorAll(':scope > [data-ys-center-page]').forEach(child=>{
      child.classList.toggle('ys-center-visible',child.dataset.ysCenterPage===active||child.dataset.ysCenterPage==='shell');
    });
    document.querySelectorAll('.ys-center-tab').forEach(tab=>{
      const selected=tab.dataset.centerTab===active;
      if(selected)tab.setAttribute('aria-current','page');
      else tab.removeAttribute('aria-current');
    });
    if(active==='overview')metrics();
    if(active==='stock')filterStock();
    // Navigation is local to admin; never change the customer-side URL.
    const card=$('v6912AdminCard');if(card)card.scrollTop=0;
  }
  function metrics(){
    const rows=Array.isArray(window.v62Rows)?window.v62Rows:[];
    const total=$('ysCenterProducts'),ready=$('ysCenterReady'),habis=$('ysCenterOut');
    const count=rows.length;
    if(total)total.textContent=count?String(count):'—';
    if(ready)ready.textContent=count?String(rows.filter(x=>String(x.stock_status||'READY').toUpperCase()==='READY').length):'—';
    if(habis)habis.textContent=count?String(rows.filter(x=>String(x.stock_status||'READY').toUpperCase()==='HABIS').length):'—';
    const note=$('ysCenterDataNote');
    if(note)note.textContent=count?'Berdasarkan status produk yang dimuat; stok varian bisa berbeda.':'Ringkasan muncul setelah daftar produk berhasil dimuat.';
  }
  function filterStock(){
    const input=$('ysCenterStockInput');if(!input)return;
    const query=input.value.trim().toLocaleLowerCase('id-ID');
    const root=panel();if(!root)return;
    // Filter only existing stock list rows; never hide form controls or mutate records.
    const nodes=root.querySelectorAll('.ys-stock-row, .ys-stock-item, .ys-invite-row');
    let match=0;
    nodes.forEach(el=>{const ok=!query||el.textContent.toLocaleLowerCase('id-ID').includes(query);el.classList.toggle('ys-center-hidden',!ok);if(ok)match++});
    const count=$('ysCenterStockResults');if(count)count.textContent=nodes.length?match+' dari '+nodes.length+' baris stok':'Data stok dikelola di modul aktif di bawah.';
  }
  function sync(){
    const root=panel();if(!root||!root.classList.contains('ys-center-ready'))return;
    [...root.children].forEach(child=>{
      if(child.dataset.ysCenterPage)return;
      child.dataset.ysCenterPage=sectionFor(child);
    });
    view(active);
  }
  function schedule(){
    if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;sync()});
  }
  function boot(){
    const root=panel();if(!root||root.classList.contains('ys-center-ready'))return;
    const side=document.createElement('aside');
    side.className='ys-center-side';side.dataset.ysCenterPage='shell';
    const brand=document.createElement('div');brand.className='ys-center-brand';
    brand.innerHTML='<strong>YANSTORE</strong><small>Seller Center</small>';side.appendChild(brand);
    const nav=document.createElement('nav');nav.className='ys-center-nav';nav.setAttribute('aria-label','Menu Seller Center');
    panels.forEach(item=>{
      const btn=document.createElement('button');btn.type='button';btn.className='ys-center-tab';btn.dataset.centerTab=item.id;
      btn.innerHTML='<span class="ys-center-tab-icon" aria-hidden="true">'+item.icon+'</span><span class="ys-center-tab-label">'+item.name+'</span>';
      btn.addEventListener('click',()=>view(item.id));nav.appendChild(btn);
    });
    side.appendChild(nav);
    const logout=document.createElement('button');
    logout.type='button';logout.className='ys-center-logout';
    logout.textContent='Keluar dari admin';
    logout.addEventListener('click',()=>{
      if(typeof v6Logout==='function')v6Logout();
      active='overview';
      view(active);
    });
    side.appendChild(logout);
    const foot=document.createElement('div');foot.className='ys-center-aside-foot';foot.textContent='YANSTORE • Kelola toko dengan lebih nyaman.';side.appendChild(foot);
    const head=document.createElement('div');head.id='ysCenterHeading';head.dataset.ysCenterPage='shell';
    head.innerHTML='<div><h1 id="ysCenterTitle">Ringkasan</h1><p id="ysCenterHint">Pantau kondisi produk tanpa membuka semua formulir.</p></div><a class="ys-center-return" href="/" rel="noopener">Lihat toko ↗</a>';
    const home=document.createElement('section');home.id='ysCenterSummary';home.className='ys-center-summary';home.dataset.ysCenterPage='overview';
    home.innerHTML='<div class="ys-center-metrics"><div class="ys-center-metric"><small>Total Produk</small><strong id="ysCenterProducts">—</strong><em>Produk tercatat</em></div><div class="ys-center-metric"><small>Produk READY</small><strong id="ysCenterReady">—</strong><em>Berdasarkan status produk</em></div><div class="ys-center-metric"><small>Produk HABIS</small><strong id="ysCenterOut">—</strong><em>Butuh pengecekan stok</em></div></div><div class="ys-center-card"><h2>Selamat datang di Seller Center</h2><p>Setiap pekerjaan punya ruang sendiri. Gunakan menu untuk mengelola stok, mengedit produk, atau memantau ulasan tanpa harus melewati formulir yang panjang.</p><div class="ys-center-shortcuts"><button type="button" class="ys-center-shortcut" data-center-go="products">Kelola produk →</button><button type="button" class="ys-center-shortcut" data-center-go="stock">Cek stok →</button><button type="button" class="ys-center-shortcut" data-center-go="reviews">Lihat testimoni →</button></div><p id="ysCenterDataNote" class="ys-center-muted" style="margin:15px 0 0">Memuat data produk...</p></div>';
    home.addEventListener('click',e=>{const b=e.target.closest('[data-center-go]');if(b)view(b.dataset.centerGo)});
    const filter=document.createElement('div');filter.id='ysCenterStockSearch';filter.className='ys-center-filterbar';filter.dataset.ysCenterPage='stock';
    filter.innerHTML='<span aria-hidden="true">⌕</span><input id="ysCenterStockInput" type="search" placeholder="Cari baris stok..." aria-label="Cari stok"><span id="ysCenterStockResults" class="ys-center-muted"></span>';
    filter.querySelector('input').addEventListener('input',filterStock);
    root.prepend(filter);root.prepend(home);root.prepend(head);root.prepend(side);
    root.classList.add('ys-center-ready');
    const watch=new MutationObserver(records=>{
      if(records.some(rec=>rec.type==='childList'&&rec.target===root))schedule();
      if(records.some(rec=>rec.type==='childList'&&rec.target!==root&&active==='overview'))metrics();
    });
    watch.observe(root,{childList:true,subtree:false});
    const list=$('v6List');if(list) new MutationObserver(metrics).observe(list,{childList:true});
    sync();
    metrics();
    // Existing admin UI is still used. A failed enhancement simply leaves legacy DOM intact.
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
