/* menu.js — AI Menu Scanner for ArtI
   Captures photo → POST /api/menu → renders dish list with allergen badges
   Requires: modal.js, beta.js, i18n.js
*/
(function(){
  const API = '/api/menu';
  const MAX_SIZE = 1600;
  const LANG_MAP = {es:'es',en:'en',th:'en'};
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

  var STR = {
    es:{scan:'Escanear menú',take:'Haz una foto del menú',
      loading:'Analizando menú...',
      warn:'Detección por IA — puede contener errores. Confirma siempre con el personal de cocina.',
      empty:'No se detectaron platos. Prueba con otra foto.',
      err:'Error al analizar. Inténtalo de nuevo.',
      spice:['No pica','Suave','Medio','Muy picante'],
      vegan:'Vegano',veg:'Vegetariano',retry:'Otra foto'},
    en:{scan:'Scan menu',take:'Take a photo of the menu',
      loading:'Analyzing menu...',
      warn:'AI detection — may contain errors. Always confirm with kitchen staff.',
      empty:'No dishes detected. Try another photo.',
      err:'Analysis error. Try again.',
      spice:['Not spicy','Mild','Medium','Very spicy'],
      vegan:'Vegan',veg:'Vegetarian',retry:'Another photo'},
    th:{scan:'สแกนเมนู',take:'ถ่ายรูปเมนู',
      loading:'กำลังวิเคราะห์...',
      warn:'ตรวจจับโดย AI — อาจมีข้อผิดพลาด ยืนยันกับพนักงานเสมอ',
      empty:'ไม่พบรายการอาหาร ลองถ่ายใหม่',
      err:'เกิดข้อผิดพลาด ลองใหม่',
      spice:['ไม่เผ็ด','เผ็ดน้อย','เผ็ดกลาง','เผ็ดมาก'],
      vegan:'วีแกน',veg:'มังสวิรัติ',retry:'ถ่ายใหม่'}
  };

  function getStr(){
    var lang = (typeof I18N!=='undefined' && I18N.current)||'es';
    return STR[lang]||STR.es;
  }

  function capturePhoto(){
    return new Promise(function(resolve,reject){
      var inp = document.createElement('input');
      inp.type='file'; inp.accept='image/*';
      inp.capture='environment';
      inp.onchange=function(){
        if(!inp.files||!inp.files[0]) return reject('no file');
        resolve(inp.files[0]);
      };
      inp.click();
    });
  }

  function toBase64(file){
    return new Promise(function(resolve){
      var img = new Image();
      img.onload = function(){
        var w=img.width, h=img.height;
        if(w>MAX_SIZE||h>MAX_SIZE){
          var r=Math.min(MAX_SIZE/w,MAX_SIZE/h);
          w=Math.round(w*r); h=Math.round(h*r);
        }
        var c=document.createElement('canvas');
        c.width=w; c.height=h;
        c.getContext('2d').drawImage(img,0,0,w,h);
        var d=c.toDataURL('image/jpeg',0.85);
        resolve(d.split(',')[1]);
      };
      img.src=URL.createObjectURL(file);
    });
  }

  async function callAPI(b64){
    var lang=(typeof I18N!=='undefined'&&I18N.current)||'es';
    var target=LANG_MAP[lang]||'es';
    var res=await fetch(API,{
      method:'POST',
      headers:{'Content-Type':'application/json','x-arti-invite':(window.ArtI&&ArtI.inviteCode)?ArtI.inviteCode():''},
      body:JSON.stringify({image:b64,target:target})
    });
    if(window.ArtI&&ArtI.updateQuotaFromResponse) ArtI.updateQuotaFromResponse(res);
    if(!res.ok) throw new Error('HTTP '+res.status);
    return res.json();
  }

  var ALLERGEN_ICON = {
    spicy:'🌶️',peanut:'🥜',shellfish:'🦐',dairy:'🥛',
    gluten:'🌾',egg:'🥚',fish:'🐟',soy:'🫘',
    pork:'🐷',sesame:'⚪',coconut:'🥥'
  };
  var SPICE_COLOR = ['#6b7280','#f59e0b','#f97316','#ef4444'];

  function badgeHTML(allergens,spice,s){
    var h='';
    if(spice>0) h+='<span class="mn-badge" style="background:'+
      SPICE_COLOR[spice]+'">'+
      '🌶️'.repeat(spice)+' '+s.spice[spice]+'</span>';
    (allergens||[]).forEach(function(a){
      if(a==='spicy') return;
      var ico=ALLERGEN_ICON[a]||'⚠️';
      h+='<span class="mn-badge mn-badge-allergen">'+ico+' '+esc(a)+'</span>';
    });
    return h;
  }

  function renderResults(data, body, s){
    var dishes=data.dishes||[];
    if(!dishes.length){
      body.innerHTML='<p class="mn-empty">'+s.empty+'</p>';
      return;
    }
    var h='<div class="mn-warn">⚠️ '+s.warn+'</div>';
    h+='<div class="mn-list">';
    dishes.forEach(function(d){
      h+='<div class="mn-dish">';
      h+='<div class="mn-dish-head">';
      h+='<div class="mn-dish-info">';
      h+='<div class="mn-original">'+esc(d.original)+'</div>';
      h+='<div class="mn-translation">'+esc(d.translation)+'</div>';
      if(d.transliteration)
        h+='<div class="mn-translit">'+esc(d.transliteration)+'</div>';
      if(d.warnings)
        h+='<div class="mn-dish-warn">'+esc(d.warnings)+'</div>';
      h+='</div>';
      if(d.price) h+='<div class="mn-price">'+esc(d.price)+'฿</div>';
      h+='</div>';
      var tags=badgeHTML(d.allergens,d.spiceLevel,s);
      if(d.vegan) tags+='<span class="mn-badge mn-badge-green">🌱 '+s.vegan+'</span>';
      else if(d.vegetarian) tags+='<span class="mn-badge mn-badge-green">🥬 '+s.veg+'</span>';
      if(tags) h+='<div class="mn-badges">'+tags+'</div>';
      h+='</div>';
    });
    h+='</div>';
    body.innerHTML=h;
  }

  async function scanMenu(){
    var s=getStr();
    var file;
    try{ file=await capturePhoto(); }catch(e){ return; }
    Modal.open({
      title:'📷 '+s.scan, subtitle:s.loading,
      render:function(body){
        body.innerHTML='<div class="mn-loading"><div class="mn-spinner"></div><p>'+s.loading+'</p></div>';
      }
    });
    try{
      var b64=await toBase64(file);
      var data=await callAPI(b64);
      Modal.open({
        title:'📷 '+s.scan,
        subtitle:data.dishes?data.dishes.length+' platos':'',
        render:function(body){ renderResults(data,body,s); }
      });
    }catch(e){
      Modal.open({
        title:'📷 '+s.scan, subtitle:'Error',
        render:function(body){
          body.innerHTML='<p class="mn-empty">'+s.err+'</p>';
        }
      });
    }
  }

  // Expose for beta.js
  window.ArtI = window.ArtI || {};
  window.ArtI.scanMenu = scanMenu;
})();
