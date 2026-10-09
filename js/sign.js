/* sign.js — AI Sign Translator for ArtI
   Photo → POST /api/vision → canvas cleaned image + translated text
   Requires: modal.js, beta.js, i18n.js
*/
(function(){
  const API = '/api/vision';
  const MAX_SIZE = 1600;
  const LANG_MAP = {es:'es',en:'en',th:'en'};
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  var STR = {
    es:{scan:'Traducir cartel',loading:'Traduciendo cartel...',
      wait:'Preparando el motor de imagen... (la primera vez tarda mas)',
      warn:'Traducción por IA — puede contener errores.',
      empty:'No se detectó texto tailandés.',
      err:'Error al traducir. Inténtalo de nuevo.',
      retry:'Otra foto',save:'Guardar imagen'},
    en:{scan:'Translate sign',loading:'Translating sign...',
      wait:'Warming up the image engine... (first run is slower)',
      warn:'AI translation — may contain errors.',
      empty:'No Thai text detected.',
      err:'Failed to translate. Try again.',
      retry:'Another photo',save:'Save image'},
    th:{scan:'แปลป้าย',loading:'กำลังแปลป้าย...',
      wait:'กำลังเตรียมระบบ... (ครั้งแรกอาจช้า)',
      warn:'แปลโดย AI — อาจมีข้อผิดพลาด',
      empty:'ไม่พบข้อความภาษาไทย',
      err:'แปลไม่สำเร็จ ลองอีกครั้ง',
      retry:'ถ่ายใหม่',save:'บันทึกภาพ'}
  };

  function capturePhoto(){
    return new Promise(function(resolve,reject){
      var inp=document.createElement('input');
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
      var img=new Image();
      img.onload=function(){
        var w=img.width,h=img.height;
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

  function fitText(ctx,text,maxW){
    var size=ctx.measureText(text);
    return size.width<=maxW;
  }

  function renderCanvas(data,container,s){
    var blocks=data.blocks||[];
    if(!blocks.length){
      container.innerHTML='<p class="sg-empty">'+s.empty+'</p>';
      return;
    }
    var warn=document.createElement('div');
    warn.className='sg-warn';
    warn.textContent='⚠️ '+s.warn;
    container.appendChild(warn);

    var wrap=document.createElement('div');
    wrap.className='sg-canvas-wrap';
    container.appendChild(wrap);
    var cv=document.createElement('canvas');
    cv.className='sg-canvas';
    wrap.appendChild(cv);
    var img=new Image();
    img.onload=function(){
      var W=Math.min(img.width,wrap.clientWidth||600);
      var scale=W/img.width;
      var H=Math.round(img.height*scale);
      cv.width=W; cv.height=H;
      var ctx=cv.getContext('2d');
      ctx.drawImage(img,0,0,W,H);
      blocks.forEach(function(b){
        if(!b.translation) return;
        var bx=b.box;
        var x=bx.x*scale,y=bx.y*scale;
        var w=bx.w*scale,h=bx.h*scale;
        var fs=Math.max(10,Math.floor(h*0.7));
        ctx.font='bold '+fs+'px sans-serif';
        while(fs>10&&!fitText(ctx,b.translation,w-4)){
          fs--; ctx.font='bold '+fs+'px sans-serif';
        }
        ctx.fillStyle='rgba(0,0,0,0.55)';
        ctx.fillRect(x,y,w,h);
        ctx.fillStyle='#ffffff';
        ctx.textBaseline='middle';
        ctx.fillText(b.translation,x+2,y+h/2,w-4);
      });
      var btnSave=document.createElement('a');
      btnSave.className='sg-save';
      btnSave.textContent='📥 '+s.save;
      btnSave.href=cv.toDataURL('image/jpeg',0.9);
      btnSave.download='arti-sign-translated.jpg';
      container.appendChild(btnSave);
    };
    img.src=data.cleaned_image;

    var list=document.createElement('div');
    list.className='sg-list';
    blocks.forEach(function(b){
      if(!b.translation) return;
      var row=document.createElement('div');
      row.className='sg-row';
      row.innerHTML='<span class="sg-orig">'+
        esc(b.original)+'</span><span class="sg-arrow">→</span>'+
        '<span class="sg-tr">'+esc(b.translation)+'</span>';
      list.appendChild(row);
    });
    container.appendChild(list);
  }

  async function scanSign(){
    var lang=(typeof I18N!=='undefined'&&I18N.current)||'es';
    var s=STR[lang]||STR.es;
    var file;
    try{ file=await capturePhoto(); }catch(e){ return; }
    Modal.open({title:s.scan,render:function(body){
      body.innerHTML='<div class="sg-loading"><div class="mn-spin"></div>'+
        '<p id="sgLoadMsg">'+s.loading+'</p></div>';
    }});
    var waitTimer=setTimeout(function(){
      var el=Modal.el&&Modal.el.querySelector('#sgLoadMsg');
      if(el) el.textContent=s.wait;
    },8000);
    try{
      var b64=await toBase64(file);
      var data=await callAPI(b64);
      clearTimeout(waitTimer);
      var body=Modal.el.querySelector('#modalBody');
      body.innerHTML='';
      renderCanvas(data,body,s);
      var retry=document.createElement('button');
      retry.className='mn-retry';
      retry.textContent='📸 '+s.retry;
      retry.onclick=function(){ Modal.close(); scanSign(); };
      body.appendChild(retry);
    }catch(e){
      clearTimeout(waitTimer);
      var body=Modal.el.querySelector('#modalBody');
      body.innerHTML='<p class="mn-error">'+s.err+'</p>';
    }
  }

  window.ArtI=window.ArtI||{};
  window.ArtI.scanSign=scanSign;
})();
