const Http = require('http');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const Express = require('express');
const HTTP_PORT = 991;
const Logger = require('../core/node_core_logger');
const context = require('../core/node_core_ctx');
const NodeFlvSession = require('./node_flv_session');


const NodeFlvServer = (config) => {
  const port = config.flv.port || HTTP_PORT;
  const app = Express();
  app.all('*', (req, res, next) => {
    res.header("Access-Control-Allow-Origin", config.http.allow_origin);
    res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Credentials", true);
    req.method === "OPTIONS" ? res.sendStatus(200) : next();
  });

  app.get('*.flv', (req, res, next) => {
    req.nmsConnectionType = 'http';
  });

  app.use(bodyParser.urlencoded({ extended: true }));

  const httpServer = Http.createServer(app);


  const run = () => {
    httpServer.listen(port, () => {
      Logger.log(`Node Media Flv Http Server started on port: ${port}`);
    });

    httpServer.on('error', (e) => {
      Logger.error(`Node Media Flv Http Server ${e}`);
    });

    httpServer.on('close', () => {
      Logger.log('Node Media Flv Http Server Close.');
    });

    const wsServer = new WebSocket.Server({ server: httpServer });

    wsServer.on('connection', (ws, req) => {
      req.nmsConnectionType = 'ws';
      this.onConnect(req, ws);
    });

    wsServer.on('listening', () => {
      Logger.log(`Node Media WebSocket Server started on port: ${port}`);
    });
    wsServer.on('error', (e) => {
      Logger.error(`Node Media WebSocket Server ${e}`);
    });

    if (this.httpsServer) {
      this.httpsServer.listen(this.sport, () => {
        Logger.log(`Node Media Flv Https Server started on port: ${this.sport}`);
      });

      this.httpsServer.on('error', (e) => {
        Logger.error(`Node Media Flv Https Server ${e}`);
      });

      this.httpsServer.on('close', () => {
        Logger.log('Node Media Flv Https Server Close.');
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
    context.sessions.forEach((session, id) => {
      if (session instanceof NodeFlvSession) {
        session.req.destroy();
        context.sessions.delete(id);
      }
    });
  }

  const onConnect = (req, res) => {
    let session = new NodeFlvSession(config, req, res);
    session.run();
  }
  return { run, onConnect }
}

module.exports = NodeFlvServer;
