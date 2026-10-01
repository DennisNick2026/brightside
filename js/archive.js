const input=()=>document.getElementById('search');
const results=()=>document.getElementById('results');

function escapeHtml(value){
  return String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

async function loadPublicRecords(){
  const box=document.getElementById('public-records');
  if(!box)return;
  try{
    const manifest=await fetch('./records/manifest.json?ts='+Date.now(),{cache:'no-store'}).then(r=>r.json());
    const records=await Promise.all((manifest.records||[]).map(id=>
      fetch('./records/'+encodeURIComponent(id)+'.json?ts='+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null)
    ));
    const publicRecords=records.filter(r=>r && String(r.status||'PUBLIC').toUpperCase()==='PUBLIC');
    const publicIds=new Set(publicRecords.map(r=>r.id));

    // Only show public records that act as an entry point to a larger public collection.
    // A record is an entry point when it links to at least one other public record.
    const collectionEntries=publicRecords.filter(r=>
      Array.isArray(r.related) &&
      r.related.some(x=>publicIds.has(typeof x==='string'?x:x?.id))
    );

    if(!collectionEntries.length){
      box.innerHTML='<div class="paper"><p>NO PUBLIC COLLECTIONS ARE CURRENTLY INDEXED.</p></div>';
      return;
    }

    box.innerHTML=collectionEntries.map(r=>{
      const publicRelated=(r.related||[])
        .map(x=>typeof x==='string'?x:x?.id)
        .filter(id=>publicIds.has(id)).length;
      return '<a class="result collection-result" href="./record.html?id='+encodeURIComponent(r.id)+'">'+
        '<span class="status">PUBLIC</span>'+
        '<h3>'+escapeHtml(r.title)+'</h3>'+
        '<div class="meta">'+escapeHtml(r.id)+' / '+escapeHtml(r.date)+' / '+escapeHtml(r.category)+'</div>'+
        '<p class="summary">'+escapeHtml(r.summary)+'</p>'+
        '<div class="collection-count">'+publicRelated+' related public record'+(publicRelated===1?'':'s')+'</div>'+
      '</a>';
    }).join('');
  }catch(e){
    box.innerHTML='<div class="paper error"><p>PUBLIC INDEX UNAVAILABLE.</p></div>';
  }
}
async function lookup(){
  const q=(input()?.value||'').trim();
  const box=results();
  if(!box)return;
  if(!q){
    box.innerHTML='<div class="paper"><p>ENTER A RECORD REFERENCE.</p></div>';
    return;
  }

  try{
    const response=await fetch('./records/'+encodeURIComponent(q)+'.json?ts='+Date.now(),{cache:'no-store'});
    if(!response.ok)throw new Error('not found');
    const r=await response.json();

    box.innerHTML='<a class="result" href="./record.html?id='+encodeURIComponent(r.id)+'">'+
      '<span class="status">'+escapeHtml(String(r.status||'PUBLIC').toUpperCase())+'</span>'+
      '<h3>'+escapeHtml(r.title)+'</h3>'+
      '<div class="meta">'+escapeHtml(r.id)+' / '+escapeHtml(r.date)+' / '+escapeHtml(r.category)+'</div>'+
      '<p class="summary">'+escapeHtml(r.summary)+'</p></a>';
  }catch(e){
    box.innerHTML='<section class="paper error"><h2>NO RECORD FOUND</h2><p>No indexed record matches the supplied reference.</p></section>';
  }
}

async function showRecord(){
  const box=document.getElementById('record');
  if(!box)return;
  const id=new URLSearchParams(location.search).get('id');
  if(!id){
    box.innerHTML='<section class="paper"><h1>RECORD VIEWER</h1><p>No record reference supplied.</p></section>';
    return;
  }

  try{
    const response=await fetch('./records/'+encodeURIComponent(id)+'.json?ts='+Date.now(),{cache:'no-store'});
    if(!response.ok)throw new Error('not found');
    const r=await response.json();
    renderRecord(box,r,false);
  }catch(e){
    box.innerHTML='<section class="paper error"><h1>RECORD NOT FOUND</h1><p>The requested record is not present in the current archive.</p></section>';
  }
}

function renderRecord(box,r,unlocked){
  const status=String(r.status||'PUBLIC').toUpperCase();

  if(status==='WITHDRAWN'){
    box.innerHTML='<section class="paper withdrawn">'+
      '<span class="status">WITHDRAWN</span>'+
      '<div class="eyebrow">'+escapeHtml(r.category)+'</div>'+
      '<h1>'+escapeHtml(r.title)+'</h1>'+ 
      '<div class="record-meta">'+
        '<div>REFERENCE</div><div>'+escapeHtml(r.id)+'</div>'+ 
        '<div>DATE</div><div>'+escapeHtml(r.date)+'</div>'+ 
        '<div>SOURCE</div><div>'+escapeHtml(r.source)+'</div>'+ 
        '<div>CLASSIFICATION</div><div>WITHDRAWN</div>'+ 
      '</div>'+ 
      '<div class="access-box"><h2>RECORD WITHDRAWN</h2><p>This record has been withdrawn from public access.</p></div>'+ 
      '</section>';
    return;
  }

  if(r.key && !unlocked){
    box.innerHTML='<section class="paper restricted">'+
      '<span class="status">'+escapeHtml(r.status)+'</span>'+
      '<div class="eyebrow">'+escapeHtml(r.category)+'</div>'+
      '<h1>'+escapeHtml(r.title)+'</h1>'+
      '<div class="record-meta">'+
        '<div>REFERENCE</div><div>'+escapeHtml(r.id)+'</div>'+
        '<div>DATE</div><div>'+escapeHtml(r.date)+'</div>'+
        '<div>SOURCE</div><div>'+escapeHtml(r.source)+'</div>'+
        '<div>CLASSIFICATION</div><div>'+escapeHtml(r.status)+'</div>'+
      '</div>'+
      '<div class="access-box">'+
        '<h2>ACCESS RESTRICTED</h2>'+
        '<p>This record requires an archive access key.</p>'+
        '<label for="record-key">ACCESS KEY</label>'+
        '<div class="lookup-row"><input id="record-key" type="password" autocomplete="off"><button id="unlock" type="button">UNLOCK</button></div>'+
        '<p id="key-error" class="error-text"></p>'+
      '</div>'+
      '</section>';
    document.getElementById('unlock').onclick=()=>{
      const key=document.getElementById('record-key').value;
      if(key===r.key){
        renderRecord(box,r,true);
      }else{
        document.getElementById('key-error').textContent='ACCESS KEY REJECTED.';
      }
    };
    document.getElementById('record-key').addEventListener('keydown',e=>{
      if(e.key==='Enter')document.getElementById('unlock').click();
    });
    return;
  }

  const corruptionNotice=status==='CORRUPTED'
    ? '<div class="access-box"><h2>ARCHIVE COPY INCOMPLETE</h2><p>The indexed copy is damaged or incomplete. The material below may not represent the complete original record.</p></div>'
    : '';

  const related=(r.related||[]).map(x=>{
    const id=typeof x==='string'?x:x?.id;
    if(!id)return '';
    return '<li><a class="related-link" href="./record.html?id='+encodeURIComponent(id)+'">'+
      '<strong>'+escapeHtml(x?.title||id)+'</strong>'+
      '<span class="related-meta">'+escapeHtml(x?.category||'RECORD')+' / '+escapeHtml(id)+'</span>'+
    '</a></li>';
  }).join('');

  box.innerHTML='<section class="paper">'+
    '<span class="status">'+escapeHtml(r.status)+'</span>'+
    '<div class="eyebrow">'+escapeHtml(r.category)+'</div>'+
    '<h1>'+escapeHtml(r.title)+'</h1>'+
    '<div class="record-meta">'+
      '<div>REFERENCE</div><div>'+escapeHtml(r.id)+'</div>'+
      '<div>DATE</div><div>'+escapeHtml(r.date)+'</div>'+
      '<div>SOURCE</div><div>'+escapeHtml(r.source)+'</div>'+
      '<div>CLASSIFICATION</div><div>'+escapeHtml(r.status)+'</div>'+
    '</div>'+
    corruptionNotice+
    '<div class="record-body">'+escapeHtml(r.body).replace(/\n/g,'<br>')+'</div>'+
    (related?'<div class="related"><h2>RELATED RECORDS</h2><ul>'+related+'</ul></div>':'')+
    '</section>';
}

document.addEventListener('DOMContentLoaded',()=>{
  loadPublicRecords();
  document.getElementById('lookup')?.addEventListener('click',lookup);
  input()?.addEventListener('keydown',e=>{if(e.key==='Enter')lookup();});
  showRecord();
});