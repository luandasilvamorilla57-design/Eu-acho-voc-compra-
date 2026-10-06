const CACHE='controle-plus-v10'
const SHELL=['/','/manifest.webmanifest?v=12','/control-plus-icon.svg','/control-plus-maskable.svg']

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))
})

self.addEventListener('fetch',event=>{
  const request=event.request
  if(request.method!=='GET')return
  const url=new URL(request.url)
  if(url.origin!==self.location.origin)return

  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(response=>{
      if(response.ok){const copy=response.clone();void caches.open(CACHE).then(cache=>cache.put('/',copy)).catch(()=>{})}
      return response
    }).catch(async()=>await caches.match('/')||Response.error()))
    return
  }

  if(url.pathname.startsWith('/assets/')){
    event.respondWith(fetch(new Request(request,{cache:'no-store'})).then(response=>{
      if(response.ok){const copy=response.clone();void caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{})}
      return response
    }).catch(async()=>await caches.match(request)||Response.error()))
    return
  }

  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
    if(response.ok&&url.pathname!=='/sw.js'){const copy=response.clone();void caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{})}
    return response
  })))
})
