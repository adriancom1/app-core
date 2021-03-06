'use strict';

var EventEmitter = require('events').EventEmitter;


 //Import Core Modules
var $S = require('../utils/system');
var ClientMessage = require('./client/message');
// Import the RenderManager that creates a Renderer
var Renderer = require('./render/renderer.js');

// The module to be exported.
module.exports = exports = Routes;

exports.notFound = function(message) {
    Route.notFoundMessage = message;
};

 // ROUTING HAS TO GET THE TYPE
// Route Constructor
function Route() {};

Route.notFoundMessage = "Resource Not Found."

Route.prototype = {
    constructor : Route, 
    errors : false,
    toString : function() {
        return this.routename
    },
    toJSON : function(){
        // May no longer need 
       // return JSON.stringify(this.handler.call(this));
    },
    getRoute : function() {
        return this.routename;
    },
    /*
        Main execution method
    */
    exec : function(clientResponse) {
    	// Instantiate a ClientMessage object
    	var message = $S.inherit(ClientMessage, clientResponse);
        var errors = false;
        var msg = null;
        var internalErrorMsg = "Internal Server Error: Route.exec():: ";

    	try {
            
            if(this.errors === true) {
                throw new Error(this.errorMessage);
            }

            /* Response is Initiated */
            message.respond(this);
            
    	} catch(e) {
            if(this.hasOwnProperty('output')) {
    			//check between errorMessage and output
    			msg = e.message || Route.notFoundMessage;
    			console.log(internalErrorMsg + this.output); //Record this in a log file somewhere or for debugging
    		} else {
    			msg = e.message;
    		}
            // If an error occurs, pass the error message to the output Response
    		message.fail(internalErrorMsg + msg);
    	}
        return this;
    },
    // config : function(configObject) {
    // 	//Object to configure //May Not Be Needed 
    // 	//$S._config(ResourceMap.prototype, configObject);
    // },
	update : function(eventData) {
		this.values.push(eventData);
	},
	flush : function() {
		this.values.length = 0;
	}, 
	onComplete : function(data) {
		this.emit("complete", data);
	},

    // Renderer is a wrapper object for the route's handler function
    getRenderer : function() {
        return this._renderer;
    }

};
$S.extend(Route.prototype, EventEmitter.prototype);

// Routes will traverse the 'routes' object that was configured from root app.
function Routes(routes) {
	var Routes = function Routes() {
	        throw new Error("Routes():: Can't instantiate directly");
	    };
	    
	    var obj;
        for(var route in routes)  {
	        obj = Object.create(Route.prototype);
	       // obj.constructor(); // May not need
	        obj.hasRules = (!~route.indexOf('/<') == 0); //true/false
	        obj.routename = route;
            // Set an override using the configured Route handler
	        obj._renderer = new Renderer(routes[route]);
	        Routes[route] = obj;
	    }
        Routes.get = function(resource) {
            try {
                if(!this.hasOwnProperty(resource)) {
                    throw new Error("Routes.get():: Route location not found.");
                    // There should always be something returned.
                    this.errors = true;
                }
                return this[resource];
            } catch (e) {
                var route = Object.create(Route.prototype);
                route.errors = true;
                route.output = e.message;
                return route;
                //404 error
            }    
        };  
        return Routes;
};