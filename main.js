// Inside Korea Guide — menu, search, "new today" list, footer year
(function(){
  var nav=document.querySelector('.nav');
  if(nav){
    var toggle=nav.querySelector('.toggle');
    function closeAll(){nav.querySelectorAll('.menu>li.open').forEach(function(o){o.classList.remove('open');o.firstElementChild.setAttribute('aria-expanded','false');});}
    toggle.addEventListener('click',function(){var on=nav.classList.toggle('show');toggle.setAttribute('aria-expanded',on);toggle.textContent=on?'Close':'Menu';});
    nav.querySelectorAll('.menu>li>button').forEach(function(btn){
      btn.addEventListener('click',function(e){e.stopPropagation();var li=btn.parentNode,was=li.classList.contains('open');closeAll();if(!was){li.classList.add('open');btn.setAttribute('aria-expanded','true');}});
    });
    nav.querySelectorAll('.sub a').forEach(function(a){a.addEventListener('click',function(){nav.classList.remove('show');toggle.setAttribute('aria-expanded','false');toggle.textContent='Menu';closeAll();});});
    document.addEventListener('click',closeAll);
    document.addEventListener('keydown',function(e){if(e.key==='Escape')closeAll();});
  }
  var yr=document.getElementById('yr'); if(yr) yr.textContent=new Date().getFullYear();

  var form=document.getElementById('search');
  var latest=document.getElementById('latest');

  if(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var q=document.getElementById('q').value.trim().toLowerCase(), out=document.getElementById('results');
      if(!q){out.innerHTML='';return;}
      var list=(window.IKG_INDEX||[]).filter(function(x){return (x.t+' '+x.d+' '+(x.s||'')).toLowerCase().indexOf(q)>-1;}).slice(0,8);
      if(!list.length){out.innerHTML='<p>No guides match "'+q.replace(/[<>&"]/g,'')+'" yet. Try a city, a transport type or a topic such as money.</p>';return;}
      out.innerHTML='<ul>'+list.map(function(x){return '<li><a href="'+x.u+'">'+x.t+(x.s?' <small>'+x.s+' · '+x.d+'</small>':'<small>'+x.d+'</small>')+'</a></li>';}).join('')+'</ul>';
    });
  }

  if(form||latest){
    if(window.IKG_INDEX){ if(latest) renderLatest(); }
    else{
      var s=document.createElement('script'); s.src='/search-index.js';
      s.onload=function(){ if(latest) renderLatest(); };
      document.head.appendChild(s);
    }
  }

  /* ---------- New guides (published date "p" in search-index.js, Korea time) ---------- */
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function kstDay(offset){return new Date(Date.now()+9*36e5-(offset||0)*864e5).toISOString().slice(0,10);}
  var MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
  function nice(d){var p=d.split('-');return MONTHS[+p[1]-1]+' '+(+p[2])+', '+p[0];}
  function label(d){return d===kstDay(0)?'Today':d===kstDay(1)?'Yesterday':nice(d);}
  var COLORS={'Destinations':'--l2','Itineraries':'--l3','Food':'--l5','Getting Around':'--l1','Culture':'--l4','Stay':'--l9','Plan Your Trip':'--ink'};

  function card(x,today){
    return '<a class="fresh-card" href="'+esc(x.u)+'" style="--c:var('+(COLORS[x.s]||'--l2')+')">'+
      (x.i?'<img src="'+esc(x.i)+'" alt="" loading="lazy" width="1200" height="750">':'<span class="ph" aria-hidden="true"></span>')+
      '<span class="fresh-body">'+
      '<span class="fresh-meta">'+(today?'<em class="now">New today</em>':'')+'<span class="sec">'+esc(x.s||'Guide')+'</span></span>'+
      '<b>'+esc(x.t)+'</b><span class="d">'+esc(x.d)+'</span>'+
      '<time datetime="'+esc(x.p)+'">'+label(x.p)+'</time></span></a>';
  }

  function renderLatest(){
    var all=(window.IKG_INDEX||[]).map(function(x,i){x._i=i;return x;}).filter(function(x){return x.p;});
    all.sort(function(a,b){return a.p<b.p?1:a.p>b.p?-1:b._i-a._i;});
    var today=kstDay(0), mode=latest.getAttribute('data-latest');
    var todays=all.filter(function(x){return x.p===today;});
    var head=document.getElementById('new-h'), note=document.getElementById('new-note');

    if(!all.length){latest.innerHTML='<p class="fresh-empty">New guides are on their way. Check back soon.</p>';return;}

    if(mode==='all'){
      var groups={},order=[];
      all.forEach(function(x){if(!groups[x.p]){groups[x.p]=[];order.push(x.p);}groups[x.p].push(x);});
      if(note) note.textContent=todays.length?(todays.length+(todays.length>1?' guides':' guide')+' published today (Korea time).'):'No new guide yet today (Korea time). Here is everything we have published, newest first.';
      latest.innerHTML=order.map(function(d){
        return '<section class="fresh-day"><h2><time datetime="'+d+'">'+(d===today||d===kstDay(1)?label(d)+' · '+nice(d):nice(d))+'</time><span>'+groups[d].length+'</span></h2><div class="fresh-list">'+
          groups[d].map(function(x){return card(x,d===today);}).join('')+'</div></section>';
      }).join('');
      return;
    }

    var n=parseInt(mode,10)||6, show=todays.slice();
    all.forEach(function(x){if(show.length<Math.max(n,todays.length)&&x.p!==today)show.push(x);});
    if(head) head.innerHTML=todays.length?'Published today <span class="count">'+todays.length+'</span>':'Latest guides';
    if(note) note.textContent=todays.length?nice(today)+', Korea time. New guides go up every day.':'Nothing new yet today (Korea time). Here are the most recent guides.';
    latest.innerHTML='<div class="fresh-list">'+show.map(function(x){return card(x,x.p===today);}).join('')+'</div>';
  }

  /* ---------- Latest approved Korea Voices on the homepage ---------- */
  var hv=document.getElementById('home-voices');
  if(hv&&window.fetch){
    fetch('/api/voices?limit=3').then(function(r){return r.ok?r.json():null;}).then(function(j){
      if(!j||!j.items||!j.items.length) return;
      j.items.forEach(function(v){
        var a=document.createElement('a'); a.className='hv'; a.href='/voices';
        var b=document.createElement('b'); b.textContent=v.title; a.appendChild(b);
        var p=document.createElement('span'); p.className='hv-body'; p.textContent=v.body.length>160?v.body.slice(0,157)+'…':v.body; a.appendChild(p);
        var m=document.createElement('span'); m.className='hv-meta'; m.textContent=(v.name||'Anonymous traveler')+(v.country?' · '+v.country:''); a.appendChild(m);
        hv.appendChild(a);
      });
      hv.hidden=false;
    }).catch(function(){});
  }
})();
