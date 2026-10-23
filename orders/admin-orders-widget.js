/* YanStore orders admin v1 */
(()=>{
'use strict';
if(window.__ysOrdersAdminV1)return;
window.__ysOrdersAdminV1=true;
const cfg=window.YANSTORE_CHAT_CONFIG||{};
const session=()=>{try{return typeof v6Session!=='undefined'?v6Session:null}catch{return null}};
const panel=()=>document.getElementById('v6AdminPanel')||document.getElementById('v6Admin');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'Rp'+Number(n||0).toLocaleString('id-ID');
let rows=[],busy=false;

async function rpc(name,body={}){
  const s=session();
  if(!cfg.supabaseUrl||!cfg.supabaseAnonKey)throw Error('Konfigurasi Supabase tidak tersedia');
  if(!s?.access_token)throw Error('Login Admin terlebih dahulu');
  const r=await fetch(cfg.supabaseUrl+'/rest/v1/rpc/'+name,{
    method:'POST',
    headers:{apikey:cfg.supabaseAnonKey,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'},
    body:JSON.stringify(body)
  });
  const d=await r.json().catch(()=>null);
  if(!r.ok)throw Error(d?.message||d?.details||('HTTP '+r.status));
  return d;
}
function note(t,ok=false){
  const e=document.getElementById('ys-orders-note');
  if(e){e.textContent=t||'';e.style.color=ok?'#86efac':'#cbd5e1'}
}
function mount(){
  const p=panel();
  if(!p||document.getElementById('ys-orders-admin'))return;
  const box=document.createElement('section');
  box.id='ys-orders-admin';
  box.style.cssText='margin:18px 0;padding:18px;border:1px solid #38435f;border-radius:16px;background:#0d1422;color:#fff';
  box.innerHTML='<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><h3 style="margin:0 0 5px">📦 Pesanan YanStore</h3><p style="margin:0;color:#9eabc3;font-size:12px">Klik PEMBAYARAN DITERIMA hanya setelah pembayaran sudah benar-benar diverifikasi.</p></div><button id="ys-orders-refresh" type="button">↻ REFRESH</button></div><div id="ys-orders-note" style="min-height:20px;margin:10px 0;font-size:12px"></div><div id="ys-orders-list" style="display:grid;gap:10px"></div>';
  p.prepend(box);
  document.getElementById('ys-orders-refresh').onclick=load;
  load();
}
function render(){
  const host=document.getElementById('ys-orders-list'); if(!host)return;
  if(!rows.length){host.innerHTML='<div style="padding:16px;border:1px dashed #3b465f;border-radius:12px;color:#94a3b8">Belum ada pesanan.</div>';return}
  host.innerHTML=rows.map(o=>'<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:12px;border:1px solid #303b55;border-radius:12px;background:#111827"><div><b>'+esc(o.checkout_code||'Tanpa kode')+'</b> • '+esc(o.product_name)+'<div style="font-size:11px;color:#aab4c8;margin-top:4px">'+esc(o.variant_label)+' • '+money(o.amount)+' • '+esc(o.buyer_contact)+' • '+esc(o.state==='approved'?'PAID / DIPROSES':(o.state==='canceled'?'DIBATALKAN':o.state))+'</div></div>'+(o.state==='pending'?'<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end"><button type="button" data-ys-cancel="'+esc(o.id)+'" style="border:0;border-radius:9px;padding:9px 12px;background:#991b1b;color:#fff;font-weight:900;cursor:pointer">❌ BATALKAN</button><button type="button" data-ys-approve="'+esc(o.id)+'" style="border:0;border-radius:9px;padding:9px 12px;background:#16a34a;color:#fff;font-weight:900;cursor:pointer">✅ PEMBAYARAN DITERIMA</button></div>':'<span style="font-size:11px;color:#94a3b8;font-weight:800">'+esc(o.state==='approved'?'PAID / DIPROSES':(o.state==='canceled'?'DIBATALKAN':String(o.state||'').toUpperCase()))+'</span>')+'</div>').join('');
  host.querySelectorAll('[data-ys-approve]').forEach(b=>b.onclick=()=>approve(b.dataset.ysApprove,b));
  host.querySelectorAll('[data-ys-cancel]').forEach(b=>b.onclick=()=>cancelOrder(b.dataset.ysCancel,b));
}
async function load(){
  if(busy||!session()?.access_token)return;
  busy=true;note('Memuat pesanan...');
  try{
    const d=await rpc('ys_admin_orders',{});
    rows=Array.isArray(d)?d:[];
    render();
    note('✅ '+rows.length+' item dimuat.',true);
  }catch(e){note('Gagal memuat pesanan: '+e.message)}
  finally{busy=false}
}
async function cancelOrder(id,btn){
  const row=rows.find(x=>x.id===id); if(!row)return;
  if(!confirm('Batalkan pesanan '+(row.checkout_code||'')+'? Pesanan pending ini tidak akan bisa diproses lagi.'))return;
  btn.disabled=true;note('Membatalkan pesanan...');
  try{
    await rpc('ys_admin_cancel_order',{p_order_id:id});
    note('✅ Pesanan dibatalkan.',true);
    await load();
  }catch(e){note('Gagal membatalkan pesanan: '+e.message)}
  finally{btn.disabled=false}
}
async function approve(id,btn){
  const row=rows.find(x=>x.id===id); if(!row)return;
  if(!confirm('Tandai pembayaran DITERIMA untuk '+row.product_name+' — '+row.variant_label+'? Pastikan pembayaran sudah benar-benar masuk.'))return;
  btn.disabled=true;note('Memproses pembayaran...');
  try{
    await rpc('ys_mark_payment_received',{p_order_id:id});
    note('✅ Pembayaran diterima. Pesanan masuk tahap proses. Fulfillment akan mengambil stok dari HomeOffice.',true);
    await load();
  }catch(e){note('Gagal memproses pembayaran: '+e.message)}
  finally{btn.disabled=false}
}
setInterval(()=>{if(session()?.access_token){mount();if(panel()?.offsetParent!==null)load()}},8000);
document.addEventListener('click',()=>setTimeout(mount,200));
setTimeout(mount,900);
})();