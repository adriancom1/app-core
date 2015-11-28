/* 
  Client Message is instantiated by the Route Object. 
  The message represents the actual output that is
  sent as the Response to the client. (ie. Browser, Mobile Device)
*/

// Import core modules
var $S = require('../../utils/system'); //System Utilities Module
var ResourceWrapper = require('../resource/wrapper');

// Export public modules
module.exports = ClientMessage;

function ClientMessage (response) {	
	this.response = response;
	// Default Standard Response is JSON
	this.mimeType = "application/json";
};

ClientMessage.MIME_TYPES = function(type) {
	switch(type) {
		case "html":
		case "post":
		case "edit":
			return "text/html";
		break;
		case "txt":
			return "text/plain";
		break;
		case "json":
		case "jsonp":
			return "application/json";
		break;
		default : 
			return "application/json";
	} 
};  
 
ClientMessage.prototype = {

	constructor : ClientMessage,

	write : function(message) {
		this.response.write(message);
		this.response.end();
	},

	respond : function(routeObject) {
		var self = this;

		// Wrap the Route object in a ResourceWrapper and send it to the Handler
		var resourceWrapper = $S.initWithMixin(ResourceWrapper, routeObject, [routeObject.pathname, routeObject.routename, routeObject.hasRules]); 
		
		if(resourceWrapper.routename === '_root') {
			resourceWrapper.type = 'html';
		};

		this.response.setHeader('Access-Control-Allow-Origin', '*');
		this.response.writeHead(200, {"Content-Type" : ClientMessage.MIME_TYPES(resourceWrapper.type)});
		/*
			The Route's handler method is executed.
			The handler is a Renderer object.
			A ResourceWrapper object is 'bound' as an argument.
			It's methods can be called and a response message
			is sent as output to the client user-agent.
		
		** -------------- Route Handler ------------------- */
		var Renderer = routeObject.getRenderer(); 
		var outputMessage = Renderer.handleResourceRequest(resourceWrapper);
		/* -------------- Route Handler ------------------- */

		/* 
			If output message is not returned then the response will
			be returned from a 'onComplete' event.
			@output will return a @Writer object (ie. JSONWriter, HTMLWriter)
		*/
		if(outputMessage) {
			resourceWrapper._isService = false;
			this.write(resourceWrapper.output(outputMessage));
			return;
		}

		// Listen for web service data 'onComplete' requests
		if(resourceWrapper._isService) {
			resourceWrapper.once('complete', function(data) {
				self.write(resourceWrapper.output(data));
			});
		} 
	},

	fail : function(errorMessage) {
		var output = errorMessage;
		if(~this.mimeType.indexOf('json') != 0) {
			output = JSON.stringify({error: errorMessage, code: 404});
		}
		this.write(output);
	}
};
