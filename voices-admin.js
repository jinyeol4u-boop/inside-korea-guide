// Korea Voices review queue (private). Key is kept only for this browser tab.
(function(){
  var form=document.getElementById('akey'), input=document.getElementById('k'), msg=document.getElementById('amsg'), q=document.getElementById('aqueue');
  try{input.value=sessionStorage.getItem('ikgKey')||'';}catch(e){}
  function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;}
  function call(method,body){
    return fetch('/api/voices-admin',{method:method,headers:{'Content-Type':'application/json','X-Admin-Key':input.value.trim()},body:body?JSON.stringify(body):undefined})
      .then(function(r){return r.json().then(function(j){if(!r.ok)throw j;return j;});});
  }
  function load(){
    msg.className='vmsg';msg.textContent='Loading…';
    call('GET').then(function(j){
      try{sessionStorage.setItem('ikgKey',input.value.trim());}catch(e){}
      q.innerHTML=''; msg.textContent=j.items.length+' pending '+(j.items.length===1?'story':'stories')+'.';
      j.items.forEach(function(v){
        var row=el('div','admin-row');
        row.appendChild(el('h3',null,v.title));
        row.appendChild(el('p',null,v.body)).style.whiteSpace='pre-line';
        row.appendChild(el('p','upd',(v.name||'Anonymous')+' · '+v.country+' · '+v.visit+' · '+v.topic+' · '+new Date(v.created_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})));
        var acts=el('div','acts');
        [['approve','Approve (publish)'],['reject','Reject'],['delete','Delete']].forEach(function(a){
          var b=el('button','btn',a[1]); b.type='button';
          b.addEventListener('click',function(){b.disabled=true;call('POST',{id:v.id,action:a[0]}).then(function(){row.remove();}).catch(function(){b.disabled=false;alert('Failed. Try again.');});});
          acts.appendChild(b);
        });
        row.appendChild(acts); q.appendChild(row);
      });
    }).catch(function(e){q.innerHTML='';msg.className='vmsg err';msg.textContent=e&&e.error==='unauthorized'?'Wrong admin key.':e&&e.error==='not_configured'?'Database not connected yet (VOICES_DB binding missing).':'Could not load.';});
  }
  form.addEventListener('submit',function(e){e.preventDefault();load();});
  if(input.value) load();
})();
