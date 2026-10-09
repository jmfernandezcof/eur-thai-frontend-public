/* translate.js — Voice/Text Translator for ArtI
   Textarea + mic (Web Speech) → POST /api/translate → thai + translit + back + warn
   Requires: modal.js, beta.js, i18n.js
*/
(function(){
  const API = '/api/translate';
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  var STR = {
    es:{title:'Traductor',ph:'Escribe o pulsa el micro y habla...',
      btn:'Traducir al thai',btnRev:'Traducir del thai',
      listening:'Escuchando… habla ahora',loading:'Traduciendo… un momento, por favor',
      back:'Verificación',copy:'Copiar',copied:'¡Copiado!',play:'Escuchar',checking:'verificando…',
      warn:'La traducción puede no ser exacta. Verifica con el personal.',
      err:'Error al traducir. Inténtalo de nuevo.',
      nomic:'Micrófono no disponible en este navegador',
      swap:'Invertir dirección',hist:'Historial',clear:'Borrar'},
    en:{title:'Translator',ph:'Type or tap the mic and speak...',
      btn:'Translate to Thai',btnRev:'Translate from Thai',
      listening:'Listening… speak now',loading:'Translating… one moment, please',
      back:'Verification',copy:'Copy',copied:'Copied!',play:'Listen',checking:'verifying…',
      warn:'Translation may not be exact. Verify with staff.',
      err:'Translation failed. Try again.',
      nomic:'Microphone not available in this browser',
      swap:'Swap direction',hist:'History',clear:'Clear'},
    th:{title:'แปลภาษา',ph:'พิมพ์หรือกดไมค์แล้วพูด...',
      btn:'แปลเป็นอังกฤษ',btnRev:'แปลเป็นไทย',
      listening:'กำลังฟัง… พูดได้เลย',loading:'กำลังแปล… รอสักครู่',
      back:'ตรวจสอบ',copy:'คัดลอก',copied:'คัดลอกแล้ว!',
      warn:'การแปลอาจไม่ถูกต้อง โปรดตรวจสอบ',
      err:'แปลไม่สำเร็จ ลองอีกครั้ง',
      nomic:'ไมโครโฟนไม่พร้อมใช้งาน',swap:'สลับทิศทาง',play:'ฟัง',hist:'ประวัติ',clear:'ล้าง',checking:'กำลังตรวจสอบ…'}
  };

  var MIC_LANG = {es:'es-ES',en:'en-US',th:'th-TH'};
  var state = { src:'es', tgt:'th', rec:null, listening:false };

  function uiLang(){
    return (typeof I18N!=='undefined'&&I18N.current)||'es';
  }
  function initDirection(){
    var l=uiLang();
    if(l==='th'){ state.src='th'; state.tgt='en'; }
    else { state.src=l; state.tgt='th'; }
  }
  function swapDirection(){
    var t=state.src; state.src=state.tgt; state.tgt=t;
    if(state.src==='th'&&state.tgt==='th'){ initDirection(); }
  }

  function micSupported(){
    return !!(window.SpeechRecognition||window.webkitSpeechRecognition);
  }

  function setMicIcon(btn,name){          // icono del botón vía DOM (sin innerHTML)
    var ic=document.createElement('i'); ic.className='ti '+name;
    if(btn.replaceChildren) btn.replaceChildren(ic); else { btn.textContent=''; btn.appendChild(ic); }
  }

  function startMic(ta, btn, s){
    if(state.rec){ stopMic(btn, s); }   // mata cualquier reconocimiento previo (evita instancias huérfanas)
    var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    var rec=new SR();
    rec.lang=MIC_LANG[state.src]||'es-ES';
    rec.interimResults=true;
    rec.continuous=false;
    var base=ta.value;
    rec.onresult=function(e){
      if(state.rec!==rec) return;       // ignora resultados de un reconocimiento ya cancelado
      var txt='';
      for(var i=0;i<e.results.length;i++) txt+=e.results[i][0].transcript;
      ta.value=(base?base+' ':'')+txt;
    };
    rec.onend=function(){ if(state.rec===rec) stopMic(btn,s); };
    rec.onerror=function(){ if(state.rec===rec) stopMic(btn,s); };
    rec.start();
    state.rec=rec; state.listening=true;
    btn.classList.add('tr-mic-on');
    setMicIcon(btn,'ti-player-stop');
  }

  function stopMic(btn,s){
    if(state.rec){
      // abort() corta YA y descarta el resultado final pendiente (stop() seguiría inyectando
      // palabras tras pulsar el botón); además desenganchamos los handlers para que esa
      // instancia no escriba más en el textarea.
      try{ state.rec.onresult=null; state.rec.onend=null; state.rec.onerror=null; }catch(e){}
      try{ state.rec.abort(); }catch(e){ try{ state.rec.stop(); }catch(_){} }
    }
    state.rec=null; state.listening=false;
    if(btn){
      btn.classList.remove('tr-mic-on');
      setMicIcon(btn,'ti-microphone');
    }
  }

  // Si el traductor se cierra (X / Esc / clic en el fondo) con el micro escuchando, páralo:
  // sin esto el reconocimiento seguía vivo y "fantasma" inyectando palabras en el campo.
  document.addEventListener('modal:closed', function(){ if(state.listening) stopMic(null,null); });

  // ---- TTS híbrido: voz del dispositivo (gratis) y, si no hay, audio del servidor ----
  // Web Speech corre en el móvil del usuario (coste 0, escala infinito) PERO no existe en
  // navegadores in-app (WebView de WhatsApp/Line/FB). Para esos caemos a /api/tts (edge-tts,
  // mismas voces que el frasero, cacheado en servidor/CDN). Así suena en TODOS los móviles.
  // WAV silencioso (data-URI) para "bendecir" el <audio> con una fuente REAL dentro del gesto.
  var SILENT_WAV='data:audio/wav;base64,UklGRhQBAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YfAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
  var _ttsAudio=null;
  function ttsAudio(){
    if(!_ttsAudio){ _ttsAudio=new Audio(); _ttsAudio.preload='auto'; }
    return _ttsAudio;
  }
  function hasVoiceFor(lang){
    if(!window.speechSynthesis || !window.speechSynthesis.getVoices) return false;
    var pref = lang==='th' ? 'th' : lang==='es' ? 'es' : 'en';
    var v=window.speechSynthesis.getVoices()||[];
    return v.some(function(x){return x.lang && x.lang.toLowerCase().indexOf(pref)===0;});
  }
  function ttsGender(){
    try{ return localStorage.getItem('arti-voice-gender')==='f' ? 'f' : 'm'; }catch(e){ return 'm'; }
  }
  // Reproduce el audio del servidor en el elemento <audio> ya desbloqueado por el gesto.
  async function serverTTS(text, lang){
    var a=ttsAudio();
    try{
      var res=await fetch('/api/tts',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:text,lang:lang,g:ttsGender()})});
      if(!res.ok) return;
      var data=await res.json();
      if(!data.url || data.url.indexOf('/tts/audio/')!==0) return;
      try{ a.pause(); }catch(e){}
      a.muted=false; a.src='/api'+data.url;
      var p=a.play(); if(p&&p.catch) p.catch(function(){});
    }catch(e){}
  }

  // Desbloquea AMBOS motores DENTRO del gesto del usuario (iOS/Safari/WebView lo exigen).
  function primeTTS(){
    if(window.speechSynthesis){
      try{ var u=new SpeechSynthesisUtterance(' '); u.volume=0; window.speechSynthesis.speak(u); }catch(e){}
    }
    // Desbloqueo del <audio>: hay que reproducir una FUENTE REAL (silenciosa) dentro del gesto.
    // Un <audio> sin src NO se desbloquea en Android WebView (WhatsApp) → el MP3 del servidor,
    // que suena tras el await de la traducción, quedaba bloqueado por autoplay. Con esto se "bendice".
    try{
      var a=ttsAudio();
      if(!a._primed){
        a.src=SILENT_WAV;
        var p=a.play();
        var done=function(){ try{ a.pause(); a.currentTime=0; }catch(e){} a._primed=true; };
        if(p&&p.then) p.then(done).catch(function(){}); else done();
      }
    }catch(e){}
  }

  function speakTTS(text, lang){
    if(!text) return;
    if(window.speechSynthesis && hasVoiceFor(lang)){
      try{
        window.speechSynthesis.cancel();
        var u=new SpeechSynthesisUtterance(text);
        u.lang = lang==='th' ? 'th-TH' : lang==='es' ? 'es-ES' : 'en-US';
        var pref=u.lang.slice(0,2).toLowerCase();
        var voices=window.speechSynthesis.getVoices()||[];
        var v=voices.filter(function(x){return x.lang&&x.lang.toLowerCase().indexOf(pref)===0;})[0];
        if(v) u.voice=v;
        u.onerror=function(){ serverTTS(text, lang); }; // si falla en runtime, cae al servidor
        window.speechSynthesis.speak(u);
      }catch(e){ serverTTS(text, lang); }
    } else {
      serverTTS(text, lang); // WebView / sin voz para este idioma: audio del servidor
    }
  }

  async function callTranslate(text){
    var res=await fetch(API,{
      method:'POST',
      headers:{'Content-Type':'application/json','x-arti-invite':(window.ArtI&&ArtI.inviteCode)?ArtI.inviteCode():''},
      body:JSON.stringify({text:text,from:state.src,to:state.tgt})
    });
    if(window.ArtI&&ArtI.updateQuotaFromResponse) ArtI.updateQuotaFromResponse(res);
    if(!res.ok) throw new Error('HTTP '+res.status);
    return res.json();
  }
  async function callVerify(text,target){
    var res=await fetch('/api/verify',{
      method:'POST',
      headers:{'Content-Type':'application/json','x-arti-invite':(window.ArtI&&ArtI.inviteCode)?ArtI.inviteCode():''},
      body:JSON.stringify({text:text,target:target,from:state.src,to:state.tgt})
    });
    if(window.ArtI&&ArtI.updateQuotaFromResponse) ArtI.updateQuotaFromResponse(res);
    if(!res.ok) throw new Error('HTTP '+res.status);
    return res.json();
  }

  var HIST_KEY='arti-tr-history', HIST_MAX=20;
  function loadHistory(){ try{ return JSON.parse(localStorage.getItem(HIST_KEY))||[]; }catch(e){ return []; } }
  function saveHistory(arr){ try{ localStorage.setItem(HIST_KEY, JSON.stringify(arr.slice(0,HIST_MAX))); }catch(e){} }
  function addHistory(item){ var h=loadHistory(); h.unshift(item); saveHistory(h); }

  function renderHistory(wrap, s){
    if(!wrap) return;
    var h=loadHistory();
    if(!h.length){ wrap.innerHTML=''; return; }
    var html='<div class="tr-hist-head"><span>'+s.hist+'</span>'+
      '<button class="tr-hist-clear" id="trHistClear">'+s.clear+'</button></div>';
    h.forEach(function(it,idx){
      html+='<div class="tr-hist-item">'+
        '<div class="tr-hist-txt"><div class="tr-hist-src">'+esc(it.src||'')+'</div>'+
        '<div class="tr-hist-tgt">'+esc(it.target||'')+'</div></div>'+
        '<button class="tr-hist-play" data-i="'+idx+'">🔊</button></div>';
    });
    wrap.innerHTML=html;
    var clr=wrap.querySelector('#trHistClear');
    if(clr) clr.onclick=function(){ saveHistory([]); renderHistory(wrap,s); };
    wrap.querySelectorAll('.tr-hist-play').forEach(function(btn){
      btn.onclick=function(){
        var it=loadHistory()[parseInt(btn.getAttribute('data-i'),10)];
        if(it) speakTTS(it.target, it.to);
      };
    });
  }

  function renderResult(d, box, s){
    var h='';
    h+='<div class="tr-warn" id="trWarn" style="display:none"></div>';
    h+='<div class="tr-target">'+esc(d.target||'')+'</div>';
    h+='<div class="tr-translit" id="trTranslit">'+s.checking+'</div>';
    h+='<div class="tr-back" id="trBack"></div>';
    h+='<div class="tr-actions">';
    h+='<button class="tr-play" id="trPlay">🔊 '+s.play+'</button>';
    h+='<button class="tr-copy" id="trCopy">📋 '+s.copy+'</button>';
    h+='</div>';
    box.innerHTML=h;
    var cb=box.querySelector('#trCopy');
    cb.onclick=function(){
      navigator.clipboard.writeText(d.target||'').then(function(){
        cb.textContent='✓ '+s.copied;
        setTimeout(function(){cb.innerHTML='📋 '+s.copy;},1500);
      });
    };
    var pb=box.querySelector('#trPlay');
    pb.onclick=function(){ speakTTS(d.target||'', state.tgt); };
    // habla el resultado de inmediato, sin esperar a la verificación
    speakTTS(d.target||'', state.tgt);
  }

  // fase 2: rellena transliteración + back-translation + aviso cuando llega la verificación
  function updateVerification(v, box, s){
    var tl=box.querySelector('#trTranslit');
    if(tl){ if(v && v.transliteration){ tl.textContent=v.transliteration; } else { tl.style.display='none'; } }
    var bk=box.querySelector('#trBack');
    if(bk && v && v.backTranslation){ bk.innerHTML='<span class="tr-back-label">'+s.back+':</span> '+esc(v.backTranslation); }
    var w=box.querySelector('#trWarn');
    if(w && v && v.match===false){ w.textContent='⚠️ '+s.warn; w.style.display='block'; }
  }
  function clearVerifyHint(box){
    var tl=box.querySelector('#trTranslit');
    if(tl) tl.style.display='none';
  }

  function dirLabel(){
    var N={es:'ES',en:'EN',th:'TH'};
    return N[state.src]+' → '+N[state.tgt];
  }

  function openTranslate(){
    var s=STR[uiLang()]||STR.es;
    initDirection();
    Modal.open({title:s.title,render:function(){}});
    var body=Modal.el.querySelector('#modalBody');
    body.innerHTML=
      '<div class="tr-dir"><span id="trDir">'+dirLabel()+'</span>'+
      '<button class="tr-swap" id="trSwap" title="'+s.swap+'">'+
      '<i class="ti ti-arrows-exchange"></i></button></div>'+
      '<div class="tr-input-row">'+
      '<textarea class="tr-ta" id="trTa" rows="3" placeholder="'+
      s.ph+'"></textarea>'+
      '<button class="tr-mic" id="trMic">'+
      '<i class="ti ti-microphone"></i></button></div>'+
      '<button class="tr-go" id="trGo">'+s.btn+'</button>'+
      '<div class="tr-result" id="trRes"></div>'+
      '<div class="tr-history" id="trHistWrap"></div>';
    var ta=body.querySelector('#trTa');
    var mic=body.querySelector('#trMic');
    var go=body.querySelector('#trGo');
    var res=body.querySelector('#trRes');
    var dir=body.querySelector('#trDir');
    var swap=body.querySelector('#trSwap');
    var histWrap=body.querySelector('#trHistWrap');
    renderHistory(histWrap,s);

    if(!micSupported()){ mic.style.display='none'; }
    mic.onclick=function(){
      if(state.listening){ stopMic(mic,s); }
      else { ta.value=''; res.innerHTML=''; startMic(ta,mic,s); }
    };
    swap.onclick=function(){
      swapDirection();
      dir.textContent=dirLabel();
      go.textContent=(state.tgt==='th')?s.btn:s.btnRev;
      res.innerHTML='';
    };
    go.onclick=async function(){
      var text=ta.value.trim();
      if(!text) return;
      if(state.listening) stopMic(mic,s);
      go.disabled=true;
      primeTTS();   // desbloqueo de voz dentro del gesto (clic en Traducir)
      res.innerHTML='<div class="tr-loading"><div class="mn-spinner">'+
        '</div><p>'+s.loading+'</p></div>';
      try{
        var d=await callTranslate(text);
        renderResult(d,res,s);            // muestra + habla el thai ya
        addHistory({src:text,target:d.target||'',from:state.src,to:state.tgt});
        renderHistory(histWrap,s);
        // fase 2 en segundo plano: translit + verificación + ⚠️
        callVerify(text, d.target||'')
          .then(function(v){ updateVerification(v,res,s); })
          .catch(function(){ clearVerifyHint(res); });
      }catch(e){
        res.innerHTML='<p class="mn-error">'+s.err+'</p>';
      }
      go.disabled=false;
    };
    ta.focus();
    // la barra dice "toca el micro y habla": arrancamos el micro nada más abrir
    if(micSupported()) startMic(ta,mic,s);
  }

  window.ArtI=window.ArtI||{};
  window.ArtI.openTranslate=openTranslate;
})();
