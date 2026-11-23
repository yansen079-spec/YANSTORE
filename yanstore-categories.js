/* YANSTORE: categories stored in Supabase; only logged-in store admin can write (RLS). */
(function(){
  'use strict';
  const api='https://ivnohbhlahevaihunmbp.supabase.co/rest/v1/ys_product_categories';
  const key='sb_publishable_uyzGj6RZJfhDdGqf2rAldg_NRQTNEZH';
  const defaultIcons={streaming:'🎬',editing:'✂️',music:'🎵',design:'🎨',ai:'🤖',other:'📦'};
  let categories=[];
  const $=id=>document.getElementById(id);
  const label=(name,slug)=> (defaultIcons[slug]?defaultIcons[slug]+' ':'📁 ')+name;
  function adminToken(){
    try{
      const s=JSON.parse(localStorage.getItem('yanstore_v6_session')||'null');
      return s && typeof s.access_token==='string' ? s.access_token : '';
    }catch(_){return '';}
  }
  function status(msg){const box=$('ysCategoryMessage');if(box)box.textContent=msg;}
  function rebuildSelect(id,keepAll){
    const select=$(id);if(!select)return;
    const before=select.value;
    const options=categories.map(c=>[c.slug,c.name]);
    if(keepAll)options.unshift(['all','Semua kategori']);
    // Never discard a currently assigned category while looking at a product.
    if(before && !options.some(x=>x[0]===before))options.push([before,before]);
    select.replaceChildren();
    options.forEach(([value,name])=>{
      const opt=document.createElement('option');opt.value=value;opt.textContent=name;select.appendChild(opt);
    });
    select.value=options.some(x=>x[0]===before)?before:(keepAll?'all':categories[0]?.slug||'other');
  }
  function renderAdminList(){
    const list=$('ysCategoryList');if(!list)return;
    list.replaceChildren();
    categories.forEach(c=>{
      const row=document.createElement('div');row.className='ys-category-row';
      const name=document.createElement('span');name.textContent=c.name+' ('+c.slug+')';
      const buttons=document.createElement('div');
      const rename=document.createElement('button');rename.type='button';rename.textContent='Edit nama';rename.addEventListener('click',()=>editCategory(c));
      const remove=document.createElement('button');remove.type='button';remove.textContent='Hapus';remove.addEventListener('click',()=>deleteCategory(c));
      buttons.append(rename,remove);row.append(name,buttons);list.appendChild(row);
    });
  }
  async function loadCategories(){
    const r=await fetch(api+'?select=slug,name,sort_order&order=sort_order.asc,name.asc',{headers:{apikey:key}});
    if(!r.ok)throw Error('Tidak dapat memuat kategori ('+r.status+').');
    const rows=await r.json();
    if(!Array.isArray(rows))throw Error('Respons kategori tidak valid.');
    categories=rows;
    window.ysCategories=categories.map(c=>({slug:c.slug,name:label(c.name,c.slug)}));
    rebuildSelect('category',true);
    rebuildSelect('v6Category',false);
    renderAdminList();
    if(typeof window.renderProducts==='function')window.renderProducts();
  }
  async function write(method,slug,body){
    const token=adminToken();
    if(!token)throw Error('Silakan login sebagai admin terlebih dahulu.');
    const endpoint=slug?api+'?slug=eq.'+encodeURIComponent(slug):api;
    const r=await fetch(endpoint,{method,headers:{
      apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json',
      Prefer:'return=minimal'
    },body:body?JSON.stringify(body):undefined});
    if(!r.ok){
      const payload=await r.json().catch(()=>null);
      throw Error(payload?.message||payload?.error||'Penyimpanan gagal ('+r.status+').');
    }
  }
  async function addCategory(){
    const input=$('ysCategoryName');const name=(input?.value||'').trim().replace(/\s+/g,' ');
    const slug=name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40);
    if(name.length<2||name.length>60||!/^[a-z][a-z0-9_-]{1,39}$/.test(slug)){status('Nama kategori harus 2–60 karakter, dimulai huruf, dan dapat dijadikan kode kategori.');return;}
    if(categories.some(c=>c.slug===slug||c.name.toLowerCase()===name.toLowerCase())){status('Kategori tersebut sudah ada.');return;}
    const btn=$('ysCategoryAdd');btn.disabled=true;
    try{
      await write('POST',null,{slug,name,sort_order:categories.length*10+100});
      await loadCategories();input.value='';$('v6Category').value=slug;status('✅ Kategori '+name+' berhasil ditambahkan ke Supabase.');
    }catch(e){status('❌ '+e.message);}
    finally{btn.disabled=false;}
  }
  async function editCategory(c){
    const next=prompt('Ubah nama kategori (produk tetap berada dalam kategori ini):',c.name);
    if(next===null)return;
    const name=next.trim().replace(/\s+/g,' ');
    if(name.length<2||name.length>60){status('Nama kategori harus 2–60 karakter.');return;}
    if(categories.some(x=>x.slug!==c.slug&&x.name.toLowerCase()===name.toLowerCase())){status('Nama sudah dipakai.');return;}
    try{await write('PATCH',c.slug,{name});await loadCategories();status('✅ Nama kategori berhasil diperbarui.');}
    catch(e){status('❌ '+e.message);}
  }
  async function deleteCategory(c){
    if(!confirm('Hapus kategori '+c.name+'? Kategori yang masih dipakai produk akan ditolak otomatis.'))return;
    try{await write('DELETE',c.slug);await loadCategories();status('✅ Kategori berhasil dihapus.');}
    catch(e){status('❌ '+e.message);}
  }
  function init(){
    $('ysCategoryAdd')?.addEventListener('click',addCategory);
    $('ysCategoryName')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addCategory();}});
    loadCategories().catch(e=>status('⚠️ '+e.message+' Pilihan kategori bawaan masih tersedia.'));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();