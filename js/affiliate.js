/* affiliate.js — "Antes de viajar" + visibilidad de afiliación para ArtI
   - TDAC (tarjeta de llegada): SIEMPRE visible — oficial, gratis, útil.
   - eSIM + seguro de viaje + CTA de tours: visibles si afEnabled() = true.

   Requiere: modal.js, i18n.js, beta.js (para window.ArtI.isBeta)

   >>> VISIBILIDAD DE LA AFILIACIÓN <<<
   afEnabled() = AFF_LIVE  ||  es beta tester
   - AFF_LIVE = false (hoy): la afiliación SOLO la ven beta testers (?beta=...),
     igual que las herramientas de IA. El público NO la ve. Sin links mágicos aparte.
   - AFF_LIVE = true: lanzamiento público — la ve TODO el mundo (es lo que da dinero).
     Poner true el día que estén las altas + URLs reales pegadas.
*/
(function(){
  var AFF_LIVE = false;   // ← true = afiliación pública para TODOS (día del lanzamiento)

  var TDAC_URL = 'https://tdac.immigration.go.th';
  // Placeholders reales (homepages). Sustituir por links con afiliado al dar de alta.
  var ESIM_URL = 'https://saily.com';
  var INS_URL  = 'https://www.iatiseguros.com';

  window.ArtI = window.ArtI || {};
  // Mientras AFF_LIVE = false, los beta testers (mismo candado que la IA) ya lo ven.
  window.ArtI.affEnabled = function(){
    return AFF_LIVE || !!(window.ArtI.isBeta && window.ArtI.isBeta());
  };

  var STR = {
    es:{
      title:'Antes de viajar', sub:'Lo esencial para entrar en Tailandia',
      tdac_t:'Tarjeta de llegada (TDAC)',
      tdac_d:'Obligatoria para todo extranjero. Gratis. Rellénala hasta 3 días antes de llegar.',
      tdac_b:'Rellenar en la web oficial',
      tdac_warn:'Gratis y solo en la web oficial del gobierno. Cuidado con webs que cobran.',
      esim_t:'eSIM: conéctate al aterrizar', esim_d:'Internet en el móvil sin cambiar de SIM.', esim_b:'Ver eSIM',
      ins_t:'Seguro de viaje', ins_d:'Cobertura médica durante tu estancia.', ins_b:'Ver seguros'
    },
    en:{
      title:'Before you go', sub:'The essentials to enter Thailand',
      tdac_t:'Arrival card (TDAC)',
      tdac_d:'Mandatory for every foreigner. Free. Submit it up to 3 days before arrival.',
      tdac_b:'Fill in on the official site',
      tdac_warn:'Free and only on the official government site. Beware of sites that charge fees.',
      esim_t:'eSIM: get online on landing', esim_d:'Mobile data without swapping your SIM.', esim_b:'View eSIMs',
      ins_t:'Travel insurance', ins_d:'Medical cover during your stay.', ins_b:'View insurance'
    },
    th:{
      title:'ก่อนเดินทาง', sub:'สิ่งจำเป็นสำหรับการเข้าประเทศไทย',
      tdac_t:'บัตรขาเข้า (TDAC)',
      tdac_d:'บังคับสำหรับชาวต่างชาติทุกคน ฟรี กรอกได้ล่วงหน้าไม่เกิน 3 วันก่อนเดินทางถึง',
      tdac_b:'กรอกที่เว็บไซต์ทางการ',
      tdac_warn:'ฟรีและทำได้เฉพาะเว็บไซต์ทางการของรัฐเท่านั้น ระวังเว็บที่เก็บค่าบริการ',
      esim_t:'eSIM: เชื่อมต่อทันทีที่ถึง', esim_d:'เน็ตมือถือโดยไม่ต้องเปลี่ยนซิม', esim_b:'ดู eSIM',
      ins_t:'ประกันการเดินทาง', ins_d:'ความคุ้มครองทางการแพทย์ระหว่างการเดินทาง', ins_b:'ดูประกัน'
    }
  };

  function getStr(){
    var lang = (typeof I18N!=='undefined' && I18N.current) || 'es';
    return STR[lang] || STR.es;
  }

  function itemHTML(icon, title, desc, href, btn, rel){
    return '<div class="trip-item">' +
      '<div class="trip-ico"><i class="ti ' + icon + '"></i></div>' +
      '<div class="trip-body">' +
        '<div class="trip-t">' + title + '</div>' +
        '<div class="trip-d">' + desc + '</div>' +
        '<a class="place-cta trip-cta" href="' + href + '" target="_blank" rel="' + rel + '">' + btn + ' <i class="ti ti-arrow-right"></i></a>' +
      '</div></div>';
  }

  function renderBody(body){
    var s = getStr();
    var html = '';
    // TDAC — siempre
    html += itemHTML('ti-id-badge-2', s.tdac_t, s.tdac_d, TDAC_URL, s.tdac_b, 'noopener');
    html += '<p class="trip-warn"><i class="ti ti-alert-triangle"></i> ' + s.tdac_warn + '</p>';
    // eSIM + seguro — solo con flag
    if(window.ArtI.affEnabled()){
      html += itemHTML('ti-device-mobile', s.esim_t, s.esim_d, ESIM_URL, s.esim_b, 'sponsored noopener');
      html += itemHTML('ti-shield-heart', s.ins_t, s.ins_d, INS_URL, s.ins_b, 'sponsored noopener');
    }
    body.innerHTML = '<div class="trip-list">' + html + '</div>';
  }

  function openTrip(){
    var s = getStr();
    Modal.open({ owner:'trip', title:s.title, subtitle:s.sub, render:renderBody });
  }
  window.ArtI.openTrip = openTrip;

  document.addEventListener('DOMContentLoaded', function(){
    var t = document.querySelector('[data-tool="trip"]');
    if(t) t.addEventListener('click', openTrip);
  });
  document.addEventListener('i18n:changed', function(){
    if(typeof Modal!=='undefined' && Modal.owner==='trip' && Modal.el){
      var s = getStr();
      var mt = Modal.el.querySelector('#modalTitle'); if(mt) mt.textContent = s.title;
      var ms = Modal.el.querySelector('#modalSub'); if(ms) ms.textContent = s.sub;
      var b = Modal.el.querySelector('#modalBody'); if(b) renderBody(b);
    }
  });
})();
