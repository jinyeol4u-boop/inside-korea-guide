// Inside Korea Guide — menu, search, footer year
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
  if(form){
    var s=document.createElement('script'); s.src='search-index.js'; document.head.appendChild(s);
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var q=document.getElementById('q').value.trim().toLowerCase(), out=document.getElementById('results');
      if(!q){out.innerHTML='';return;}
      var list=(window.IKG_INDEX||[]).filter(function(x){return (x.t+' '+x.d+' '+(x.s||'')).toLowerCase().indexOf(q)>-1;}).slice(0,8);
      if(!list.length){out.innerHTML='<p>No guides match "'+q.replace(/[<>&"]/g,'')+'" yet. Try a city, a transport type or a topic such as money.</p>';return;}
      out.innerHTML='<ul>'+list.map(function(x){return '<li><a href="'+x.u+'">'+x.t+(x.s?' <small>'+x.s+' · '+x.d+'</small>':'<small>'+x.d+'</small>')+'</a></li>';}).join('')+'</ul>';
    });
  }
})();
