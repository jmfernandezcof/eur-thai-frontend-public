const CACHE='arti-v6';
const CORE=['/','/css/styles.css','/js/i18n.js','/js/modal.js','/js/phrases.js','/js/phones.js','/js/places.js','/js/affiliate.js','/js/currency.js','/js/menu.js','/js/sign.js','/js/translate.js','/js/beta.js','/js/invites.js','/js/app.js','/manifest.json','/assets/bg-hero.webp','/assets/bg-hero.jpg'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.pathname.startsWith('/api/')) return;
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put('/',copy));return r;}).catch(()=>caches.match('/')));
    return;
  }
  if(url.pathname.startsWith('/data/')){
    e.respondWith(fetch(req).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy));return r;}).catch(()=>caches.match(req)));
    return;
  }
  e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{if(r&&r.status===200){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy));}return r;})));
});
