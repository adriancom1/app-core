'use strict'

// Import core modules
var JSONwriter = require('../resource/writer').JSON;


// Export public modules
module.exports = function(resource) {
    var self = this;
    resource.getResource().once("data", function(node) {
        resource.onComplete(node.getData());
    });
};