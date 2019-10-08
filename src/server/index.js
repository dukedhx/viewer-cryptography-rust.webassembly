/////////////////////////////////////////////////////////////////////
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
/////////////////////////////////////////////////////////////////////

const Hapi = require('@hapi/hapi');

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const key = Buffer.from('6b65796b65796b65796b65796b65796b65796b65796b6579', 'hex').toString('utf8');

process.on('unhandledRejection', (err) => {

    console.log(err);
});

(async () => {

    const server = Hapi.server({
        port: 3000,
        host: 'localhost',
         compression: false,
         routes: {
           files: {
               relativeTo: path.join(__dirname, '../../')
           }
       }
    });

    await server.register(require('@hapi/inert'));
    await server.register({
        plugin: require('hapi-error')
      });

      server.route({
      method: 'GET',
      path: '/{param*}',
      handler:  {directory: {
            path: './public',
            index: ['index.html']
        }}});

    server.route({
    method: 'GET',
    path: '/models/{file*}',
    handler: (request, h) => {

        const filepath = path.join(__dirname,'../../public/models',request.params.file);
        if(!fs.existsSync(filepath)) return h.response().code(404);
      const  cipher = crypto.createCipheriv('aes-192-ctr', key, Buffer.alloc(16, 0));
      return h.response(fs.createReadStream(filepath).pipe(cipher))
    }});



    await server.start();
    console.log('Server running on %s', server.info.uri);
})();
