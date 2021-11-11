/// //////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Forge Partner Development
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/// //////////////////////////////////////////////////////////////////
let clientReady = false

importScripts(`/${wasm_package_name}.js`)

WebAssembly.compileStreaming(fetch(`/${wasm_package_name}_bg.wasm`)).then(mod => WebAssembly.instantiate(mod, { imports: {} }).then(instance => {
  self.wasm = instance.exports
  tryinitViewer()
}))

self.addEventListener('install', event => {
  console.log('installing')
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', event => {
  console.log('activating')
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', event => {
  event.respondWith(
    async function () {
      if (/http(s)?\:\/\/.+\/(models|proxy)/.test(event.request.url)) {
        const response = await fetch(event.request)
        if (response.status != 200) return response
        const reader = response.body.getReader()
        const url = event.request.url
        const stream = new ReadableStream({
          start (controller) {
            function push () {
              reader.read().then(({ done, value }) => {
                if (done) {
                  controller.close()
                  finish(url)
                  return
                }
                controller.enqueue(decrypt(value, url))
                push()
              })
            };

            push()
          }
        })

        return new Response(stream)
      } else { return fetch(event.request) }
    }())
})

self.onmessage = function (e) {
  clientReady = true
  self[e.data]()
}

self.tryinitViewer = function () {
  if (clientReady && self.wasm) { self.clients.matchAll().then(clients => clients[0].postMessage('tryinitViewer')) }
}
