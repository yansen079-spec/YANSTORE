(()=>{
 const cfg=window.YANSTORE_CHAT_CONFIG||{};
 const root=document.createElement('div');root.id='ys-live-chat';
 root.innerHTML=`<style>#ys-live-chat{position:fixed;right:18px;bottom:18px;z-index:99999;font:14px Arial,sans-serif}#ys-live-chat button{cursor:pointer;border:0;border-radius:12px;padding:12px;background:#16a34a;color:white;font-weight:bold}#ys-chat-panel{display:none;width:min(350px,calc(100vw - 36px));height:420px;background:white;color:#222;border-radius:14px;box-shadow:0 4px 30px #0005;overflow:hidden;flex-direction:column}#ys-chat-panel.open{display:flex}#ys-chat-header{padding:14px;background:#16a34a;color:white;display:flex;justify-content:space-between}#ys-chat-messages{flex:1;overflow:auto;padding:12px}#ys-chat-messages p{padding:8px;background:#eee;border-radius:10px;overflow-wrap:anywhere}#ys-chat-messages p.mine{background:#dcfce7}#ys-chat-form{display:flex;padding:8px;gap:5px}#ys-chat-form input{flex:1;min-width:0;padding:8px}#ys-chat-wa{text-align:center;padding:10px;color:#15803d}</style><button id="ys-chat-toggle">💬 Chat Admin</button><section id="ys-chat-panel"><header id="ys-chat-header"><b>Live Chat YanStore</b><button id="ys-chat-close" aria-label="Tutup">×</button></header><div id="ys-chat-messages" aria-live="polite"></div><small id="ys-chat-status" style="padding:5px"></small><form id="ys-chat-form"><input id="ys-chat-input" maxlength="2000" required placeholder="Tulis pesan..."><button>Kirim</button></form><a id="ys-chat-wa" target="_blank" rel="noopener">Chat lewat WhatsApp ↗</a></section>`;
 document.body.append(root);
 const q=s=>root.querySelector(s),panel=q('#ys-chat-panel'),status=q('#ys-chat-status'),list=q('#ys-chat-messages');
 q('#ys-chat-wa').href='https://wa.me/'+(cfg.whatsappNumber||'6285783984748').replace(/\D/g,'');
 let db,user,thread,timer;
 async function init(){try{
  if(!window.supabase?.createClient)throw Error('SDK Supabase belum dimuat');
  db ||= window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,detectSessionInUrl:false}});
  let {data:{session},error}=await db.auth.getSession();if(error)throw error;
  if(!session){const res=await db.auth.signInAnonymously();if(res.error)throw res.error;session=res.data.session;}
  user=session.user;
  const old=await db.from('yanstore_chat_threads').select('id').eq('customer_id',user.id).eq('status','open').order('created_at',{ascending:false}).limit(1);if(old.error)throw old.error;
  if(old.data.length)thread=old.data[0].id;else{const made=await db.from('yanstore_chat_threads').insert({customer_id:user.id}).select('id').single();if(made.error)throw made.error;thread=made.data.id;}
  await refresh();if(!timer)timer=setInterval(()=>{if(panel.classList.contains('open'))refresh()},4000);
 }catch(e){status.textContent='Live Chat belum tersedia. Silakan gunakan WhatsApp.';console.error('YanStore chat',e)}}
 async function refresh(){if(!thread)return;const r=await db.from('yanstore_chat_messages').select('id,sender_id,body,created_at').eq('thread_id',thread).order('created_at',{ascending:true}).limit(200);if(r.error){status.textContent='Gagal memuat pesan';return}list.replaceChildren();for(const m of r.data){const p=document.createElement('p');p.className=m.sender_id===user.id?'mine':'';p.textContent=m.body;list.append(p)}list.scrollTop=list.scrollHeight;status.textContent='';}
 q('#ys-chat-toggle').onclick=()=>{panel.classList.add('open');q('#ys-chat-toggle').hidden=true;status.textContent='Menghubungkan...';init()};
 q('#ys-chat-close').onclick=()=>{panel.classList.remove('open');q('#ys-chat-toggle').hidden=false};
 q('#ys-chat-form').onsubmit=async e=>{e.preventDefault();if(!thread)return;const input=q('#ys-chat-input'),body=input.value.trim();if(!body)return;const res=await db.from('yanstore_chat_messages').insert({thread_id:thread,sender_id:user.id,body});if(res.error){status.textContent='Pesan gagal dikirim';return}input.value='';await refresh()};
})();
