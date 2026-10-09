document.addEventListener("DOMContentLoaded", async () => {
  await I18N.load(I18N.current);
  document.querySelectorAll(".pill[data-lang]").forEach(pill => {
    pill.addEventListener("click", () => I18N.load(pill.dataset.lang));
  });
});

// Registro del Service Worker — movido aqui desde un <script> inline de index.html
// para que la CSP pueda usar script-src 'self' sin 'unsafe-inline'.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw-v7.js", { updateViaCache: "none" }));
}
