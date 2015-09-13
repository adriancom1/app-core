'use strict'

// Import core modules
var JSONwriter = require('../resource/writer').JSON;


// Export public modules
module.exports = function(resource) {
    var self = this;
    console.log("URL", resource.getValueMap());
    resource.getResource().once("data", function(node) {
        resource.onComplete(node.getData());
    });
};