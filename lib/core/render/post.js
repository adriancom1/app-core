'use strict';

// Import core modules
var HTMLwriter = require('../resource/writer').HTML;


// Export public modules
module.exports = function(resource) {
    var html = new HTMLwriter();
    html.title("HTML Page");
    html.body("<h1>POST Page</h1><p>"+ JSON.parse(resource.getParam("data")).test +"</p>");
    return html; 
}