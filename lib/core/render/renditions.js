'use strict';


// Import Core Modules
var renderHTML = require('./html');
var renderJSON = require('./json');
var renderPOST = require('./post');
//var renderJSX = require('./react-jsx');

// Export Public Modules
module.exports = exports = {};

/**
* System default renditions
*/
exports.system = {
    html : renderHTML,
    post : renderPOST,
    json : renderJSON,
};

/**
* System default routes
* This section will contain custom renditions for 
* system specific configurations such as a Welcome page
* Login page UI, Admin page, etc.
*/
exports.appSystemRoutes = {
    // TODO: Consider making this as an externally managed object
    "admin/<admin>" : function(resource) {
        return resource.render({
            html : function() {
                return '<h1>Admin Page.</h1>';
            }
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
* @resource is a ResourceWrapper object 
*/
exports.root = renderHTML;