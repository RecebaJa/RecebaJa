// Service worker mínimo: habilita instalação do PWA sem armazenar dados financeiros em cache.
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",()=>{});
