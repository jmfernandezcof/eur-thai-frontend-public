const I18N = {
  current: localStorage.getItem("arti-lang") || "es",
  data: {},
  async load(lang) {
    try {
      const res = await fetch("/i18n/" + lang + ".json");
      this.data = await res.json();
      this.current = lang;
      localStorage.setItem("arti-lang", lang);
      document.documentElement.lang = lang;
      this.apply();
    } catch (e) { console.error("i18n load failed", e); }
  },
  get(key) {
    return key.split(".").reduce((o, k) => o && o[k], this.data) ?? key;
  },
  apply() {
    document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = this.get(el.dataset.i18n); });
    document.querySelectorAll("[data-i18n-html]").forEach(el => { el.innerHTML = this.get(el.dataset.i18nHtml); });
    document.querySelectorAll(".pill[data-lang]").forEach(p => {
      p.classList.toggle("is-active", p.dataset.lang === this.current);
      p.setAttribute("aria-pressed", p.dataset.lang === this.current);
    });
    document.dispatchEvent(new CustomEvent("i18n:changed", { detail: { lang: this.current } }));
  }
};
