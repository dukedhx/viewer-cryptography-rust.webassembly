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

import runtime from 'serviceworker-webpack-plugin/lib/runtime'
let readyToInitViewer = false
let viewer
let loadOptions

const container = document.createElement('DIV')
document.body.append(container)
document.body.append(document.createTextNode('Loading ...'))

if ('serviceWorker' in navigator) {
  const registration = runtime.register()

  navigator.serviceWorker.ready.then(() => {
    navigator.serviceWorker.onmessage = e => { if (e.data == 'tryinitViewer')tryinitViewer() }
    setTimeout(() => navigator.serviceWorker.controller.postMessage('tryinitViewer'), 500)
  })

  Promise.all([fetch('/config').then(res => res.json().then(obj => loadOptions = obj)), new Promise(res => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.type = 'text/css'
    link.href = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/style.min.css?v=v7.*'
    link.onload = () => res()
    document.head.append(link)
  }), new Promise(res => {
    const script = document.createElement('script')
    script.onload = () => res()
    script.src = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/viewer3D.min.js?v=v7.*'
    document.head.append(script)
  })]).then(() => {
    viewer = new Autodesk.Viewing.GuiViewer3D(container)
    Autodesk.Viewing.Initializer(loadOptions, () => {
      Autodesk.Viewing.endpoint.setEndpointAndApi(`${window.location.origin}/proxy`, 'derivativeV2')
      tryinitViewer()
    })
  })
} else alert('Service Worker support is not available for this browser!')

function initViewer () {
  if (loadOptions.urn) {
    Autodesk.Viewing.Document.load('urn:' + loadOptions.urn, doc => {
      viewer.start()
      viewer.loadDocumentNode(doc, doc.getRoot().getDefaultGeometry())
    })
  } else viewer.start(loadOptions['svf_path'] || svf_path)
}

function tryinitViewer () {
  if (readyToInitViewer) initViewer()
  else readyToInitViewer = true
}
