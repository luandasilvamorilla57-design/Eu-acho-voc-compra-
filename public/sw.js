const CACHE='brike-radar-v5'
const SHELL=['/','/manifest.webmanifest','/brike-icon.svg','/brike-maskable.svg']

self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));self.skipWaiting()})
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()})

self.addEventListener('fetch',event=>{
  const request=event.request
  if(request.method!=='GET')return
  const url=new URL(request.url)
  if(url.origin!==self.location.origin)return
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('/',copy));return response}).catch(()=>caches.match('/')))
    return
  }
  event.respondWith(caches.match(request).then(cached=>{
    const network=fetch(request).then(response=>{if(response.ok&&url.pathname!=='/sw.js')caches.open(CACHE).then(cache=>cache.put(request,response.clone()));return response}).catch(()=>cached)
    return cached||network
  }))
})

self.addEventListener('notificationclick',event=>{
  event.notification.close()
  event.waitUntil(
    clients.matchAll({type:'window',includeUncontrolled:true}).then(openClients=>{
      const existing=openClients.find(client=>'focus' in client)
      if(existing)return existing.focus()
      return clients.openWindow('/')
    })
  )
})
