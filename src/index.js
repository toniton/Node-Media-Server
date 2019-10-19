const NodeRtmpServer = require('./rtmp/node_rtmp_server');
const NodeTransServer = require('./trans/node-trans-server');
const NodeRelayServer = require('./relay/node_relay_server');
const NodeMediaServer = require('./media-server');

const updateNotifier = require('update-notifier');
const pkg = require('../package.json');
updateNotifier({pkg}).notify();

module.exports = {
    NodeMediaServer,
    NodeRtmpServer,
    NodeTransServer,
    NodeRelayServer
}