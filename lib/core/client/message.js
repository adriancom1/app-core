/* 
  Client Message is instantiated by the Route Object. 
  The message represents the actual output that is
  sent as the Response to the client. (ie. Browser, Mobile Device)
*/

//Import Core Modules
var $S = require('../../utils/system'); //System Utilities Module
var ResourceMap = require('../resource/map');

//Export Modules
module.exports = ClientMessage;

function ClientMessage (response) {	
	this.response = response;
	// Default Standard Response is JSON
	this.mimeType = "application/json";
};

ClientMessage.mimeTypes = function(type) {
	switch(type) {
		case "html":
			return "text/html";
			break;
		case "txt":
			return "text/plain";
			break;
		case "json","jsonp":
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
	// TODO: Rename bc 'success' is misleading
	success : function(routeObject) {
		var self = this;
		//Wrap the Route object in a ResourceMap and send it to the Handler
		var resourceMap = $S.initWithMixin(ResourceMap, routeObject, [routeObject.pathname, routeObject.routename, routeObject.hasRules]); 
		
		//Todo: Check if the .Type is set in the config or in the ResourceMap.type
		//routeObject.type or resourceMap.type
		this.response.setHeader('Access-Control-Allow-Origin', '*');
		this.response.writeHead(200, {"Content-Type" : ClientMessage.mimeTypes(resourceMap.type)});

		/*
			The Route's handler method is executed.
			A ResourceMap object is 'bound' as an argument.
			It's methods can be called and a response message
			is sent as output to the client user-agent.
		*/
		var outputMessage = routeObject.handler(resourceMap);
		if(outputMessage) {
			resourceMap._isService = false;
			this.write(resourceMap.output(outputMessage));
			return;
		}
		//Listen for web service data complete requests
		if(resourceMap._isService) {
			routeObject.once("complete", function(data) {
				self.write(resourceMap.output(data));
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
