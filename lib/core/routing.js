'use strict';

 var EventEmitter = require('events').EventEmitter;


 //Import Core Modules
 var _sysUtils = require('../utils/system');
 var ClientMessage = require('./client/message');


// The module to be exported.
module.exports = exports = Routes;
exports.notFound = function(message) {
    Route.notFoundMessage = message;
};
 
// Route Constructor
function Route() {};
Route.notFoundMessage = "Resource Not Found."
Route.prototype = {
    constructor : Route, 
    errors : false,
    toString : function(){return this.routename},
    toJSON : function(){
        return JSON.stringify(this.handler.call(this));
    },
    getRoute : function() {
        return this.routename;
    },
    exec : function(clientResponse) {
    	//Instantiate a ClientMessage object
    	var message = _sysUtils.inherit(ClientMessage, clientResponse);
        var errors = false;
        var msg = null;
        var internalErrorMsg = "Internal Server Error: Route.exec():: ";
    	try {
            if(this.errors === true) throw new Error(this.errorMessage);
            message.success(this);
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
    config : function(configObject) {
    	//Object to configure //May Not Be Needed 
    	_sysUtils._config(ResourceMap.prototype, configObject);
    },
	update : function(eventData) {
		this.values.push(eventData);
	},
	flush : function() {
		this.values.length = 0;
	}, 
	onComplete : function(data) {
		this.emit("complete", data);
	}

};
_sysUtils.extend(Route.prototype, EventEmitter.prototype);

// Routes will traverse the 'routes' object that was configured from root app.
function Routes(routes) {
	var Routes = function Routes() {
	        throw new Error("Routes():: Can't instantiate directly");
	    }
	    
	    Routes.values = [];//this is only to enumerate them
	    var obj;
	    for(var item in routes)  {
	        obj = Object.create(Route.prototype);
	        obj.constructor();
	        obj.hasRules = (!~item.indexOf('/<') == 0); //true/false
	        obj.selector = null,
	        obj.selectorValues = null,
	        obj.routename = item;
	        obj.handler = routes[item];
	        Routes[item] = obj;
	        Routes.values.push(obj);
	    }
        Routes.get = function(resource) {
            try {
                if(!this.hasOwnProperty(resource)) {
                    throw new Error("Routes.get():: Route location not found.");
                    this.errors = true;
                    //There should always be something returned.
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
