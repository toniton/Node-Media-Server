//
//  Created by Mingliang Chen on 17/8/1.
//  illuspas[a]gmail.com
//  Copyright (c) 2018 Nodemedia. All rights reserved.
//

const Https = require('https');
const Logger = require('./core/node_core_logger');
const NodeRtmpServer = require('./rtmp/node_rtmp_server');
const NodeHttpServer = require('./http-server');
const NodeTransServer = require('./trans/node-trans-server');
const NodeRelayServer = require('./relay/node_relay_server');
const NodeFlvServer = require('./flv/node_flv_server');
const context = require('./core/node_core_ctx');
const pkg = require("../package.json");

class NodeMediaServer {
  constructor(config) {
    this.config = config;
  }

  run() {
    Logger.setLogType(this.config.logType);
    Logger.log(`Node Media Server v${pkg.version}`);
    if (this.config.rtmp) {
      this.nrs = new NodeRtmpServer(this.config);
      this.nrs.run();
    }

    if (this.config.http) {
      this.nhs = NodeHttpServer(this.config);
      this.nhs.run();
    }

    if (this.config.trans) {
      if (this.config.cluster) {
        Logger.log('NodeTransServer does not work in cluster mode');
      } else {
        this.nts = new NodeTransServer(this.config);
        this.nts.run();
      }
    }

    if (this.config.relay) {
      if (this.config.cluster) {
        Logger.log('NodeRelayServer does not work in cluster mode');
      } else {
        this.nls = new NodeRelayServer(this.config);
        this.nls.run();
      }
    }


    this.nfs = NodeFlvServer(this.config);
    this.nfs.run();

    process.on('uncaughtException', function (err) {
      Logger.error('uncaughtException', err);
    });
  }

  on(eventName, listener) {
    context.nodeEvent.on(eventName, listener);
  }

  stop() {
    if (this.nrs) {
      this.nrs.stop();
    }
    if (this.nhs) {
      this.nhs.stop();
    }
    if (this.nls) {
      this.nls.stop();
    }
  }

  getSession(id) {
    return context.sessions.get(id);
  }
}

module.exports = NodeMediaServer