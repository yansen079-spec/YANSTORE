(function(){
'use strict';
const url="https://ivnohbhlahevaihunmbp.supabase.co/rest/v1/rpc/yanstore_public_prices",key="sb_publishable_uyzGj6RZJfhDdGqf2rAldg_NRQTNEZH";
const wallets=['DANA','OVO','GoPay','ShopeePay','LinkAja'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>'Rp '+Number(n).toLocaleString('id-ID');
const style=document.createElement('style');
style.textContent='#ysEWalletLive{position:fixed;inset:0;z-index:120020;background:#050714ef;color:#f3efff;overflow:auto;display:none;padding:18px;box-sizing:border-box}#ysEWalletLive.open{display:block}#ysEWalletLive .shell{max-width:950px;margin:25px auto;background:#11182c;border:1px solid #8464bb;border-radius:19px;padding:22px}#ysEWalletLive .head{display:flex;justify-content:space-between;align-items:center;gap:10px}#ysEWalletLive h2{margin:0}#ysEWalletLive label{display:block;font-size:13px;margin:14px 0;color:#d8cdf5}#ysEWalletLive select,#ysEWalletLive input{display:block;width:100%;box-sizing:border-box;padding:13px;margin-top:6px;background:#0b1223;border:1px solid #495c85;border-radius:10px;color:white}#ysEWalletLive button{cursor:pointer;border-radius:10px;padding:12px;border:1px solid #7464a1;background:#242e4c;color:white;font-weight:700}#ysEWalletLive .list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:15px 0}#ysEWalletLive .item{text-align:left;background:#1b2540;border:1px solid #344565}#ysEWalletLive .item.sel{border-color:#c69aff;background:#30264c}#ysEWalletLive .item small{display:block;color:#b9c7df;margin-top:8px}#ysEWalletLive .muted{color:#adbad6;font-size:12px}#ysEWalletLive .summary{padding:14px;border:1px solid #584e83;border-radius:12px;margin:12px 0}#ysEWalletLive .go{width:100%;background:#0eae78;border:0}#ysEWalletLive .go:disabled{opacity:.45;cursor:not-allowed}@media(max-width:650px){#ysEWalletLive .list{grid-template-columns:1fr}}';
document.head.appendChild(style);
const root=document.createElement('div');root.id='ysEWalletLive';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-hidden','true');root.setAttribute('aria-label','Top Up E-Wallet Yanstore');
root.innerHTML='<div class="shell"><div class="head"><h2>👛 Top Up E-Wallet</h2><button id="ysEwClose" type="button">✕ Tutup</button></div><p class="muted">Nominal aktif dan harga jual langsung dari Price Manager. Pesanan dikonfirmasi admin melalui WhatsApp.</p><label>Dompet digital<select id="ysEwWallet">'+wallets.map(w=>'<option>'+esc(w)+'</option>').join('')+'</select></label><label>Cari nominal<input id="ysEwSearch" placeholder="Cari nominal top up"></label><div id="ysEwList" class="list"></div><label>Nomor akun tujuan<input id="ysEwNumber" type="tel" inputmode="numeric" autocomplete="tel" placeholder="08xxxxxxxxxx" maxlength="16"></label><div class="summary" id="ysEwSummary">Pilih nominal yang tersedia.</div><button id="ysEwSend" class="go" type="button" disabled>💬 Tanya & Pesan via WhatsApp</button><p class="muted">Tidak ada pembayaran atau pengiriman otomatis. Pastikan nomor tujuan, harga akhir, dan ketersediaan dikonfirmasi admin.</p></div>';
document.body.appendChild(root);
const el=id=>document.getElementById(id);let rows=[],chosen=null,seq=0;
function render(){
 const wallet=el('ysEwWallet').value.toLowerCase(),q=el('ysEwSearch').value.toLowerCase().trim();
 const visible=rows.filter(p=>String(p.provider||'').trim().toLowerCase()===wallet&&String(p.item_name||'').toLowerCase().includes(q));
 el('ysEwList').innerHTML=visible.length?visible.map(p=>'<button type="button" class="item '+(chosen&&String(chosen.id)===String(p.id)?'sel':'')+'" data-id="'+esc(p.id)+'"><strong>'+esc(p.item_name)+'</strong><small>Harga jual: '+fmt(p.sale_price)+'</small></button>').join(''):'<p class="muted">Belum ada produk aktif untuk dompet ini. Tambahkan dan aktifkan melalui Price Manager E-Wallet.</p>';
 el('ysEwSummary').textContent=chosen?'Produk: '+chosen.item_name+' — Harga jual: '+fmt(chosen.sale_price):'Pilih nominal yang tersedia.';
 el('ysEwSend').disabled=!chosen;
}
async function load(){
 const n=++seq;rows=[];chosen=null;el('ysEwSearch').value='';el('ysEwList').innerHTML='<p class="muted">Memuat produk E-Wallet...</p>';el('ysEwSummary').textContent='Pilih nominal yang tersedia.';el('ysEwSend').disabled=true;
 try{const r=await fetch(url,{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:'{}'});if(!r.ok)throw Error('HTTP '+r.status);const data=await r.json();if(n!==seq)return;rows=Array.isArray(data)?data.filter(p=>String(p.service||'').toLowerCase()==='ewallet'):[];render();}
 catch(e){if(n===seq)el('ysEwList').innerHTML='<p class="muted">Harga belum dapat dimuat. Tutup lalu buka kembali untuk mencoba lagi.</p>';}
}
function open(){root.classList.add('open');root.setAttribute('aria-hidden','false');load();}
function close(){root.classList.remove('open');root.setAttribute('aria-hidden','true');seq++;}
window.addEventListener('click',e=>{const tile=e.target.closest?.('[data-ys-service="ewallet"]');if(!tile)return;e.preventDefault();e.stopImmediatePropagation();open();},true);
el('ysEwClose').onclick=close;root.addEventListener('click',e=>{if(e.target===root)close();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&root.classList.contains('open'))close();});
el('ysEwWallet').onchange=()=>{chosen=null;render();};el('ysEwSearch').oninput=()=>{chosen=null;render();};
el('ysEwList').onclick=e=>{const b=e.target.closest('[data-id]');if(!b)return;chosen=rows.find(p=>String(p.id)===b.dataset.id)||null;render();};
el('ysEwSend').onclick=()=>{if(!chosen)return;const number=el('ysEwNumber').value.replace(/[\s-]/g,'');if(!/^08\d{8,11}$/.test(number)){alert('Masukkan nomor akun e-wallet valid (10–13 digit, awalan 08).');return;}const msg=['Halo Yanstore, saya mau top up E-Wallet.','Dompet digital: '+chosen.provider,'Produk: '+chosen.item_name,'Harga jual tertera: '+fmt(chosen.sale_price),'Nomor tujuan: '+number,'Mohon konfirmasi ketersediaan dan pembayaran sebelum diproses.'].join('\n');window.open('https://wa.me/6285783984748?text='+encodeURIComponent(msg),'_blank','noopener,noreferrer');};
})();