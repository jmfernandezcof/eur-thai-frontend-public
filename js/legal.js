(function(){
  const STR={
    es:{aviso:'Aviso Legal',privacidad:'Privacidad',cookies:'Cookies'},
    en:{aviso:'Legal Notice',privacidad:'Privacy',cookies:'Cookies'},
    th:{aviso:'ประกาศทางกฎหมาย',privacidad:'ความเป็นส่วนตัว',cookies:'คุกกี้'}
  };
  let data=null,loading=null,openDoc=null;
  function getLang(){return (typeof I18N!=='undefined'&&I18N.current)?I18N.current:'es';}
  async function load(){
    if(data) return data;
    if(!loading) loading=fetch('/data/legal.json').then(r=>r.json()).then(j=>{data=j;return j;});
    return loading;
  }
  function mdToHtml(md){
    let h=md.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    h=h.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
    h=h.replace(/`([^`]+)`/g,'<code>$1</code>');
    const lines=h.split('\n');
    let html='',inList=false;
    for(const line of lines){
      const t=line.trim();
      if(t.startsWith('- ')){
        if(!inList){html+='<ul>';inList=true;}
        html+='<li>'+t.slice(2)+'</li>';
      }else{
        if(inList){html+='</ul>';inList=false;}
        if(t) html+='<p>'+t+'</p>';
      }
    }
    if(inList) html+='</ul>';
    return html;
  }
  async function open(doc){
    const j=await load();
    const lang=getLang();
    const text=(j[doc]&&j[doc][lang])||j[doc].es;
    openDoc=doc;
    Modal.open({
      owner:'legal',
      title:STR[lang][doc]||STR.es[doc],
      subtitle:'',
      render:(body)=>{body.innerHTML='<div class="legal-doc">'+mdToHtml(text)+'</div>';}
    });
  }
  function refreshFooter(){
    const lang=getLang();
    document.querySelectorAll('[data-legal]').forEach(el=>{
      const k=el.getAttribute('data-legal');
      if(STR[lang][k]) el.textContent=STR[lang][k];
    });
  }
  // Engancha los clics del footer aqui (antes era onclick="" inline, que la CSP bloquea).
  // Una sola vez: los enlaces del footer son estaticos, no se recrean.
  function wireLinks(){
    document.querySelectorAll('[data-legal]').forEach(el=>{
      el.style.cursor='pointer';
      el.addEventListener('click', ()=> open(el.getAttribute('data-legal')));
    });
  }
  function init(){ refreshFooter(); wireLinks(); }
  document.addEventListener('i18n:changed',()=>{
    refreshFooter();
    if(Modal&&Modal.owner==='legal'&&openDoc) open(openDoc);
  });
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
  window.openLegal=open;
})();
