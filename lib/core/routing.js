'use strict';

 var EventEmitter = require('events').EventEmitter;


 //Import Core Modules
 var $S = require('../utils/system');
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
    /*
        Main execution method
    */
    exec : function(clientResponse) {
    	//Instantiate a ClientMessage object
    	var message = $S.inherit(ClientMessage, clientResponse);
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
    	$S._config(ResourceMap.prototype, configObject);
    },
	update : function(eventData) {
		this.values.push(eventData);
	},
	flush : function() {
		this.values.length = 0;
	}, 
	onComplete : function(data) {
		this.emit("complete", data);
	},
    getHandler : function() {
        return this._handler;
    }

};
$S.extend(Route.prototype, EventEmitter.prototype);

// Routes will traverse the 'routes' object that was configured from root app.
function Routes(routes) {
	var Routes = function Routes() {
	        //throw new Error("Routes():: Can't instantiate directly");
	    };
	    
	    //Routes.values = [];//this is only to enumerate them
	    var obj;
        for(var route in routes)  {
	        obj = Object.create(Route.prototype);
	        obj.constructor();
	        obj.hasRules = (!~route.indexOf('/<') == 0); //true/false
	        //obj.selector = null, // May no longer need 'selectors' in favor of 'rendition' types
	        //obj.selectorValues = null,
	        obj.routename = route;
            // Set an override using the configured Route handler
	        obj._handler = new RenderManager(routes[route]);
	        Routes[route] = obj;
	      //  Routes.values.push(obj);
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

/**
* RenderManager is a Manager 'Class' that 
* takes care of processing the rendition type objects.
* A rendition type can be (html, json, etc). 
* RenderManager will return either a system managed Renderer object
* that will handle each renditon type or an override object that is
* provide in the main App Route config.
* A @Route routeHandler function is accepted as the input.
*/
function RenderManager(routeHandler) {
    /**
    * @isManaged (internal) indicates if the Resource handling
    * will be managed by the RenderManager (this object) or by the
    * override function 'routeHandler' object
    * @true = Implement the System Managed Renditions
    * @false = Override
    */
    this._isManaged = (typeof routeHandler !== 'function') ? true : false;
    /* Renderer wrapper for the handler */
    this.handler = Renderer.call(this, routeHandler);
};

RenderManager.prototype = {
    renditions : {
        // TODO: This is going to come from another module
        html : function() {
            console.log("HTML= ", this);
            return 'This is the HTML';
        },
        json : function(resource) {
            var self = this;
            //console.log("RES===", resource);
            return resource.getResource().once("data", function(data) {
                console.log("Renderer data=", data);
                resource.onComplete(data);
            });
        },
    },
    /**
    * A Resource Handler will process the output for all of the 
    * rendition types (json, html, etc).
    */
    handleResourceRequest : function() {
        // The handler is a Renderer wrapper object
        return this.handler.apply(this, arguments /*@ResourceMap*/);
    },
    // Is Resource handled by the system
    isResourceRequest : function() {
        return this._isManaged;
    },
    getRenditionTypes : function() {
        return this.renditions;
    },
// method consider: createHandler(rendition, resHandler)
// will create a 'route' handler that appends this automatically
//"name/<name>/<h>"
};

/** 
* Constructs a Static Renderer 'Class' with static
* member properties.
*/
function Renderer() {
    var Renderer;
    // Context of 'this' is applied from the RenderManager
    var renderMgr = this;
    if(this.isResourceRequest()) {
        // renditions is a function that returns a collction of rendition objects
        var renditions = renderMgr.getRenditionTypes();
        Renderer = function(resource) {
            resource.render(renditions);
        };
    } else {
        // Override function handler
        Renderer = arguments[0];
    };
    return Renderer;
};

// Renderer.prototype.renditionType = function(type) {
//     return $S.getProperty(this._renditionTypes, type);
// };
//resourceHandler
//getConvertedValue()
//



//mimic this or else it wont work
// function(resource) {
//         var self = this;
//         return resource.render({
//             json: function() { 
//                 resource.getResource().once("data", function(data) {
//                     self.onComplete(data);                  
//                 });
//             }
//         });
//     },






