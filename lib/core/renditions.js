'use strict';


// Import Core Modules
var HTMLwriter = require('./resource/writer').HTML;
var JSONwriter = require('./resource/writer').JSON;

// Export Public Modules
module.exports = exports = {};

/**
* System default renditions
*/
exports.system = {
    html : function(resource) {
        var html = new HTMLwriter();
        html.title("HTML Page");
        html.body("<h1>Html Page</h1>");
        return html; 
    },
    post : function(resource) {
        var html = new HTMLwriter();
        html.title("HTML Page");
        html.body("<h1>POST Page</h1><p>"+ JSON.parse(resource.getParam("data")).test +"</p>");
        return html; 
    },
    json : function(resource) {
        var self = this;
        resource.getResource().once("data", function(data) {
            resource.onComplete(data);
        });
    },
};

/**
* System default routes
* This section will contain custom renditions for 
* system specific configurations such as a Welcome page
* Login page UI, Admin page, etc.
*/
exports.appDefaultRoutes = {
    // TODO: Consider making this as an externally managed object
    "welcome/<welcome>" : function(resource) {
        return resource.render({
            html : function() {
                return '<h1>Welcome Page.</h1>';
            },
            post : function() {
                return '<h1>Welcome Post.</h1>';
            },

        });  
    },
    // mockup test route
    "stores/<stores>/products/<products>/<h>" : function(resource) {
        return resource.render({
            html: function() {
                return "Stores Page = "  + resource.getVars() + ". Worked.";
            },
            json: function() {
                return {stores: 'worked', output: resource.getValueMap()};
            },
        });
    }
}

/**
* Root View Handler
* @resource is a ResourceMap object 
*/
exports.root = function(resource) {
    var html = new HTMLwriter();
    html.title("This is the title");
    html.body("<h1>This is the Root Page!</h1>");
    return html; 
};