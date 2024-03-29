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

const Hapi = require('@hapi/hapi')
const H2o2 = require('@hapi/h2o2')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const qs = require('qs')
const crypto = require('crypto')
require('dotenv').config()

const key = Buffer.from('6b65796b65796b65796b65796b65796b65796b65796b6579', 'hex').toString('utf8')
let token

process.on('unhandledRejection', (err) => {
  console.log(err)
});

(async () => {
  const server = Hapi.server({
    port: process.env.PORT || 3000,
    compression: false,
    routes: {
      files: {
        relativeTo: path.join(__dirname, '../../')
      }
    }
  })
  await server.register(H2o2)
  await server.register(require('@hapi/inert'))
  await server.register({
    plugin: require('hapi-error')
  })

  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: { directory: {
      path: './public',
      index: ['index.html']
    } } })

  server.route({
    method: 'GET',
    path: '/config',
    handler: async (request, h) => {
      if (process.env.FORGE_CLIENT_ID && process.env.FORGE_CLIENT_SECRET) {
        const res = await axios({ method: 'POST',
          url: 'https://developer.api.autodesk.com/authentication/v1/authenticate',
          data: qs.stringify({
            grant_type: 'client_credentials',
            client_id: process.env.FORGE_CLIENT_ID,
            client_secret: process.env.FORGE_CLIENT_SECRET,
            scope: 'data:read'
          }),
          headers: {
            'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
          } })
        token = res.data.access_token
        return { env: 'AutodeskProduction', accessToken: '233', urn: process.env.urn }
      }
      return { env: 'Local', svf_path: process.env.svf_path }
    }
  })

  server.route({
    method: 'GET',
    path: '/proxy/{path*}',
    handler: { proxy: {
      mapUri: request => ({
        headers: { Authorization: 'Bearer ' + token },
        uri: 'https:///developer.api.autodesk.com/' + request.params.path }),
      onResponse: function (err, res, request, h, settings, ttl) {
        const cipher = crypto.createCipheriv('aes-192-ctr', key, Buffer.alloc(16, 0))
        return h.response(res.pipe(cipher))
      }
    } }
  })

  server.route({
    method: 'GET',
    path: '/models/{file*}',
    handler: (request, h) => {
      const filepath = path.join(__dirname, '../../public/models', request.params.file)
      if (!fs.existsSync(filepath)) return h.response().code(404)
      const cipher = crypto.createCipheriv('aes-192-ctr', key, Buffer.alloc(16, 0))
      return h.response(fs.createReadStream(filepath).pipe(cipher))
    } })

  await server.start()
  console.log('Server running on %s', server.info.uri)
})()
