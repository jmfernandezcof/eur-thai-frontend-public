/* beta.js — Gate de acceso por invitación individual + captura de email. */
(function(){
  const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSd-xew5g3qsWTRUX_5shRMGRrx3co_W_RFEma_KCdMJP-RO-w/formResponse';
  const ENTRY_ID = 'entry.1923423263';
  const AI_TOOLS = ['menu','sign','translate'];

  // Retira cualquier credencial beta heredada y limpia enlaces antiguos.
  try { localStorage.removeItem('arti-beta'); } catch(e) {}
  var params = new URLSearchParams(window.location.search);
  if(params.has('beta')){
    params.delete('beta');
    var clean=params.toString();
    history.replaceState({},'',window.location.pathname+(clean?'?'+clean:''));
  }

  window.ArtI = window.ArtI || {};
  // invites.js sustituye esta función tras validar una invitación individual.
  window.ArtI.isBeta = function(){ return false; };

  var STR = {
    es:{t:'¡Casi listo!',s:'La IA de menús y carteles está en pruebas',
      c:'Sé de los primeros.',o:'10 primeros testers',
      r:'1 mes gratis Premium 🥊',b:'¡Quiero probarla! 🇹🇭',
      k:'Ahora no',ok:'¡Apuntado!',p:'tu@email.com'},
    en:{t:'Almost ready!',s:'AI menu & sign translation is in beta',
      c:'Be the first to try.',o:'First 10 testers',
      r:'1 free month Premium 🥊',b:'I want in! 🇹🇭',
      k:'Not now',ok:'You\'re in!',p:'your@email.com'},
    th:{t:'เกือบพร้อม!',s:'AI แปลเมนูกำลังทดสอบ',
      c:'เป็นคนแรกที่ลอง',o:'10 คนแรก',
      r:'ฟรี 1 เดือน Premium 🥊',b:'อยากลอง! 🇹🇭',
      k:'ไม่ใช่ตอนนี้',ok:'ลงทะเบียนแล้ว!',p:'อีเมล'}
  };

  function showTeaser(){
    var lang = (typeof I18N !== 'undefined' && I18N.current) || 'es';
    var s = STR[lang] || STR.es;
    Modal.open({
      title: s.t, subtitle: s.s,
      render: function(body){
        body.innerHTML =
          '<div class="beta-teaser">' +
          '<p class="bt-cta">' + s.c + '</p>' +
          '<p class="bt-offer"><b>' + s.o + '</b> →</p>' +
          '<p class="bt-reward">' + s.r + '</p>' +
          '<input class="bt-email" type="email" placeholder="' +
          s.p + '" id="betaEmail">' +
          '<button class="bt-btn" id="betaGo">' + s.b + '</button>' +
          '<button class="bt-skip" id="betaSkip">' + s.k +
          '</button></div>';

        var btn = body.querySelector('#betaGo');
        var skip = body.querySelector('#betaSkip');
        var input = body.querySelector('#betaEmail');
        btn.addEventListener('click', function(){
          var email = input.value.trim();
          if(!email || !email.includes('@')) {
            input.style.borderColor = '#ef4444'; return;
          }
          submitEmail(email);
          Modal.close();
          showToast(s.ok);
        });
        skip.addEventListener('click', function(){ Modal.close(); });
      }
    });
  }

  function submitEmail(email){
    var data = new URLSearchParams();
    data.append(ENTRY_ID, email);
    data.append('fvv','1');
    data.append('pageHistory','0');
    fetch(FORM_URL, {
      method:'POST', mode:'no-cors',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body: data.toString()
    }).catch(function(){});
  }

  function showToast(msg){
    var t = document.createElement('div');
    t.className = 'beta-toast';
    t.textContent = '✅ ' + msg;
    document.body.appendChild(t);
    requestAnimationFrame(function(){ t.classList.add('show'); });
    setTimeout(function(){
      t.classList.remove('show');
      setTimeout(function(){ t.remove(); }, 400);
    }, 2500);
  }

  function showBetaPlaceholder(tool){
    Modal.open({
      title: '🔓 Beta mode',
      subtitle: tool === 'menu' ? 'Escanear menú' : 'Traducir cartel',
      render: function(body){
        body.innerHTML =
          '<p style="color:#94a3b8;text-align:center;line-height:1.6">' +
          'Función IA activa para beta testers.<br>' +
          'UI en construcción — próximamente aquí.</p>';
      }
    });
  }

  // --- Wire AI tool buttons ---
  document.addEventListener('DOMContentLoaded', function(){
    AI_TOOLS.forEach(function(tool){
      var btn = document.querySelector('[data-tool="'+tool+'"]');
      if(!btn) return;
      btn.addEventListener('click', function(e){
        e.preventDefault();
        if(window.ArtI.isBeta()){
          if(tool==="menu" && window.ArtI.scanMenu) window.ArtI.scanMenu();
          else if(tool==="sign" && window.ArtI.scanSign) window.ArtI.scanSign();
          else if(tool==="translate" && window.ArtI.openTranslate) window.ArtI.openTranslate();
          else showBetaPlaceholder(tool);
        } else {
          showTeaser();
        }
      });
    });
  });
})();
