/* invites.js — invitaciones individuales, cuota visible y compatibilidad beta legacy. */
(function(){
  const INVITE_KEY='arti-invite';
  const VALID=/^[A-Za-z0-9_-]{20,128}$/;
  const originalIsBeta=window.ArtI&&window.ArtI.isBeta;
  var params=new URLSearchParams(window.location.search);
  var fragment=new URLSearchParams(window.location.hash.slice(1));
  var incoming=fragment.get('invite') || params.get('invite');
  var isNew=false;
  if(incoming!==null){
    if(VALID.test(incoming)){ localStorage.setItem(INVITE_KEY,incoming); isNew=true; }
    params.delete('invite'); fragment.delete('invite');
    var clean=params.toString(), cleanFragment=fragment.toString();
    history.replaceState({},'',window.location.pathname+(clean?'?'+clean:'')+(cleanFragment?'#'+cleanFragment:''));
  }

  window.ArtI=window.ArtI||{};
  window.ArtI.inviteCode=function(){
    var value=localStorage.getItem(INVITE_KEY)||'';
    return VALID.test(value)?value:'';
  };
  window.ArtI.isBeta=function(){
    return !!window.ArtI.inviteCode() || !!(originalIsBeta&&originalIsBeta());
  };

  function lang(){ return (window.I18N&&I18N.current)||'es'; }
  function words(){
    var all={
      es:{left:'créditos hoy',welcome:'¡Bienvenido a la beta!',valid:'Acceso válido hasta',body:'Ya puedes probar el traductor, los menús y los carteles.',go:'Empezar a probar ArtI',bad:'Esta invitación no es válida o ha caducado.'},
      en:{left:'credits today',welcome:'Welcome to the beta!',valid:'Access valid until',body:'You can now try translation, menus and signs.',go:'Start testing ArtI',bad:'This invitation is invalid or has expired.'},
      th:{left:'เครดิตวันนี้',welcome:'ยินดีต้อนรับสู่เบต้า!',valid:'ใช้ได้ถึง',body:'ลองใช้การแปล เมนู และป้ายได้แล้ว',go:'เริ่มทดลอง ArtI',bad:'คำเชิญนี้ไม่ถูกต้องหรือหมดอายุแล้ว'}
    };
    return all[lang()]||all.es;
  }

  function quotaEl(){
    var el=document.getElementById('betaQuota');
    if(!el){
      el=document.createElement('button'); el.id='betaQuota'; el.className='beta-quota'; el.type='button';
      var top=document.querySelector('.topbar'); if(top) top.appendChild(el);
      el.addEventListener('click',refresh);
    }
    return el;
  }
  function render(status){
    var el=quotaEl(); if(!el)return;
    el.textContent='⚡ '+status.remaining+' '+words().left;
    el.classList.toggle('low',status.remaining<=8);
  }
  function welcome(status){
    var s=words();
    Modal.open({title:s.welcome,subtitle:(status.alias||'Beta tester'),render:function(body){
      body.innerHTML='<div class="invite-welcome"><div class="invite-credits">⚡ '+status.remaining+' / '+status.dailyCredits+'</div><p>'+s.body+'</p><p class="invite-expiry">'+s.valid+' '+new Date(status.expiresAt).toLocaleDateString()+'</p><button class="bt-btn" id="inviteStart">'+s.go+'</button></div>';
      body.querySelector('#inviteStart').addEventListener('click',Modal.close);
    }});
  }
  async function refresh(){
    var token=window.ArtI.inviteCode(); if(!token)return null;
    try{
      var res=await fetch('/api/invite/status',{method:'POST',cache:'no-store',headers:{'Cache-Control':'no-cache','x-arti-invite':token}});
      if(!res.ok)throw new Error('invalid');
      var status=await res.json(); render(status); return status;
    }catch(e){
      localStorage.removeItem(INVITE_KEY);
      var el=document.getElementById('betaQuota'); if(el)el.remove();
      if(isNew&&window.Modal){ var s=words(); Modal.open({title:s.bad,render:function(body){body.innerHTML='';}}); }
      return null;
    }
  }
  window.ArtI.updateQuotaFromResponse=function(res){
    var value=res&&res.headers&&res.headers.get('X-ArtI-Credits-Remaining');
    if(value!==null){ var el=quotaEl(); el.textContent='⚡ '+value+' '+words().left; el.classList.toggle('low',Number(value)<=8); }
  };
  document.addEventListener('DOMContentLoaded',async function(){
    if(!window.ArtI.inviteCode())return;
    var status=await refresh(); if(status&&isNew)welcome(status);
  });
})();
