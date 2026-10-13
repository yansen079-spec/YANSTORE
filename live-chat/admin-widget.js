/* YanStore admin inbox: requires existing authenticated admin session and server-side RLS. */
(()=>{
const cfg=window.YANSTORE_CHAT_CONFIG||{};
if(!cfg.supabaseUrl||!cfg.supabaseAnonKey||!window.supabase?.createClient)return;
const db=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
let active=null,interval=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const panel=()=>document.getElementById('v6AdminPanel')||document.getElementById('v6Admin');
const session=()=>{try{return typeof v6Session!=='undefined'?v6Session:null}catch{return null}};
async function request(path,opts={}){
const s=session();if(!s?.access_token)throw Error('Login Admin terlebih dahulu');
const r=await fetch(cfg.supabaseUrl+'/rest/v1/'+path,{...opts,headers:{apikey:cfg.supabaseAnonKey,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json',...(opts.headers||{})}});
if(!r.ok){const e=await r.json().catch(()=>({}));throw Error(e.message||'HTTP '+r.status)}
return r.status===204?[]:r.json().catch(()=>[]);
}
function mount(){
const p=panel();if(!p||document.getElementById('ys-admin-inbox')||document.getElementById('ys-chat-open-dashboard'))return;
if(!window.YANSTORE_CHAT_STANDALONE){const link=document.createElement('a');link.id='ys-chat-open-dashboard';link.href='live-chat/admin.html';link.target='_blank';link.rel='noopener';link.textContent='💬 Buka Dashboard Live Chat (Tab Baru) ↗';link.style.cssText='display:block;margin:18px 0;padding:16px;background:#166534;color:#fff;border-radius:12px;text-align:center;font-weight:700;text-decoration:none';p.appendChild(link);return;}
const el=document.createElement('section');el.id='ys-admin-inbox';el.style.cssText='margin:18px 0;padding:24px;border:1px solid #35405b;border-radius:14px;background:#111827;color:white;width:100%;min-height:75vh';
el.innerHTML='<h3 style="margin:0 0 10px">💬 Inbox Live Chat</h3><p style="font-size:12px;color:#aeb9ca">Balas pesan pelanggan langsung dari panel admin.</p><button type="button" id="ys-admin-refresh">Muat Percakapan</button><div id="ys-admin-note" role="status" style="padding:10px;font-size:12px"></div><div id="ys-admin-threads" style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0"></div><div id="ys-admin-messages" style="height:55vh;min-height:320px;overflow:auto;padding:10px;background:#0b1220;border-radius:10px"></div><form id="ys-admin-form" style="display:flex;gap:8px;margin-top:10px"><input id="ys-admin-input" placeholder="Tulis balasan..." maxlength="2000" required style="flex:1;min-width:0;padding:10px;color:#111"><button type="submit">Balas</button></form>';
p.appendChild(el);
el.querySelector('#ys-admin-refresh').onclick=load;
el.querySelector('#ys-admin-form').onsubmit=send;
load();
}
const get=id=>document.getElementById(id);
const note=s=>{if(get('ys-admin-note'))get('ys-admin-note').textContent=s};
async function load(){
if(!get('ys-admin-inbox')||!session()?.access_token)return;
try{
const threads=await request('yanstore_chat_threads?select=id,created_at,status&order=created_at.desc&limit=100');
const wrap=get('ys-admin-threads');wrap.replaceChildren();
for(const t of threads){const b=document.createElement('button');b.type='button';b.textContent='Chat '+String(t.id).slice(0,8)+(t.status==='open'?' ●':'');b.style.cssText='padding:7px;border-radius:7px;cursor:pointer';b.onclick=()=>{active=t.id;messages()};wrap.appendChild(b)}
if(!threads.length)note('Belum ada percakapan.');
else{note(threads.length+' percakapan ditemukan.');if(!active||!threads.some(t=>t.id===active))active=threads[0].id;await messages()}
}catch(e){note('Gagal memuat inbox: '+e.message+'. Periksa izin RLS admin di Supabase.')}
}
async function messages(){
if(!active||!get('ys-admin-messages'))return;
try{const data=await request('yanstore_chat_messages?select=id,sender_id,body,created_at&thread_id=eq.'+encodeURIComponent(active)+'&order=created_at.asc&limit=200');
const area=get('ys-admin-messages');area.replaceChildren();
for(const m of data){const div=document.createElement('div');div.style.cssText='padding:8px;margin:5px 0;background:#1e293b;border-radius:8px;white-space:pre-wrap;overflow-wrap:anywhere';div.textContent=m.body;area.appendChild(div)}area.scrollTop=area.scrollHeight;
}catch(e){note('Gagal membaca pesan: '+e.message)}
}
async function send(e){
e.preventDefault();const s=session();const input=get('ys-admin-input');const body=input?.value.trim();if(!active||!body||!s?.user?.id){note('Sesi admin tidak tersedia. Login ulang.');return}
const button=e.currentTarget.querySelector('button');button.disabled=true;
try{await request('yanstore_chat_messages',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({thread_id:active,sender_id:s.user.id,body})});input.value='';await messages();note('Balasan terkirim.')}
catch(err){note('Gagal membalas: '+err.message)}
finally{button.disabled=false}
}
setInterval(()=>{if(session()?.access_token){mount();if(get('ys-admin-inbox')&&panel()?.offsetParent!==null){if(active)messages()}}},4000);
document.addEventListener('click',()=>setTimeout(mount,300));
setTimeout(mount,1200);
})();