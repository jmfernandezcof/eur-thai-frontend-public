const Places = {
  data: null,
  bodyEl: null,
  openSlug: null,
  STR: {
    es: { cta: "Web oficial de turismo", nodesc: "Próximamente más información." },
    en: { cta: "Official tourism site", nodesc: "More info coming soon." },
    th: { cta: "เว็บไซต์ท่องเที่ยวอย่างเป็นทางการ", nodesc: "ข้อมูลเพิ่มเติมเร็วๆ นี้" }
  },
  lang() { return (typeof I18N !== "undefined" && I18N.current) || "es"; },
  async load() {
    try {
      const res = await fetch("/data/places.json");
      this.data = (await res.json()).destinations;
      this.render();
    } catch (e) { console.error("places load failed", e); }
  },
  pick(obj, lang) { return (obj && (obj[lang] || obj.es)) || ""; },
  render() {
    if (!this.data) return;
    const lang = this.lang();
    const cont = document.getElementById("destScroll");
    if (!cont) return;
    cont.innerHTML = this.data.map(d => (
      '<article class="dest-card" data-slug="' + d.slug + '">' +
        '<div class="dest-photo-wrap">' +
          '<img class="dest-photo" src="' + d.photo + '" alt="' + this.pick(d.title, lang) + '" loading="lazy">' +
          '<span class="dest-badge">' + this.pick(d.badge, lang) + '</span>' +
        '</div>' +
        '<div class="dest-body">' +
          '<div class="dest-title">' + this.pick(d.title, lang) + '</div>' +
          '<div class="dest-short">' + this.pick(d.short, lang) + '</div>' +
        '</div>' +
      '</article>'
    )).join("");
    cont.onclick = (e) => {
      const card = e.target.closest(".dest-card");
      if (card) this.openDetail(card.dataset.slug);
    };
  },
  openDetail(slug) {
    this.openSlug = slug;
    const d = this.data && this.data.find(x => x.slug === slug);
    if (!d) return;
    const lang = this.lang();
    Modal.open({ owner: "places", title: this.pick(d.title, lang), subtitle: this.pick(d.short, lang), render: (el) => { this.bodyEl = el; this.renderDetail(); } });
  },
  renderDetail() {
    const el = this.bodyEl;
    const d = this.data && this.data.find(x => x.slug === this.openSlug);
    if (!el || !d) return;
    const lang = this.lang();
    const t = this.STR[lang] || this.STR.es;
    const longtxt = this.pick(d.long, lang) || t.nodesc;
    const badge = this.pick(d.badge, lang);
    const link = d.url ? '<a class="place-cta" href="' + d.url + '" target="_blank" rel="noopener"><i class="ti ti-external-link"></i> ' + t.cta + '</a>' : '';
    const affOn = !!(window.ArtI && window.ArtI.affEnabled && window.ArtI.affEnabled());
    const aff = (affOn && d.affiliate && d.affiliate.tours_url)
      ? '<a class="place-cta place-cta-aff" href="' + d.affiliate.tours_url + '" target="_blank" rel="sponsored noopener"><i class="ti ti-ticket"></i> ' + this.pick(d.affiliate.label, lang) + '</a>'
      : '';
    el.innerHTML =
      '<div class="place-photo-wrap"><img class="place-photo" src="' + d.photo + '" alt="' + this.pick(d.title, lang) + '">' + (badge ? '<span class="place-badge">' + badge + '</span>' : '') + '</div>' +
      '<p class="place-desc">' + longtxt + '</p>' + aff + link;
    // Clima TMD bajo los botones (widget como nodo DOM, sin innerHTML)
    if (d.coords && typeof Weather !== "undefined" && Weather.cardWidget) {
      el.appendChild(Weather.cardWidget(d.coords.lat, d.coords.lon, this.pick(d.title, lang)));
    }
  }
};
document.addEventListener("DOMContentLoaded", () => Places.load());
document.addEventListener("i18n:changed", () => {
  Places.render();
  if (typeof Modal !== "undefined" && Modal.owner === "places" && Places.bodyEl && Places.openSlug) {
    const d = Places.data.find(x => x.slug === Places.openSlug);
    const lang = Places.lang();
    const mt = Modal.el.querySelector("#modalTitle"); if (mt) mt.textContent = Places.pick(d.title, lang);
    const ms = Modal.el.querySelector("#modalSub"); if (ms) ms.textContent = Places.pick(d.short, lang);
    Places.renderDetail();
  }
});
