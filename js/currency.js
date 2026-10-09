(function(){
  var FLAGS={EUR:'eu',USD:'us',GBP:'gb',THB:'th'};
  var I18N_FOOT={es:'Tasas BCE',en:'ECB rates',th:'อัตรา ECB'};
  var rates=null,fetchedDate=null;
  var from,to,fv,tv,foot,fFrom,fTo,swap;

  function parseNum(s){return parseFloat(String(s).replace(/\./g,'').replace(/,/g,'.'))||0;}
  function curLang(){return (typeof I18N!=='undefined'&&I18N.current)?I18N.current:'es';}
  function localeOf(l){return l==='th'?'th-TH':(l==='en'?'en-US':'es-ES');}
  function pretty(n,l){return n.toLocaleString(localeOf(l),{maximumFractionDigits:2});}
  function conv(a,x,y){return (a/rates[x])*rates[y];}
  function fmtDate(d){if(!d)return '';var p=d.split('-');return p[2]+'/'+p[1]+'/'+p[0];}
  function updFlags(){fFrom.src='/assets/flags/'+FLAGS[from.value]+'.svg';fTo.src='/assets/flags/'+FLAGS[to.value]+'.svg';}
  function updFoot(){if(!rates){foot.textContent='—';return;}var l=curLang();foot.textContent='1 '+from.value+' = '+pretty(conv(1,from.value,to.value),l)+' '+to.value+' · '+I18N_FOOT[l]+' · '+fmtDate(fetchedDate);}
  function recalcTo(){if(!rates)return;tv.value=pretty(conv(parseNum(fv.value),from.value,to.value),curLang());updFlags();updFoot();}
  function recalcFrom(){if(!rates)return;fv.value=pretty(conv(parseNum(tv.value),to.value,from.value),curLang());updFlags();updFoot();}

  function wire(){
    from=document.getElementById('curFrom');to=document.getElementById('curTo');
    fv=document.getElementById('curFromAmt');tv=document.getElementById('curToAmt');
    foot=document.getElementById('curDetail');
    fFrom=document.getElementById('curFromFlag');fTo=document.getElementById('curToFlag');
    swap=document.getElementById('curSwap');
    if(!from||!to||!fv||!tv||!foot)return;
    fv.addEventListener('input',recalcTo);
    tv.addEventListener('input',recalcFrom);
    fv.addEventListener('blur',function(){fv.value=pretty(parseNum(fv.value),curLang());});
    tv.addEventListener('blur',function(){tv.value=pretty(parseNum(tv.value),curLang());});
    from.addEventListener('change',recalcTo);
    to.addEventListener('change',recalcTo);
    swap.addEventListener('click',function(){var a=from.value;from.value=to.value;to.value=a;recalcTo();});
    window.addEventListener('i18n:changed',function(){if(rates){recalcTo();}else{updFoot();}});
  }

  function load(){
    fetch('/api/rate').then(function(r){return r.json();}).then(function(j){
      if(!j||!j.rates)throw new Error('no rates');
      rates=j.rates;fetchedDate=j.date||null;
      recalcTo();
    }).catch(function(e){foot.textContent='—';console.error('rate fetch failed',e);});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){wire();load();});
  else{wire();load();}
})();
