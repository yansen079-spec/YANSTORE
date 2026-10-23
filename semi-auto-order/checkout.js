(()=>{'use strict';const $=id=>document.getElementById(id);let items=[];try{items=JSON.parse(sessionStorage.getItem('yanstore_manual_checkout')||'[]')}catch{}if(!Array.isArray(items)||!items.length){$('items').textContent='Keranjang kosong. Kembali ke toko dan pilih produk.';$('form').hidden=true;return}const money=n=>'Rp'+Number(n).toLocaleString('id-ID');const total=items.reduce((a,x)=>a+Number(x.price||0),0);$('items').textContent=items.map(x=>x.product+' — '+x.package+' ('+money(x.price)+')').join('\n');$('items').style.whiteSpace='pre-line';$('total').textContent='Estimasi: '+money(total);$('form').onsubmit=async e=>{e.preventDefault();const btn=e.currentTarget.querySelector('button');btn.disabled=true;$('message').textContent='Menyimpan pesanan...';try{const cfg=window.YANSTORE_CHAT_CONFIG||{supabaseUrl:'https://ivnohbhlahevaihunmbp.supabase.co',supabaseAnonKey:'sb_publishable_uyzGj6RZJfhDdGqf2rAldg_NRQTNEZH'};if(!window.supabase?.createClient)throw Error('Koneksi belum siap');const db=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});let {data:{session}}=await db.auth.getSession();if(!session){const a=await db.auth.signInAnonymously();if(a.error)throw a.error;session=a.data.session}if(!session)throw Error('Sesi pelanggan tidak tersedia');const contact=new FormData(e.currentTarget).get('contact');const {data,error}=await db.rpc('yanstore_submit_manual_order',{p_contact:contact,p_items:items,p_total:total});if(error)throw error;const code=data?.[0]?.code;if(!code)throw Error('Nomor pesanan tidak diterima');$('form').hidden=true;$('message').textContent='Pesanan tercatat. Pembayaran belum terverifikasi.';const result=$('result');result.hidden=false;const h=document.createElement('h2');h.textContent='Nomor Pesanan: '+code;const pay=document.createElement('div');pay.style.cssText='text-align:center';
const title=document.createElement('h3');title.textContent='💳 Pembayaran QRIS YanStore';
const due=document.createElement('div');due.style.cssText='font-size:24px;font-weight:800;margin:10px 0;color:#86efac';due.textContent='Bayar tepat: '+money(total);
const warn=document.createElement('p');warn.className='muted';warn.textContent='QRIS ini statis. Setelah scan, masukkan nominal persis seperti di atas agar admin mudah memverifikasi.';
const qr=document.createElement('div');qr.style.cssText='display:flex;justify-content:center;background:#fff;padding:14px;border-radius:14px;width:max-content;max-width:100%;margin:14px auto';
pay.append(title,due,warn,qr);
result.append(h,pay);
const payload='00020101021126570011ID.DANA.WWW011893600915300088578102090008857810303UMI51440014ID.CO.QRIS.WWW0215ID10264864302870303UMI5204654053033605802ID5908YANSTORE6015Kota Jakarta Ti6105137906304B24F';
if(window.QRCode){new QRCode(qr,{text:payload,width:260,height:260,colorDark:'#000000',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M})}else{qr.textContent='QRIS gagal dimuat. Refresh halaman atau hubungi admin.'}
const steps=document.createElement('p');steps.style.cssText='line-height:1.6;text-align:left';steps.textContent='1. Scan QRIS.  2. Masukkan nominal '+money(total)+'.  3. Selesaikan pembayaran.  4. Kirim bukti ke admin.';
const a=document.createElement('a');a.href='https://wa.me/6285783984748?text='+encodeURIComponent('Halo Admin YanStore, saya sudah bayar pesanan '+code+' sebesar '+money(total)+'. Saya akan kirim bukti pembayarannya di sini.');a.target='_blank';a.rel='noopener';a.style.cssText='display:block;text-align:center;background:#15803d;color:white;text-decoration:none;padding:13px;border-radius:9px;margin-top:14px;font-weight:700';a.textContent='✅ SAYA SUDAH BAYAR — KIRIM BUKTI';
result.append(steps,a);
const statusBox=document.createElement('div');statusBox.style.cssText='margin-top:14px;padding:12px;border:1px solid #334155;border-radius:10px;text-align:center;color:#cbd5e1';statusBox.textContent='Menunggu verifikasi pembayaran dari admin...';result.append(statusBox);
let stopped=false;
const showSuccess=state=>{
  if(stopped)return;stopped=true;
  pay.innerHTML='';
  const ok=document.createElement('div');ok.style.cssText='padding:28px 10px;text-align:center';
  const icon=document.createElement('div');icon.style.cssText='font-size:54px;margin-bottom:8px';icon.textContent='✅';
  const t=document.createElement('h2');t.style.cssText='margin:0 0 8px;color:#86efac';t.textContent=state==='fulfilled'?'Pesanan Selesai':'Pembayaran Berhasil';
  const d=document.createElement('p');d.style.cssText='margin:0;color:#cbd5e1';d.textContent=state==='fulfilled'?'Produk sudah diproses.':'Pembayaran sudah diverifikasi admin. Pesanan kamu sedang diproses.';
  ok.append(icon,t,d);pay.append(ok);steps.remove();a.remove();statusBox.textContent='Status: '+(state==='fulfilled'?'SELESAI':'PAID / DIPROSES');statusBox.style.color='#86efac';statusBox.style.borderColor='#166534';
};
const checkStatus=async()=>{
  if(stopped)return;
  try{
    const {data:sd,error:se}=await db.rpc('yanstore_customer_order_status',{p_checkout_code:code,p_contact:contact});
    if(se)return;
    const st=Array.isArray(sd)?sd[0]?.state:null;
    if(st==='approved'||st==='fulfilled')showSuccess(st);
    else if(st==='canceled'){stopped=true;pay.innerHTML='<div style="padding:26px 10px;text-align:center"><div style="font-size:48px">❌</div><h2 style="color:#fca5a5">Pesanan Dibatalkan</h2><p style="color:#cbd5e1">Hubungi admin jika kamu merasa sudah melakukan pembayaran.</p></div>';steps.remove();a.remove();statusBox.textContent='Status: DIBATALKAN';statusBox.style.color='#fca5a5';}
  }catch{}
};
checkStatus();const poll=setInterval(()=>{if(stopped){clearInterval(poll);return}checkStatus()},4000);
sessionStorage.removeItem('yanstore_manual_checkout')}catch(err){$('message').textContent='Belum berhasil membuat pesanan: '+err.message+'. Pastikan SQL setup sudah dijalankan.'}finally{btn.disabled=false}}})();