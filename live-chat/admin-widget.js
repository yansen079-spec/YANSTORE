/* YanStore admin inbox: requires existing authenticated admin session and server-side RLS. */
(()=>{
const cfg=window.YANSTORE_CHAT_CONFIG||{};
if(!cfg.supabaseUrl||!cfg.supabaseAnonKey||!window.supabase?.createClient)return;
const db=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
let active=null,activeStatus='open',interval=null,refreshing=false,seen=new Set(),initialized=false,unread=new Map(),soundOn=false,audio=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const panel=()=>document.getElementById('v6AdminPanel')||document.getElementById('v6Admin');
const session=()=>{try{return typeof v6Session!=='undefined'?v6Session:null}catch{return null}};
let tokenRefresh=null;
async function validSession(force=false){
 const s=session();
 if(!s?.access_token)throw Error('Login Admin terlebih dahulu');
 const expires=s.expires_at||0;
 if(!force&&(!expires||expires>Date.now()/1000+60))return s;
 if(!s.refresh_token)throw Error('Sesi admin kedaluwarsa. Login ulang di halaman utama YanStore.');
 if(!tokenRefresh)tokenRefresh=(async()=>{
  const {data,error}=await db.auth.refreshSession({refresh_token:s.refresh_token});
  if(error||!data?.session)throw Error('Sesi admin kedaluwarsa. Login ulang di halaman utama YanStore.');
  const updated={...s,...data.session,user:data.user||data.session.user||s.user};
  try{v6Session=updated;localStorage.setItem('yanstore_v6_session',JSON.stringify(updated))}catch(e){}
  return updated;
 })().finally(()=>{tokenRefresh=null});
 return tokenRefresh;
}
async function request(path,opts={}){
const s=await validSession();
let r=await fetch(cfg.supabaseUrl+'/rest/v1/'+path,{...opts,headers:{apikey:cfg.supabaseAnonKey,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json',...(opts.headers||{})}});
if(r.status===401){const fresh=await validSession(true);r=await fetch(cfg.supabaseUrl+'/rest/v1/'+path,{...opts,headers:{apikey:cfg.supabaseAnonKey,Authorization:'Bearer '+fresh.access_token,'Content-Type':'application/json',...(opts.headers||{})}})}
if(!r.ok){const e=await r.json().catch(()=>({}));throw Error(e.message||'HTTP '+r.status)}
return r.status===204?[]:r.json().catch(()=>[]);
}
function mount(){
const p=panel();if(!p||document.getElementById('ys-admin-inbox')||document.getElementById('ys-chat-open-dashboard'))return;
if(!window.YANSTORE_CHAT_STANDALONE){const link=document.createElement('a');link.id='ys-chat-open-dashboard';link.href='live-chat/admin.html';link.target='_blank';link.rel='noopener';link.textContent='💬 Buka Dashboard Live Chat (Tab Baru) ↗';link.style.cssText='display:block;margin:18px 0;padding:16px;background:#166534;color:#fff;border-radius:12px;text-align:center;font-weight:700;text-decoration:none';p.appendChild(link);return;}
const el=document.createElement('section');el.id='ys-admin-inbox';el.style.cssText='margin:18px 0;padding:24px;border:1px solid #35405b;border-radius:14px;background:#111827;color:white;width:100%;min-height:75vh';
el.innerHTML='<h3 style="margin:0 0 10px">💬 Inbox Live Chat</h3><p style="font-size:12px;color:#aeb9ca">Balas pesan pelanggan langsung dari panel admin.</p><button type="button" id="ys-admin-refresh">Muat Percakapan</button><div id="ys-admin-note" role="status" style="padding:10px;font-size:12px"></div><div id="ys-admin-threads" style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0"></div><div id="ys-thread-actions" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:10px 0"><span id="ys-thread-status">Pilih percakapan</span><button type="button" id="ys-thread-toggle">Tutup Percakapan</button></div><div id="ys-admin-messages" style="height:55vh;min-height:320px;overflow:auto;padding:10px;background:#0b1220;border-radius:10px"></div><form id="ys-admin-form" style="display:flex;gap:8px;margin-top:10px"><input id="ys-admin-input" placeholder="Tulis balasan..." maxlength="2000" required style="flex:1;min-width:0;padding:10px;color:#111"><button type="submit">Balas</button></form>';
p.appendChild(el);
const controls=document.createElement('div');controls.style.cssText='display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:10px 0';controls.innerHTML='<button type="button" id="ys-notify-enable">🔔 Aktifkan Suara & Notifikasi</button><span id="ys-unread-count" aria-live="polite">Belum ada pesan baru</span>';el.querySelector('#ys-admin-refresh').after(controls);get('ys-notify-enable').onclick=enableNotifications;
const presence=document.createElement('p');presence.id='ys-admin-presence';presence.style.cssText='font-size:13px;color:#bbf7d0;margin:8px 0';presence.textContent='⚪ Status online belum terhubung · Jam layanan 09.00–21.00 WIB';el.querySelector('#ys-admin-refresh').before(presence);
el.querySelector('#ys-admin-refresh').onclick=load;
el.querySelector('#ys-admin-form').onsubmit=send;
el.querySelector('#ys-thread-toggle').onclick=toggleThread;
syncNames().then(load);heartbeat();setInterval(heartbeat,30000);document.addEventListener('visibilitychange',heartbeat);
}
const get=id=>document.getElementById(id);
const clock=v=>{try{return new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(v))+' WIB'}catch{return ''}};
const nickKey='yanstore_chat_nicknames';
const names=(()=>{try{return JSON.parse(localStorage.getItem(nickKey)||'{}')}catch{return {}}})();
let namesAvailable=false;
async function syncNames(){try{const rows=await request('yanstore_chat_customer_names?select=customer_id,nickname&limit=500');namesAvailable=true;for(const row of rows){if(!names[row.customer_id])names[row.customer_id]=row.nickname}for(const [id,nickname] of Object.entries(names)){if(!rows.some(r=>r.customer_id===id)&&nickname){await request('yanstore_chat_customer_names',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({customer_id:id,nickname})}).catch(()=>{})}}localStorage.setItem(nickKey,JSON.stringify(names))}catch(e){namesAvailable=false;console.warn('Customer nickname sync unavailable; using local names',e.message)}}
const note=s=>{if(get('ys-admin-note'))get('ys-admin-note').textContent=s};
const badge=()=>{const n=[...unread.values()].reduce((a,b)=>a+b,0);if(get('ys-unread-count'))get('ys-unread-count').textContent=n?'🔴 '+n+' pesan pelanggan baru':'Tidak ada pesan baru';if(window.YANSTORE_CHAT_STANDALONE)document.title=(n?'('+n+') ':'')+'YanStore | Dashboard Live Chat';};
function beep(){if(!soundOn)return;try{const ctx=audio||(audio=new (window.AudioContext||window.webkitAudioContext)());if(ctx.state==='suspended')ctx.resume();const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=850;g.gain.setValueAtTime(.07,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.18);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.18)}catch(e){console.warn('Sound unavailable',e)}}
async function enableNotifications(){soundOn=true;const btn=get('ys-notify-enable');if(btn)btn.textContent='🔔 Suara aktif';if('Notification' in window&&Notification.permission==='default'){const p=await Notification.requestPermission();if(btn)btn.textContent=p==='granted'?'🔔 Suara & notifikasi aktif':'🔔 Suara aktif (notifikasi browser tidak diizinkan)'}else if('Notification' in window&&Notification.permission==='granted'&&btn)btn.textContent='🔔 Suara & notifikasi aktif';beep()}
async function checkIncoming(threads){if(!threads.length)return;try{const ids=threads.map(t=>t.id);const rows=await request('yanstore_chat_messages?select=id,thread_id,sender_id,created_at&thread_id=in.('+ids.join(',')+')&order=created_at.desc&limit=500');const customerIds=new Map(threads.map(t=>[t.id,t.customer_id]));let fresh=0;const latest=new Map();for(const m of rows){if(!latest.has(m.thread_id))latest.set(m.thread_id,m)}for(const t of threads){const last=latest.get(t.id);t.needsReply=!!last&&last.sender_id===t.customer_id}for(const m of rows){if(m.sender_id!==customerIds.get(m.thread_id))continue;if(!seen.has(m.id)){if(initialized){unread.set(m.thread_id,(unread.get(m.thread_id)||0)+1);fresh++}seen.add(m.id)}}if(fresh){beep();if('Notification' in window&&Notification.permission==='granted'&&document.hidden){try{const n=new Notification('YanStore: '+fresh+' pesan baru',{body:'Ada pesan pelanggan masuk di Live Chat.'});n.onclick=()=>{window.focus();n.close()}}catch(e){}}}initialized=true;badge()}catch(e){console.warn('YanStore notification check failed',e)}};
async function heartbeat(){if(!window.YANSTORE_CHAT_STANDALONE||document.visibilityState!=='visible'||!session()?.access_token)return;const label=get('ys-admin-presence');try{const s=await validSession();const r=await fetch(cfg.supabaseUrl+'/rest/v1/rpc/yanstore_chat_heartbeat',{method:'POST',headers:{apikey:cfg.supabaseAnonKey,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'},body:'{}'});if(!r.ok||await r.json()!==true)throw Error('heartbeat unavailable');if(label)label.textContent='🟢 Admin online (dashboard aktif) · Jam layanan 09.00–21.00 WIB'}catch(e){if(label)label.textContent='⚪ Status online gagal: '+e.message}}
async function load(){
if(refreshing||!get('ys-admin-inbox')||!session()?.access_token)return;
refreshing=true;
try{
const threads=await request('yanstore_chat_threads?select=id,customer_id,created_at,status&order=created_at.desc&limit=100');
const wrap=get('ys-admin-threads');wrap.replaceChildren();
for(const t of threads){const b=document.createElement('button');b.type='button';b.dataset.thread=t.id;b.textContent=(t.needsReply?'🟠 ':'')+(names[t.customer_id]||'Pelanggan '+String(t.customer_id).slice(0,8))+(t.status==='open'?' ●':'')+(unread.get(t.id)?' 🔴 '+unread.get(t.id):'');b.style.cssText='padding:7px;border-radius:7px;cursor:pointer';b.ondblclick=()=>{const n=prompt('Nama panggilan pelanggan (disimpan di browser admin ini):',names[t.customer_id]||'');if(n===null)return;if(n.trim())names[t.customer_id]=n.trim().slice(0,40);else delete names[t.customer_id];localStorage.setItem(nickKey,JSON.stringify(names));if(namesAvailable&&names[t.customer_id])request('yanstore_chat_customer_names',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({customer_id:t.customer_id,nickname:names[t.customer_id]})}).catch(e=>note('Nama tersimpan di browser, gagal sinkron ke database: '+e.message));b.textContent=(t.needsReply?'🟠 ':'')+(names[t.customer_id]||'Pelanggan '+String(t.customer_id).slice(0,8))+(t.status==='open'?' ●':'')+(unread.get(t.id)?' 🔴 '+unread.get(t.id):'');load()};b.title='Klik untuk buka chat · klik dua kali untuk ubah nama';b.onclick=()=>{active=t.id;activeStatus=t.status;unread.delete(t.id);badge();updateThreadControls();messages()};wrap.appendChild(b)}
if(!threads.length)note('Tidak ada percakapan yang dapat dibaca oleh akun ini. Jika pelanggan sudah mengirim pesan, periksa kebijakan RLS dan hak akses admin di Supabase.');
else{note(threads.length+' percakapan ditemukan.');if(!active||!threads.some(t=>t.id===active))active=threads[0].id;activeStatus=threads.find(t=>t.id===active).status;updateThreadControls();await messages()}
await checkIncoming(threads);for(const t of threads){const b=[...wrap.children].find(b=>b.dataset.thread===t.id);if(b)b.textContent=(t.needsReply?'🟠 ':'')+(names[t.customer_id]||'Pelanggan '+String(t.customer_id).slice(0,8))+(t.status==='open'?' ●':'')+(unread.get(t.id)?' 🔴 '+unread.get(t.id):'')}
}catch(e){note('Gagal memuat inbox: '+e.message+'. Periksa izin RLS admin di Supabase.')}
finally{refreshing=false}
}
function updateThreadControls(){const st=get('ys-thread-status'),btn=get('ys-thread-toggle'),input=get('ys-admin-input'),sendBtn=get('ys-admin-form')?.querySelector('button');if(st)st.textContent=active?'Status: '+(activeStatus==='open'?'🟢 Terbuka':'⚪ Ditutup'):'Pilih percakapan';if(btn){btn.disabled=!active;btn.textContent=activeStatus==='open'?'✓ Tutup Percakapan':'↻ Buka Kembali'}if(input)input.disabled=activeStatus!=='open';if(sendBtn)sendBtn.disabled=activeStatus!=='open'}
async function toggleThread(){if(!active)return;const next=activeStatus==='open'?'closed':'open';try{await request('yanstore_chat_threads?id=eq.'+encodeURIComponent(active),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:next})});activeStatus=next;updateThreadControls();note(next==='closed'?'Percakapan ditutup. Bisa dibuka kembali.':'Percakapan dibuka kembali.');await load()}catch(e){note('Gagal mengubah status: '+e.message)}}
async function messages(){
if(!active||!get('ys-admin-messages'))return;
try{const data=await request('yanstore_chat_messages?select=id,sender_id,body,created_at&thread_id=eq.'+encodeURIComponent(active)+'&order=created_at.asc&limit=200');
const area=get('ys-admin-messages');area.replaceChildren();
for(const m of data){const mine=m.sender_id===session()?.user?.id;const div=document.createElement('div');div.style.cssText='padding:10px 13px;margin:7px 0;border-radius:12px;white-space:pre-wrap;overflow-wrap:anywhere;max-width:82%;width:fit-content;'+(mine?'margin-left:auto;background:#166534;color:#fff;border-bottom-right-radius:4px;':'margin-right:auto;background:#1e293b;color:#fff;border-bottom-left-radius:4px;');div.textContent=m.body;const stamp=document.createElement('small');stamp.style.cssText='display:block;opacity:.7;font-size:10px;margin-top:5px;text-align:right';stamp.textContent=clock(m.created_at);div.appendChild(stamp);area.appendChild(div)}area.scrollTop=area.scrollHeight;
}catch(e){note('Gagal membaca pesan: '+e.message)}
}
async function send(e){
e.preventDefault();const s=session();const input=get('ys-admin-input');const body=input?.value.trim();if(!active||activeStatus!=='open'||!body||!s?.user?.id){note('Sesi admin tidak tersedia. Login ulang.');return}
const button=e.currentTarget.querySelector('button');button.disabled=true;
try{await request('yanstore_chat_messages',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({thread_id:active,sender_id:s.user.id,body})});input.value='';await messages();note('Balasan terkirim.')}
catch(err){note('Gagal membalas: '+err.message)}
finally{button.disabled=false}
}
setInterval(()=>{if(session()?.access_token){mount();if(get('ys-admin-inbox')&&panel()?.offsetParent!==null){load()}}},4000);
document.addEventListener('click',()=>setTimeout(mount,300));
setTimeout(mount,1200);
})();