const CACHE='tgm-alarm-center-v3';
const INDEX='./index.html';
const ASSETS=['./','./manifest.webmanifest','./icon.svg','./runtime-guards.js'];

async function guardedIndex(){
  const response=await fetch(INDEX,{cache:'no-store'});
  const source=await response.text();
  const injected=source.includes('runtime-guards.js')?source:source.replace('</body>','<script src="./runtime-guards.js"></script></body>');
  return new Response(injected,{status:response.status,statusText:response.statusText,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'}});
}

self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  try{cache.put(INDEX,await guardedIndex())}catch{await cache.add(INDEX)}
  await cache.addAll(ASSETS);
  await self.skipWaiting();
})()));

self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.pathname.endsWith('/index.html')||url.pathname.endsWith('/')){
    event.respondWith(caches.match(INDEX).then(cached=>cached||guardedIndex().then(async response=>{const cache=await caches.open(CACHE);await cache.put(INDEX,response.clone());return response})));return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(async response=>{const cache=await caches.open(CACHE);await cache.put(event.request,response.clone());return response}).catch(()=>cached)));
});
