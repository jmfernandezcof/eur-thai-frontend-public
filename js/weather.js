// Widget de clima TMD (Thai Meteorological Department).
// Llama a /api/weather (Traefik -> backend:3010 /weather).
// Construido con nodos DOM (sin innerHTML) para evitar cualquier riesgo de inyección.
//
// Dos usos:
//  1) Tarjeta única bajo el conversor (#wxCard): clima fijo de Bangkok.
//  2) Weather.cardWidget(lat, lon, placeName): crea un mini-widget reutilizable
//     que places.js inserta dentro del detalle de cada ubicación.
const Weather = {
  HOME: { lat: 13.7563, lon: 100.5018, key: "bangkok" }, // tarjeta única = Bangkok

  // cond TMD -> emoji + clave i18n. Mismo mapeo que demo-talay/app/weather.py.
  COND: {
    1: { emoji: "☀️",  k: "wx_clear" },
    2: { emoji: "🌤️", k: "wx_partly" },
    3: { emoji: "⛅",  k: "wx_cloudy" },
    4: { emoji: "☁️",  k: "wx_overcast" },
    5: { emoji: "🌦️", k: "wx_lightrain" },
    6: { emoji: "🌧️", k: "wx_rain" },
    7: { emoji: "⛈️", k: "wx_heavyrain" },
    8: { emoji: "⛈️", k: "wx_storm" },
    9: { emoji: "🌫️", k: "wx_fog" }
  },

  lang() { return (typeof I18N !== "undefined" && I18N.current) || "es"; },
  t(key, fallback) {
    if (typeof I18N !== "undefined" && I18N.get) { const v = I18N.get(key); if (v && v !== key) return v; }
    return fallback;
  },

  // --- Helpers de fetch ---
  async fetch(lat, lon) {
    const r = await fetch("/api/weather?lat=" + encodeURIComponent(lat) + "&lon=" + encodeURIComponent(lon));
    if (!r.ok) throw new Error("http " + r.status);
    return r.json();
  },

  condOf(cond) { return this.COND[cond] || { emoji: "🌡️", k: "wx_clear" }; },

  metaChip(iconClass, label, value) {
    const span = document.createElement("span");
    const i = document.createElement("i");
    i.className = "ti " + iconClass;
    span.appendChild(i);
    span.appendChild(document.createTextNode(" " + label + " " + value));
    return span;
  },

  // Chip compacto: solo icono + valor (sin etiqueta), para la fila junto a la temperatura.
  metaChipCompact(iconClass, value) {
    const span = document.createElement("span");
    const i = document.createElement("i");
    i.className = "ti " + iconClass;
    span.appendChild(i);
    span.appendChild(document.createTextNode(" " + value));
    return span;
  },

  // ====== Tarjeta única bajo el conversor (#wxCard, Bangkok fijo) ======
  els() {
    return {
      card:  document.getElementById("wxCard"),
      icon:  document.getElementById("wxIcon"),
      temp:  document.getElementById("wxTemp"),
      cond:  document.getElementById("wxCond"),
      place: document.getElementById("wxPlace"),
      meta:  document.getElementById("wxMeta")
    };
  },

  start() {
    if (!document.getElementById("wxCard")) return;
    this.refreshHome();
    // ponytail: setInterval fijo 15 min, pausado con pestaña oculta para no quemar cuota TMD.
    // Subir a refresco event-driven (visibilitychange -> refresh inmediato) solo si se pide.
    setInterval(() => { if (!document.hidden) this.refreshHome(); }, 15 * 60 * 1000);
  },

  async refreshHome() {
    const e = this.els();
    if (!e.card) return;
    this.setStatus(this.t("wx_loading", "Cargando clima…"));
    try {
      const d = await this.fetch(this.HOME.lat, this.HOME.lon);
      this.renderHome(d);
    } catch (err) {
      this.setStatus(this.t("wx_error", "Clima no disponible"));
      console.error("weather home failed", err);
    }
  },

  renderHome(d) {
    const e = this.els();
    if (!e.card) return;
    const cond = this.condOf(d.cond);
    if (e.icon) e.icon.textContent = cond.emoji;
    if (e.temp) e.temp.textContent = Math.round(Number(d.tc)) + "°";
    if (e.cond) e.cond.textContent = this.t(cond.k, "");
    if (e.place) e.place.textContent = "Bangkok";
    if (e.meta) {
      e.meta.replaceChildren();
      e.meta.appendChild(this.metaChipCompact("ti-droplet", Number(d.rh) + "%"));
      e.meta.appendChild(this.metaChipCompact("ti-wind", Number(d.ws10m) + " km/h"));
      if (Number(d.rain) > 0) e.meta.appendChild(this.metaChipCompact("ti-cloud-rain", Number(d.rain) + " mm"));
    }
    e.card.classList.add("wx-ready");
    e.card.classList.remove("wx-status");
  },

  setStatus(msg) {
    const e = this.els();
    if (!e.card) return;
    if (e.cond) e.cond.textContent = msg;
    if (e.temp) e.temp.textContent = "—";
    if (e.icon) e.icon.textContent = "🌡️";
    if (e.meta) e.meta.replaceChildren();
    if (e.place) e.place.textContent = "";
    e.card.classList.add("wx-status");
    e.card.classList.remove("wx-ready");
  },

  // ====== Mini-widget reutilizable para cards de ubicación ======
  // Devuelve un nodo .wx-inline ya en estado "cargando" y dispara el fetch que lo rellena.
  // placeName se muestra como zona (opcional). lat/lon obligatorios (dentro de Tailandia).
  cardWidget(lat, lon, placeName) {
    const box = document.createElement("div");
    box.className = "wx-inline wx-status";

    const icon = document.createElement("span");
    icon.className = "wx-inline-icon"; icon.setAttribute("aria-hidden", "true"); icon.textContent = "🌡️";
    const temp = document.createElement("span");
    temp.className = "wx-inline-temp"; temp.textContent = "—";
    const cond = document.createElement("span");
    cond.className = "wx-inline-cond"; cond.textContent = this.t("wx_loading", "Cargando clima…");
    const meta = document.createElement("span");
    meta.className = "wx-inline-meta";

    box.appendChild(icon); box.appendChild(temp); box.appendChild(cond); box.appendChild(meta);

    (async () => {
      try {
        const d = await this.fetch(lat, lon);
        const c = this.condOf(d.cond);
        icon.textContent = c.emoji;
        temp.textContent = Math.round(Number(d.tc)) + "°";
        cond.textContent = this.t(c.k, "");
        meta.replaceChildren();
        meta.appendChild(this.metaChip("ti-droplet", this.t("wx_humidity", "Humedad"), Number(d.rh) + "%"));
        meta.appendChild(this.metaChip("ti-wind", this.t("wx_wind", "Viento"), Number(d.ws10m) + " km/h"));
        if (Number(d.rain) > 0) meta.appendChild(this.metaChip("ti-cloud-rain", this.t("wx_rain_label", "Lluvia"), Number(d.rain) + " mm"));
        box.classList.add("wx-ready");
        box.classList.remove("wx-status");
      } catch (err) {
        cond.textContent = this.t("wx_error", "Clima no disponible");
        console.error("weather card failed", err);
      }
    })();

    return box;
  }
};

document.addEventListener("DOMContentLoaded", () => Weather.start());
document.addEventListener("i18n:changed", () => { if (document.getElementById("wxCard")) Weather.refreshHome(); });
