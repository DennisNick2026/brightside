const input=()=>document.getElementById('search');
const results=()=>document.getElementById('results');

function escapeHtml(value){
  return String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
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
    const response=await fetch('./records/'+encodeURIComponent(q)+'.json');
    if(!response.ok)throw new Error('not found');
    const r=await response.json();

    box.innerHTML='<a class="result" href="./record.html?id='+encodeURIComponent(r.id)+'">'+
      '<span class="status">'+escapeHtml(r.status)+'</span>'+
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
    const response=await fetch('./records/'+encodeURIComponent(id)+'.json');
    if(!response.ok)throw new Error('not found');
    const r=await response.json();
    renderRecord(box,r,false);
  }catch(e){
    box.innerHTML='<section class="paper error"><h1>RECORD NOT FOUND</h1><p>The requested record is not present in the current archive.</p></section>';
  }
}

function renderRecord(box,r,unlocked){
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

  const related=(r.related||[]).map(x=>
    '<li><a href="./record.html?id='+encodeURIComponent(x.id)+'">'+
    escapeHtml(x.label||x.id)+'</a></li>').join('');

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
    '<div class="record-body">'+escapeHtml(r.body).replace(/\n/g,'<br>')+'</div>'+
    (related?'<div class="related"><h2>RELATED RECORDS</h2><ul>'+related+'</ul></div>':'')+
    '</section>';
}

document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('lookup')?.addEventListener('click',lookup);
  input()?.addEventListener('keydown',e=>{if(e.key==='Enter')lookup();});
  showRecord();
});