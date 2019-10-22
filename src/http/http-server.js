//
//  Created by Mingliang Chen on 17/8/1.
//  illuspas[a]gmail.com
//  Copyright (c) 2018 Nodemedia. All rights reserved.
//


const Fs = require('fs');
const path = require('path');
const Http = require('http');
const Https = require('https');
const WebSocket = require('ws');
const Express = require('express');
const bodyParser = require('body-parser');
const NodeFlvSession = require('../flv/node_flv_session');
const HTTP_PORT = 80;
const HTTPS_PORT = 443;
const HTTP_MEDIAROOT = './media';
const Logger = require('../core/node_core_logger');
const context = require('../core/node_core_ctx');

const NodeHttpServer = (config) => {
  const port = config.http.port || HTTP_PORT;
  this.mediaroot = config.http.mediaroot || HTTP_MEDIAROOT;
  const app = Express();

  app.all('*', (req, res, next) => {
    res.header("Access-Control-Allow-Origin", config.http.allow_origin);
    res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Credentials", true);
    req.method === "OPTIONS" ? res.sendStatus(200) : next();
  });
  app.use(Express.static(this.mediaroot));

  if (config.http.webroot) {
    app.use(Express.static(config.http.webroot));
  }

  app.use(bodyParser.urlencoded({ extended: true }));

  const httpServer = Http.createServer(app);

  /**
   * ~ openssl genrsa -out privatekey.pem 1024
   * ~ openssl req -new -key privatekey.pem -out certrequest.csr 
   * ~ openssl x509 -req -in certrequest.csr -signkey privatekey.pem -out certificate.pem
   */
  if (config.https) {
    // let options = {
    //   key: Fs.readFileSync(config.https.key),
    //   cert: Fs.readFileSync(config.https.cert)
    // };
    // this.sport = config.https.port ? config.https.port : HTTPS_PORT;
    // this.httpsServer = Https.createServer(options, app);
  }

  const run = () => {
    httpServer.listen(port, () => {
      Logger.log(`Node Media Http Server started on port: ${port}`);
    });

    httpServer.on('error', (e) => {
      Logger.error(`Node Media Http Server ${e}`);
    });

    httpServer.on('close', () => {
      Logger.log('Node Media Http Server Close.');
    });

    this.wsServer = new WebSocket.Server({ server: httpServer });

    this.wsServer.on('connection', (ws, req) => {
      req.nmsConnectionType = 'ws';
      this.onConnect(req, ws);
    });

    this.wsServer.on('listening', () => {
      Logger.log(`Node Media WebSocket Server started on port: ${port}`);
    });
    
    this.wsServer.on('error', (e) => {
      Logger.error(`Node Media WebSocket Server ${e}`);
    });

    if (this.httpsServer) {
      this.httpsServer.listen(this.sport, () => {
        Logger.log(`Node Media Https Server started on port: ${this.sport}`);
      });

      this.httpsServer.on('error', (e) => {
        Logger.error(`Node Media Https Server ${e}`);
      });

      this.httpsServer.on('close', () => {
        Logger.log('Node Media Https Server Close.');
      });

      this.wssServer = new WebSocket.Server({ server: this.httpsServer });

      this.wssServer.on('connection', (ws, req) => {
        req.nmsConnectionType = 'ws';
        this.onConnect(req, ws);
      });

      this.wssServer.on('listening', () => {
        Logger.log(`Node Media WebSocketSecure Server started on port: ${this.sport}`);
      });
      this.wssServer.on('error', (e) => {
        Logger.error(`Node Media WebSocketSecure Server ${e}`);
      });
    }

    context.nodeEvent.on('postPlay', (id, args) => {
      context.stat.accepted++;
    });

    context.nodeEvent.on('postPublish', (id, args) => {
      context.stat.accepted++;
    });

    context.nodeEvent.on('doneConnect', (id, args) => {
      let session = context.sessions.get(id);
      let socket = session instanceof NodeFlvSession ? session.req.socket : session.socket;
      context.stat.inbytes += socket.bytesRead;
      context.stat.outbytes += socket.bytesWritten;
    });
  }

  const stop = () => {
    httpServer.close();
    if (httpsServer) {
      httpsServer.close();
    }
  }

  return { run, stop }
}

module.exports = NodeHttpServer;