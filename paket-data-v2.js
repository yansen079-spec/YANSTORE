(function(){
'use strict';
const url='https://ivnohbhlahevaihunmbp.supabase.co/rest/v1/rpc/yanstore_public_prices';
const key='sb_publishable_uyzGj6RZJfhDdGqf2rAldg_NRQTNEZH';
const operators=['Telkomsel','Indosat','XL','AXIS','Tri','Smartfren','by.U'];
const fmt=n=>'Rp '+Number(n).toLocaleString('id-ID');
const clean=s=>String(s??'').trim();
const esc=s=>clean(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'" :'&#39;'}[c]));
const style=document.createElement('style');
style.textContent='#ysDataV2{position:fixed;inset:0;z-index:120010;background:#050714ef;color:#f3efff;overflow-y:auto;display:none;padding:18px;box-sizing:border-box}#ysDataV2.open{display:block}#ysDataV2 .shell{max-width:1000px;margin:auto;background:#11182c;border:1px solid #8464bb;border-radius:19px;padding:22px}#ysDataV2 .head{display:flex;align-items:center;justify-content:space-between;gap:10px}#ysDataV2 h2{margin:0 0 12px}#ysDataV2 label{display:block;font-size:13px;margin:12px 0;color:#d8cdf5}#ysDataV2 select,#ysDataV2 input{width:100%;box-sizing:border-box;padding:13px;background:#0b1223;border:1px solid #495c85;border-radius:10px;color:white;margin-top:6px}#ysDataV2 button{cursor:pointer;border-radius:10px;padding:11px;border:1px solid #7464a1;background:#242e4c;color:white;font-weight:700}#ysDataV2 .list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:16px 0}#ysDataV2 .item{text-align:left;padding:17px;background:#1b2540;border:1px solid #344565}#ysDataV2 .item.sel{border-color:#c69aff;background:#30264c}#ysDataV2 .item small{display:block;color:#afb9d0;margin-top:7px}#ysDataV2 .go{background:#0eae78;border:0;width:100%}#ysDataV2 .muted{font-size:12px;color:#adbad6}#ysDataV2 .summary{padding:15px;border:1px solid #584e83;border-radius:13px;margin:12px 0}@media(max-width:650px){#ysDataV2 .list{grid-template-columns:1fr}}';
document.head.appendChild(style);
const modal=document.createElement('div');modal.id='ysDataV2';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Paket Data Yanstore');modal.innerHTML='<div class="shell"><div class="head"><h2>📶 Paket Data Yanstore</h2><button id="ysDvClose" type="button">✕ Tutup</button></div><p class="muted">Paket aktif dan harga jual diambil dari Price Manager. Pemesanan tetap manual via WhatsApp.</p><label>Operator<select id="ysDvOperator">'+operators.map(o=>'<option>'+o+'</option>').join('')+'</select></label><label>Cari paket<input id="ysDvSearch" placeholder="Cari kuota, masa aktif, jenis paket"></label><div id="ysDvList" class="list"></div><label>Nomor HP tujuan<input id="ysDvPhone" inputmode="numeric" autocomplete="tel" maxlength="15" placeholder="08xxxxxxxxxx"></label><div id="ysDvSummary" class="summary">Pilih paket di atas.</div><button id="ysDvSend" class="go" type="button">💬 Pesan via WhatsApp</button><p class="muted">Tidak ada pembayaran atau pengiriman paket otomatis. Pastikan harga dan ketersediaan dikonfirmasi admin.</p></div>';document.body.appendChild(modal);
const el=id=>document.getElementById(id);let rows=[],chosen=null,seq=0;
function render(){
 const op=clean(el('ysDvOperator').value).toLowerCase(),q=clean(el('ysDvSearch').value).toLowerCase();
 const visible=rows.filter(p=>clean(p.provider).toLowerCase()===op&&clean(p.item_name).toLowerCase().includes(q));
 el('ysDvList').innerHTML=visible.length?visible.map(p=>'<button type="button" class="item '+(chosen&&chosen.id===p.id?'sel':'')+'" data-id="'+p.id+'"><strong>'+esc(p.item_name)+'</strong><small>Harga jual '+fmt(p.sale_price)+'</small></button>').join(''):'<p class="muted">Belum ada paket aktif untuk pilihan ini. Tambahkan melalui Price Manager.</p>';
 el('ysDvSummary').textContent=chosen?'Paket: '+chosen.item_name+' — Harga jual: '+fmt(chosen.sale_price):'Pilih paket yang tersedia.';
 el('ysDvSend').disabled=!chosen;
}
async function load(){const id=++seq;rows=[];chosen=null;render();el('ysDvList').innerHTML='<p class="muted">Memuat paket...</p>';try{const r=await fetch(url,{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:'{}'});if(!r.ok)throw Error('HTTP '+r.status);const d=await r.json();if(id!==seq)return;rows=Array.isArray(d)?d.filter(p=>p.service==='data'):[];render();}catch(e){if(id===seq)el('ysDvList').innerHTML='<p class="muted">Harga belum bisa dimuat. Coba tutup dan buka lagi.</p>';}}
function open(){modal.classList.add('open');modal.style.display='block';modal.setAttribute('aria-hidden','false');load();}
function close(){modal.classList.remove('open');modal.style.display='none';modal.setAttribute('aria-hidden','true');}
window.addEventListener('click',e=>{const tile=e.target.closest?.('[data-ys-service="data"]');if(!tile)return;e.preventDefault();e.stopImmediatePropagation();open();},true);
el('ysDvClose').onclick=close;modal.addEventListener('click',e=>{if(e.target===modal)close();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))close();});
el('ysDvOperator').onchange=()=>{chosen=null;render();};el('ysDvSearch').oninput=()=>{chosen=null;render();};
el('ysDvList').onclick=e=>{const b=e.target.closest('[data-id]');if(!b)return;chosen=rows.find(x=>String(x.id)===b.dataset.id)||null;render();};
el('ysDvSend').onclick=()=>{if(!chosen)return;const phone=el('ysDvPhone').value.replace(/[\s-]/g,'');if(!/^08[0-9]{8,11}$/.test(phone)){alert('Masukkan nomor HP tujuan yang valid (10-13 digit, awalan 08).');return;}const msg=['Halo Yanstore, saya mau pesan paket data.','Operator: '+chosen.provider,'Paket: '+chosen.item_name,'Harga jual tertera: '+fmt(chosen.sale_price),'Nomor tujuan: '+phone,'Mohon konfirmasi stok dan pembayaran sebelum diproses.'].join('\n');window.open('https://wa.me/6285783984748?text='+encodeURIComponent(msg),'_blank','noopener,noreferrer');};
})();
