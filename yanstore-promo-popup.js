/* YANSTORE Promo Popup V1. Edit slides below; optional image: relative asset URL. */
(() => {
 const slides = [
  {title:'Premium lebih hemat',desc:'Temukan aplikasi premium favoritmu.',tag:'YANSTORE • PREMIUM APPS',icons:['N','♫','▶'],color:'#166534',href:'#produk',cta:'Lihat katalog'},
  {title:'Hiburan tanpa batas',desc:'Jelajahi pilihan aplikasi streaming dan musik.',tag:'STREAMING & MUSIC',icons:['▶','♫','N'],color:'#164e63',href:'#produk',cta:'Jelajahi produk'},
  {title:'Kreativitas tanpa batas',desc:'Temukan aplikasi editing dan AI untuk kebutuhanmu.',tag:'EDITING & AI',icons:['✦','AI','✎'],color:'#4338ca',href:'#produk',cta:'Lihat pilihan'}
 ];
 const key='ys-promo-v1-dismissed';
 try {if(sessionStorage.getItem(key)) return;} catch(e){}
 if(!slides.length || !window.HTMLDialogElement) return;
 const style=document.createElement('style');
 style.textContent=`
 #ysPromoV1{border:0;padding:0;background:transparent;color:white;width:min(440px,calc(100vw - 32px),calc((100dvh - 84px)*.8));max-width:none;max-height:calc(100dvh - 24px);overflow:visible;font-family:inherit}
 #ysPromoV1::backdrop{background:rgba(0,0,0,.65)}
 #ysPromoV1 .ys-promo-panel{position:relative;aspect-ratio:4/5;border-radius:18px;overflow:hidden;isolation:isolate}
 #ysPromoV1 .ys-promo-link{box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(8px,2vw,18px);height:100%;width:100%;padding:14%;text-align:center;color:white;text-decoration:none;background:radial-gradient(circle at 50% 40%,rgba(255,255,255,.18),transparent 65%);line-height:1.15}
 #ysPromoV1 .ys-promo-link strong{font-size:clamp(22px,6vw,42px);letter-spacing:-.04em;text-transform:uppercase}
 #ysPromoV1 .ys-promo-link small{font-size:clamp(10px,2.5vw,13px);font-weight:800;letter-spacing:.12em}
 #ysPromoV1 .ys-promo-link span{font-size:clamp(12px,3vw,17px)}
 #ysPromoV1 .ys-promo-icons{display:flex;gap:8px}
 #ysPromoV1 .ys-promo-icons b{display:grid;place-items:center;width:clamp(30px,10vw,64px);aspect-ratio:1;border-radius:12px;background:rgba(255,255,255,.16);font-size:clamp(18px,5vw,30px)}
 #ysPromoV1 .ys-promo-cta{background:#fff;color:#173b28;padding:10px 18px;border-radius:10px;font-weight:800}
 #ysPromoV1 button{cursor:pointer;border:0;color:white;background:transparent;font:inherit;min-width:36px;min-height:36px;padding:0}
 #ysPromoV1 .ys-promo-close{position:absolute;z-index:2;right:9px;top:9px;background:white;color:#222;border-radius:50%;font-size:25px;line-height:1}
 #ysPromoV1 .ys-promo-nav{display:flex;align-items:center;justify-content:center;gap:3px;margin-top:8px}
 #ysPromoV1 .ys-promo-nav button{font-size:22px}
 #ysPromoV1 .ys-promo-dots{display:flex}
 #ysPromoV1 .ys-promo-dot::before{content:'';display:block;width:8px;height:8px;border-radius:50%;background:#aaa;margin:auto}
 #ysPromoV1 .ys-promo-dot[aria-current=true]::before{background:white}
 #ysPromoV1 button:focus-visible,#ysPromoV1 a:focus-visible{outline:3px solid #facc15;outline-offset:-4px}
 #ysPromoV1 .ys-promo-image{width:100%;height:100%;object-fit:cover;position:absolute;inset:0}
 @media(prefers-reduced-motion:reduce){#ysPromoV1 *{animation:none!important;transition:none!important}}
 `;
 document.head.append(style);
 const dialog=document.createElement('dialog');dialog.id='ysPromoV1';dialog.setAttribute('aria-label','Promosi YANSTORE');
 dialog.innerHTML='<div class="ys-promo-panel"><a class="ys-promo-link"></a><button class="ys-promo-close" aria-label="Tutup promosi" autofocus>×</button></div><div class="ys-promo-nav"><button class="ys-promo-prev" aria-label="Banner sebelumnya">‹</button><div class="ys-promo-dots"></div><button class="ys-promo-next" aria-label="Banner berikutnya">›</button><button class="ys-promo-pause" aria-label="Jeda slider">Ⅱ</button></div>';
 document.body.append(dialog);
 const q=s=>dialog.querySelector(s),link=q('.ys-promo-link'),dots=q('.ys-promo-dots'),panel=q('.ys-promo-panel'),pause=q('.ys-promo-pause');
 let i=0,timer,paused=window.matchMedia('(prefers-reduced-motion: reduce)').matches,previousFocus;
 function render(n){i=(n+slides.length)%slides.length;const s=slides[i];panel.style.background=s.color;link.href=s.href;link.setAttribute('aria-label',s.title+' — '+s.cta);link.replaceChildren();
  if(s.image){const img=document.createElement('img');img.className='ys-promo-image';img.src=s.image;img.alt=s.title;link.append(img);img.addEventListener('error',()=>{delete s.image;render(i)},{once:true});}
  else {for(const [tag,value,cls] of [['small',s.tag,''],['strong',s.title,''],['div','','ys-promo-icons'],['span',s.desc,''],['span',s.cta,'ys-promo-cta']]){const el=document.createElement(tag);el.className=cls;el.textContent=value;if(cls==='ys-promo-icons')for(const icon of s.icons){const b=document.createElement('b');b.textContent=icon;el.append(b);}link.append(el);}}
  [...dots.children].forEach((d,j)=>d.setAttribute('aria-current',String(i===j)));
 }
 function stop(){clearInterval(timer);}
 function start(){stop();if(dialog.open&&!paused&&!document.hidden&&slides.length>1)timer=setInterval(()=>render(i+1),5000);}
 function manual(n){render(n);start();}
 function dismiss(){try{sessionStorage.setItem(key,'1')}catch(e){} if(dialog.open)dialog.close();}
 slides.forEach((s,j)=>{const b=document.createElement('button');b.className='ys-promo-dot';b.setAttribute('aria-label','Banner '+(j+1));b.onclick=()=>manual(j);dots.append(b);});
 q('.ys-promo-close').onclick=dismiss;q('.ys-promo-prev').onclick=()=>manual(i-1);q('.ys-promo-next').onclick=()=>manual(i+1);
 function updatePause(){pause.textContent=paused?'▶':'Ⅱ';pause.setAttribute('aria-label',paused?'Putar slider':'Jeda slider');}
 pause.onclick=()=>{paused=!paused;updatePause();start();};updatePause();
 link.addEventListener('click',dismiss);dialog.addEventListener('cancel',e=>{e.preventDefault();dismiss();});
 dialog.addEventListener('click',e=>{if(e.target===dialog)dismiss();});
 dialog.addEventListener('close',()=>{stop();if(previousFocus&&previousFocus.isConnected)previousFocus.focus({preventScroll:true});});
 dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();manual(i+(e.key==='ArrowRight'?1:-1));}});
 document.addEventListener('visibilitychange',start);
 render(0);
 setTimeout(()=>{if(document.querySelector('dialog[open]'))return;previousFocus=document.activeElement;dialog.showModal();start();},2000);
})();
