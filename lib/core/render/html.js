'use strict';

// Import core modules
var HTMLwriter = require('../resource/writer').HTML;


// Export public modules
module.exports = function(resource) {
    var html = new HTMLwriter();
    //getTemplate
    html.title("HTML Page");
    html.body("<h1>Html Page</h1>");
    return html; 
};