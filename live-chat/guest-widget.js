/* YanStore guest chat widget. Load after supabase-js and configure window.YANSTORE_CHAT_CONFIG. */
(() => {
  const cfg = window.YANSTORE_CHAT_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase?.createClient) {
    console.warn('YanStore chat: Supabase config or SDK missing.'); return;
  }
  const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
  });
  const root = document.createElement('section');
  root.id = 'yanstore-live-chat';
  root.setAttribute('aria-label', 'Bantuan YanStore');
  root.innerHTML = `<style>
#yanstore-live-chat{position:fixed;right:18px;bottom:18px;z-index:9999;font:14px system-ui,sans-serif;color:#111827}
#yanstore-live-chat button,#yanstore-live-chat a{font:inherit}
#ys-chat-open{border:0;border-radius:50px;background:#166534;color:white;padding:13px 18px;cursor:pointer;box-shadow:0 4px 20px #0003}
#ys-chat-panel{display:none;width:min(350px,calc(100vw - 36px));height:min(480px,calc(100dvh - 90px));background:white;border:1px solid #ddd;border-radius:15px;box-shadow:0 8px 32px #0003;overflow:hidden;flex-direction:column}
#ys-chat-panel[data-open=true]{display:flex}
#ys-chat-head{background:#166534;color:white;padding:13px;display:flex;justify-content:space-between;align-items:center}
#ys-chat-head button{background:none;border:0;color:white;cursor:pointer;font-size:22px}
#ys-chat-messages{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}
.ys-chat-bubble{max-width:85%;padding:9px 11px;border-radius:12px;background:#f3f4f6;overflow-wrap:anywhere;white-space:pre-wrap}
.ys-chat-mine{align-self:flex-end;background:#dcfce7}
#ys-chat-status{font-size:12px;color:#6b7280;padding:3px 12px}
#ys-chat-hours{font-size:12px;background:#f0fdf4;color:#14532d;padding:9px 12px;border-bottom:1px solid #dcfce7}
#ys-chat-form{display:flex;gap:6px;padding:10px;border-top:1px solid #eee}
#ys-chat-input{flex:1;min-width:0;padding:9px;border:1px solid #ddd;border-radius:8px}
#ys-chat-send{border:0;border-radius:8px;background:#166534;color:white;padding:8px 12px;cursor:pointer}
#ys-chat-wa{display:block;text-align:center;padding:9px;color:#166534;text-decoration:none;border-top:1px solid #eee}
</style>
<button id="ys-chat-open" type="button" aria-expanded="false">💬 Chat Admin</button>
<div id="ys-chat-panel" role="dialog" aria-label="Chat dengan admin" data-open="false">
<div id="ys-chat-head"><strong>Chat Admin YanStore</strong><button id="ys-chat-close" type="button" aria-label="Tutup chat">×</button></div>
<div id="ys-chat-hours" role="status">🕒 Memeriksa jam layanan...</div><div id="ys-chat-messages" aria-live="polite"></div><div id="ys-chat-status"></div>
<form id="ys-chat-form"><input id="ys-chat-input" maxlength="2000" placeholder="Tulis pesan..." aria-label="Pesan" required><button id="ys-chat-send" type="submit">Kirim</button></form>
<a id="ys-chat-wa" target="_blank" rel="noopener noreferrer">Lanjut lewat WhatsApp ↗</a></div>`;
  document.body.append(root);
  const el = id => root.querySelector('#'+id);
  const panel=el('ys-chat-panel'), open=el('ys-chat-open'), status=el('ys-chat-status'), list=el('ys-chat-messages'), input=el('ys-chat-input');
  const wa=(cfg.whatsappNumber||'').replace(/\D/g,'');
  if (wa) el('ys-chat-wa').href='https://wa.me/'+wa;
  else el('ys-chat-wa').hidden=true;
  let user=null,thread=null,timer=null,loading=false;
  // Informational schedule only; it is NOT proof that an admin is online.
  const hours=cfg.serviceHours||{start:9,end:21,timeZone:'Asia/Jakarta'};
  function showHours(){try{const parts=new Intl.DateTimeFormat('en-GB',{timeZone:hours.timeZone||'Asia/Jakarta',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());const h=Number(parts.find(p=>p.type==='hour')?.value),m=Number(parts.find(p=>p.type==='minute')?.value),now=h*60+m;const start=Number(hours.start)*60,end=Number(hours.end)*60;const within=start<=end?now>=start&&now<end:now>=start||now<end;el('ys-chat-hours').textContent=(within?'🟢 Dalam jam layanan':'🌙 Di luar jam layanan')+' · Jadwal '+String(hours.start).padStart(2,'0')+':00–'+String(hours.end).padStart(2,'0')+':00 WIB · Balasan admin menyesuaikan ketersediaan';}catch(e){el('ys-chat-hours').textContent='🕒 Jam layanan mengikuti waktu Indonesia Barat (WIB)';}}
  showHours();setInterval(showHours,60000);
  const say=s=>{status.textContent=s;};
  async function ensureAuth(){
    let {data:{session},error}=await db.auth.getSession();
    if(error) throw error;
    if(!session){const res=await db.auth.signInAnonymously();if(res.error) throw res.error;session=res.data.session;}
    user=session.user;
  }
  async function ensureThread(){
    const r=await db.from('yanstore_chat_threads').select('id').eq('customer_id',user.id).eq('status','open').order('created_at',{ascending:false}).limit(1);
    if(r.error) throw r.error;
    if(r.data.length){thread=r.data[0].id;return;}
    const n=await db.from('yanstore_chat_threads').insert({customer_id:user.id}).select('id').single();
    if(n.error) throw n.error;thread=n.data.id;
  }
  async function refresh(){
    if(!thread||loading)return;
    loading=true;
    try {
      const r=await db.from('yanstore_chat_messages').select('id,sender_id,body,created_at').eq('thread_id',thread).order('created_at',{ascending:true}).limit(200);
      if(r.error)throw r.error;
      const last=list.lastElementChild?.dataset?.id;
      if(last===r.data.at(-1)?.id && list.children.length===r.data.length)return;
      list.replaceChildren();
      for(const msg of r.data){
        const b=document.createElement('div');
        b.className='ys-chat-bubble'+(msg.sender_id===user.id?' ys-chat-mine':'');
        b.dataset.id=msg.id;b.textContent=msg.body;list.append(b);
      }
      list.scrollTop=list.scrollHeight;say('');
    }catch(e){say('Gagal memuat pesan. Coba lagi.');console.error(e);}
    finally{loading=false;}
  }
  async function start(){
    say('Menghubungkan...');
    try{await ensureAuth();await ensureThread();await refresh();if(!timer)timer=setInterval(()=>{if(panel.dataset.open==='true')refresh();},4000);}
    catch(e){say('Chat belum tersedia. Silakan gunakan WhatsApp.');console.error(e);}
  }
  open.addEventListener('click',()=>{panel.dataset.open='true';open.hidden=true;open.setAttribute('aria-expanded','true');start();});
  el('ys-chat-close').addEventListener('click',()=>{panel.dataset.open='false';open.hidden=false;open.setAttribute('aria-expanded','false');});
  el('ys-chat-form').addEventListener('submit',async e=>{
    e.preventDefault();const body=input.value.trim();if(!body||!thread||!user)return;
    const btn=el('ys-chat-send');btn.disabled=true;
    try{const r=await db.from('yanstore_chat_messages').insert({thread_id:thread,sender_id:user.id,body});if(r.error)throw r.error;input.value='';await refresh();}
    catch(err){say('Pesan gagal dikirim. Coba lagi.');console.error(err);}
    finally{btn.disabled=false;}
  });
})();
