(function(){
  var DATA=null, active=null, bodyEl=null;
  var gender=localStorage.getItem('arti-gender')||'m';
  var STR={
    es:{title:'Frases',gm:'Hombre',gf:'Mujer',listen:'Escuchar pronunciación',novoice:'Tu navegador no tiene voz tailandesa — usa la fonética.'},
    en:{title:'Phrases',gm:'Male',gf:'Female',listen:'Listen to pronunciation',novoice:'Your browser has no Thai voice — use the phonetics.'},
    th:{title:'วลี',gm:'ชาย',gf:'หญิง',listen:'ฟังการออกเสียง',novoice:'เบราว์เซอร์ไม่มีเสียงภาษาไทย'}
  };
  function L(){ return (typeof I18N!=='undefined' && I18N.current)?I18N.current:'es'; }
  function s(k){ return (STR[L()]||STR.es)[k]; }
  function origin(it){ var l=L(); return l==='th'?it.en:it[l]; }
  function part(isQ){
    if(gender==='m') return {th:'ครับ',ph:' khráp'};
    return isQ?{th:'คะ',ph:' khá'}:{th:'ค่ะ',ph:' khâ'};
  }
  function pron(){ return gender==='m'?{th:'ผม',ph:'phǒm'}:{th:'ฉัน',ph:'chǎn'}; }
  function thFull(it){ var b=it.th.replace('{pron}',pron().th); return it.np?b:b+part(it.q).th; }
  function phFull(it){ var b=it.ph.replace('{pron}',pron().ph); return it.np?b:b+part(it.q).ph; }
  function hasThaiVoice(){ try{ var v=window.speechSynthesis?window.speechSynthesis.getVoices():[]; return v.some(function(x){return x.lang&&x.lang.toLowerCase().indexOf('th')===0;}); }catch(e){ return false; } }
  function playAudio(file,txt){ var done=false; var a=new Audio("/assets/audio/"+file+".mp3"); a.addEventListener("error",function(){ if(!done){done=true; speak(txt);} }); var pr=a.play(); if(pr&&pr.catch) pr.catch(function(){ if(!done){done=true; speak(txt);} }); }
  function speak(t){
    if(!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    var u=new SpeechSynthesisUtterance(t); u.lang='th-TH'; u.rate=0.85;
    var v=window.speechSynthesis.getVoices();
    var th=v.find(function(x){return x.lang&&x.lang.toLowerCase().indexOf('th')===0;});
    if(th) u.voice=th;
    window.speechSynthesis.speak(u);
  }
  function render(){
    if(!bodyEl||!DATA) return;
    var cats=DATA.categories;
    var html='<div class="ph-gender"><button class="ph-gbtn'+(gender==='m'?' on':'')+'" data-g="m"><i class="ti ti-mars"></i>'+s('gm')+'</button><button class="ph-gbtn'+(gender==='f'?' on':'')+'" data-g="f"><i class="ti ti-venus"></i>'+s('gf')+'</button></div>';
    html+='<div class="ph-chips">'+cats.map(function(c){ return '<button class="ph-chip'+(c.id===active?' on':'')+'" data-id="'+c.id+'">'+c.name[L()]+'</button>'; }).join('')+'</div>';
    var cat=cats.find(function(c){return c.id===active;});
    html+=cat.items.map(function(it,i){
      var thx=thFull(it).replace(/"/g,'&quot;');
      return '<div class="ph-row"><div class="ph-txt"><div class="ph-es">'+origin(it)+'</div><div class="ph-th">'+thFull(it)+'</div><div class="ph-ph">'+phFull(it)+'</div></div><button class="ph-play" data-audio="'+active+'-'+i+'-'+gender+'" data-say="'+thx+'" aria-label="'+s('listen')+'"><i class="ti ti-volume"></i></button></div>';
    }).join('');
    html+='<div class="ph-note" id="phNote"><i class="ti ti-info-circle"></i> '+s('novoice')+'</div>';
    bodyEl.innerHTML=html;
    if(window.speechSynthesis && !hasThaiVoice()){ var n=bodyEl.querySelector('#phNote'); if(n) n.style.display='block'; }
    bodyEl.querySelectorAll('.ph-gbtn').forEach(function(b){ b.addEventListener('click',function(){ gender=b.dataset.g; localStorage.setItem('arti-gender',gender); render(); }); });
    bodyEl.querySelectorAll('.ph-chip').forEach(function(b){ b.addEventListener('click',function(){ active=b.dataset.id; render(); }); });
    bodyEl.querySelectorAll('.ph-play').forEach(function(b){ b.addEventListener('click',function(){ playAudio(b.getAttribute('data-audio'), b.getAttribute('data-say')); }); });
  }
  async function openPhrases(){
    if(!DATA){ try{ DATA=await (await fetch('/data/phrases.json')).json(); }catch(e){ console.error('phrases load',e); return; } }
    if(!active) active=DATA.categories[0].id;
    Modal.open({ owner:'phrases', title:s('title'), render:function(el){ bodyEl=el; render(); } });
  }
  document.addEventListener('DOMContentLoaded',function(){
    var t=document.querySelector('[data-tool="phrases"]');
    if(t) t.addEventListener('click',openPhrases);
  });
  document.addEventListener('i18n:changed',function(){
    if(Modal.owner==='phrases' && bodyEl){
      var mt=Modal.el.querySelector('#modalTitle'); if(mt) mt.textContent=s('title');
      render();
    }
  });
  if(window.speechSynthesis){ window.speechSynthesis.onvoiceschanged=function(){ if(bodyEl){ var n=bodyEl.querySelector('#phNote'); if(n) n.style.display=hasThaiVoice()?'none':'block'; } }; }
})();
