const CACHE='brike-radar-v8'
const SHELL=['/','/manifest.webmanifest','/brike-icon.svg','/brike-maskable.svg']

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  )
})

self.addEventListener('fetch',event=>{
  const request=event.request
  if(request.method!=='GET')return

  const url=new URL(request.url)
  if(url.origin!==self.location.origin)return

  // Plan images change frequently during visual iteration. Never serve a stale
  // cached/corrupted version before trying the network.
  if(url.pathname.startsWith('/plans/')){
    event.respondWith(
      fetch(new Request(request,{cache:'reload'}))
        .catch(async()=>{
          const cached=await caches.match(request)
          return cached||Response.error()
        })
    )
    return
  }

  if(request.mode==='navigate'){
    event.respondWith(
      fetch(request)
        .then(response=>{
          if(response.ok){
            const copy=response.clone()
            void caches.open(CACHE).then(cache=>cache.put('/',copy)).catch(()=>{})
          }
          return response
        })
        .catch(async()=>{
          const cached=await caches.match('/')
          return cached||Response.error()
        })
    )
    return
  }

  // Vite generates versioned JS/CSS files. Prefer the current deployment and
  // only use the cached copy as an offline fallback so an older worker cannot
  // keep the app on stale startup code.
  if(url.pathname.startsWith('/assets/')){
    event.respondWith(
      fetch(new Request(request,{cache:'no-store'}))
        .then(response=>{
          if(response.ok){
            const copy=response.clone()
            void caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{})
          }
          return response
        })
        .catch(async()=>{
          const cached=await caches.match(request)
          return cached||Response.error()
        })
    )
    return
  }

  event.respondWith(
    caches.match(request).then(cached=>{
      const network=fetch(request)
        .then(response=>{
          if(response.ok&&url.pathname!=='/sw.js'){
            // Clone immediately, before the browser starts consuming the returned body.
            const copy=response.clone()
            void caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{})
          }
          return response
        })
        .catch(()=>{
          if(cached)return cached
          return Response.error()
        })

      return cached||network
    })
  )
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
