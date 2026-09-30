// Korea Voices — list approved stories and submit new ones for review
(function(){
  var API='/api/voices', list=document.getElementById('vlist'), more=document.getElementById('vmore'),
      filter=document.getElementById('vfilter'), form=document.getElementById('vform');
  var TOPICS=['All','First impressions','What surprised me','Food','Getting around','People and culture','Tips for first-timers','Other'];
  var COLORS={'First impressions':'--l2','What surprised me':'--l3','Food':'--l5','Getting around':'--l1','People and culture':'--l4','Tips for first-timers':'--l9','Other':'--ink'};
  var topic='All', before='', started=Date.now();

  function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
  function month(iso){try{return new Date(iso).toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'Asia/Seoul'});}catch(e){return '';}}

  TOPICS.forEach(function(t){
    var b=el('button',null,t); b.type='button'; b.setAttribute('aria-pressed',t===topic);
    b.addEventListener('click',function(){topic=t;before='';filter.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed',x===b);});load(false);});
    filter.appendChild(b);
  });

  function render(items,append){
    if(!append) list.innerHTML='';
    if(!items.length&&!append){
      list.appendChild(el('p','fresh-empty',topic==='All'?'No stories yet. Yours could be the first one on this page.':'No stories on this topic yet. Be the first to share one.'));
      return;
    }
    items.forEach(function(v){
      var a=el('article','voice'); a.style.setProperty('--c','var('+(COLORS[v.topic]||'--l3')+')');
      a.appendChild(el('h3',null,v.title));
      a.appendChild(el('p',null,v.body));
      var f=el('footer');
      f.appendChild(el('b',null,v.name||'Anonymous traveler'));
      if(v.country) f.appendChild(el('span',null,'from '+v.country));
      if(v.visit) f.appendChild(el('span',null,v.visit));
      if(v.topic) f.appendChild(el('span',null,v.topic));
      if(v.created_at) f.appendChild(el('span',null,month(v.created_at)));
      a.appendChild(f); list.appendChild(a);
    });
  }

  function load(append){
    var q='?limit=20'+(topic!=='All'?'&topic='+encodeURIComponent(topic):'')+(append&&before?'&before='+encodeURIComponent(before):'');
    fetch(API+q).then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j};});}).then(function(res){
      if(!res.ok) throw res.j;
      var items=res.j.items||[]; render(items,append);
      before=items.length?items[items.length-1].id:''; more.hidden=!res.j.more;
    }).catch(function(e){
      list.innerHTML='';
      list.appendChild(el('p','fresh-empty',e&&e.error==='not_configured'?'Korea Voices is opening soon. Stories will appear here once the first ones are reviewed.':'Stories could not be loaded right now. Please try again later.'));
      more.hidden=true;
    });
  }
  more.addEventListener('click',function(){load(true);});
  load(false);

  var body=document.getElementById('v-body'), count=document.getElementById('v-count'), msg=document.getElementById('v-msg'), send=document.getElementById('v-send');
  body.addEventListener('input',function(){count.textContent=body.value.length.toLocaleString('en-US')+' / 1,500';});

  form.addEventListener('submit',function(e){
    e.preventDefault(); msg.className='vmsg'; msg.textContent='';
    var d={}; new FormData(form).forEach(function(v,k){d[k]=typeof v==='string'?v.trim():v;});
    d.consent=document.getElementById('v-ok').checked; d.elapsed=Date.now()-started;
    var err=!d.country?'Please tell us which country you are from.':!d.visit?'Please choose your connection to Korea.':!d.topic?'Please choose a topic.':
      !d.title||d.title.length<5?'Please add a short headline.':d.body.length<80?'Your story needs at least 80 characters.':
      /(https?:\/\/|www\.|\.com\b|@)/i.test(d.title+' '+d.body)?'Please remove links, email addresses or contact details.':!d.consent?'Please tick the box to confirm the guidelines.':'';
    if(err){msg.className='vmsg err';msg.textContent=err;return;}
    send.disabled=true; send.textContent='Sending…';
    fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})
      .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j};});})
      .then(function(res){
        if(!res.ok) throw res.j;
        form.reset(); count.textContent='0 / 1,500'; started=Date.now();
        msg.className='vmsg ok'; msg.textContent='Thank you! Your story was received and will appear after an editor reviews it.';
      })
      .catch(function(j){
        msg.className='vmsg err';
        msg.textContent=j&&j.message?j.message:j&&j.error==='not_configured'?'Submissions open very soon. Please try again in a few days.':'Something went wrong. Please try again later.';
      })
      .then(function(){send.disabled=false;send.textContent='Submit for review';});
  });
})();
