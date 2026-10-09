(function(){
  var DATA=null, bodyEl=null;
  var STR={
    es:{title:'Teléfonos',sub:'Tailandia',call:'Llamar',note:'Los números cortos (191, 1155…) solo funcionan en Tailandia con SIM local. Los +66 de embajadas, desde cualquier teléfono.'},
    en:{title:'Phone numbers',sub:'Thailand',call:'Call',note:'Short numbers (191, 1155…) only work inside Thailand with a local SIM. Embassy +66 numbers work from any phone.'},
    th:{title:'เบอร์โทร',sub:'ประเทศไทย',call:'โทร',note:'เบอร์สั้น (191, 1155) ใช้ได้เฉพาะในไทยด้วยซิมไทย'}
  };
  function L(){ return (typeof I18N!=='undefined' && I18N.current)?I18N.current:'es'; }
  function s(k){ return (STR[L()]||STR.es)[k]; }
  function call(tel,cls){ return '<a class="'+(cls||'tel-call')+'" href="tel:'+tel+'" aria-label="'+s('call')+'"><i class="ti ti-phone"></i></a>'; }
  function emCard(it,l){
    var hint=it.hint?'<div class="tel-card-hint">'+it.hint[l]+'</div>':'';
    return '<a class="tel-card" href="tel:'+it.tel+'"><i class="ti ti-phone tel-card-ic"></i><div class="tel-card-num">'+it.num+'</div><div class="tel-card-label">'+it.name[l]+'</div>'+hint+'</a>';
  }
  function utilRow(it,l){
    var hint=it.hint?'<div class="tel-li-hint">'+it.hint[l]+'</div>':'';
    return '<div class="tel-li"><div class="tel-li-main"><div class="tel-li-name">'+it.name[l]+'</div>'+hint+'</div><div class="tel-li-r"><span class="tel-li-num">'+it.num+'</span>'+call(it.tel)+'</div></div>';
  }
  function embRow(it,l){
    var badge=it.badge?'<span class="tel-emb-badge">'+it.badge+'</span>':'';
    var h='<div class="tel-emb"><img class="tel-emb-flag" src="/assets/flags/'+it.flag+'.svg" alt=""><div class="tel-emb-main"><div class="tel-emb-name">'+it.name[l]+'</div><div class="tel-emb-num">'+it.num+badge+'</div></div>'+call(it.tel)+'</div>';
    if(it.sub){ h+='<div class="tel-emb-subrow"><div class="tel-emb-sub">'+it.sub.label[l]+' <span class="tel-emb-sub-num">'+it.sub.num+'</span></div>'+call(it.sub.tel,'tel-call-sm')+'</div>'; }
    return h;
  }
  function render(){
    if(!bodyEl||!DATA) return;
    var l=L();
    var html=DATA.sections.map(function(sec){
      var inner;
      if(sec.layout==='grid') inner='<div class="tel-grid">'+sec.items.map(function(it){return emCard(it,l);}).join('')+'</div>';
      else if(sec.layout==='embassies') inner='<div class="tel-list">'+sec.items.map(function(it){return embRow(it,l);}).join('')+'</div>';
      else inner='<div class="tel-list">'+sec.items.map(function(it){return utilRow(it,l);}).join('')+'</div>';
      return '<div class="tel-sec"><div class="tel-sec-h">'+sec.title[l]+'</div>'+inner+'</div>';
    }).join('');
    html+='<div class="tel-note"><i class="ti ti-info-circle"></i> '+s('note')+'</div>';
    bodyEl.innerHTML=html;
  }
  async function openPhones(){
    if(!DATA){ try{ DATA=await (await fetch('/data/phones.json')).json(); }catch(e){ console.error('phones load',e); return; } }
    Modal.open({ owner:'phones', title:s('title'), subtitle:s('sub'), render:function(el){ bodyEl=el; render(); } });
  }
  document.addEventListener('DOMContentLoaded',function(){
    var t=document.querySelector('[data-tool="phones"]');
    if(t) t.addEventListener('click',openPhones);
  });
  document.addEventListener('i18n:changed',function(){
    if(Modal.owner==='phones' && bodyEl){
      var mt=Modal.el.querySelector('#modalTitle'); if(mt) mt.textContent=s('title');
      var ms=Modal.el.querySelector('#modalSub'); if(ms) ms.textContent=s('sub');
      render();
    }
  });
})();
