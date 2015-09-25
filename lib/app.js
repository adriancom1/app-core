// Main App Engine

// Import core modules
var $S = require('./utils/system');
var AssertUrl = require('./utils/asserturl');
var Routes = require('./core/routing');
var renditions = require('./core/render/renditions');

(function(exports) {
  'use strict';

  /* Exports */ 

  // Expose the constructor function.
  exports.App = App;

  // Create a new Applicaton 'App' instance.
  exports.create = function() {
    var app = new App();
    // System Server PORT
    app.serverPort(process.env.PORT || '3000')
    // Default 'Not Found' error message
    .notFound("Resource Not Found")
	/**
	* Initialze the Root route location
	* @renditions.root is a rendition type from the renditions module.
	*/ 
	.root(renditions.root)
    // Default system routes
    .route(renditions.appDefaultRoutes);
    return app;
  };


  /* App Main Class */
	
	// This constructor only returns 'this' to enable chaining
	function App() {
	    return this;
	};

	//This will create a basic One page app
	App.prototype.basicMode = function(message) {
		this.serverBasicMode = true;
		if(message) App.responseOutput = message;
	  	return this;
	};

	//Sets the Server port
	App.prototype.serverPort = function(port) {
		Object.defineProperty(this, "port", {
			get: function() {
				console.log("Server is listening on Port: " + port);
				return port
			},
			configurable : true
		});
		return this;
	}

	// Renders the static message when Basic Mode is used
	App.prototype.text = function(message) {
		//response type text
		App.responseOutput = message;
		return this;  
	};

	//Routing - A route is bound to a Resource which inherits from ResourceMap Object
	App.prototype.route = function() {		
		this.serverBasicMode = false;
		// Store the route object in a static property App.routes
		var routes = Routes.apply(this, arguments);
		App.hasRoutes(routes);
		return this;
	};
	/** 
	* Creates system managed routes called 'directories' that 
	* represent URL path directory names (ie. projects/, users/).
	* The value 'null' is the set to bypass any custom handlers.
	* Custom handlers are instead created using the 'route' method.
	*/
	App.prototype.directories = function(dirList) {
		if(!Array.isArray(dirList)) throw new Error('App.engine.directories():: Failed to create. Expected an Array list.');
		this.serverBasicMode = false;
		var routes = {};
		dirList.forEach(function(dir) {
			routes[dir + '/<'+ dir +'>/<h>'] = null;
		});
		
		// Queue of routes to merge with the master App.Routes
		routes = Routes.call(this, routes);
		// Append the new routes to the master App.routes object
		if(!$S.hasProperty(App, 'routes')) {
			App.routes = routes;
		} else {
			$S.extend(App.routes, routes);
		}
		return this;
	};

	/* Add the default Root route here, this can be optionally
	* overridden in a user config. 
	* @_root = System main root route
	*/
	App.prototype.root = function(resourceHandler) {
		this.route({"_root": resourceHandler});
		return this;
	};

	// Custom 404 Error Message
	App.prototype.notFound = function(message) {
		App.notFoundMessage = message || "404 - Resource not found."
		Routes.notFound(message); //May Not Need. Keep incase
		return this;
	};

	/* Static Properties & Methods */
	App._sysModulesIndex = {};
	App._sysModules = [];
	App._regpathParentName = /\w+(?=\/)/;
	App._regSelector = /\/{0}(?:@)[a-zA-Z0-9\-\(\)\|]+\/{0}/;
	App._getRouteKeyName = function(routeObject, routeName) {
		var delimiter = "=>";
		var keys = Object.getOwnPropertyNames(routeObject).join(delimiter).concat(delimiter); //flatten
		var loc = keys.indexOf(routeName);
		if(~loc == 0) return false; //Route key name not found

		keys = keys.substring(loc, loc+keys.length);
		routeName = keys = keys.split(delimiter).shift();
		// NOT Sure if this is still needed. This is used to configure a 'restricted' list of subdirectory names
		// if(!~keys.indexOf("/@")==0) {		
		// 	//Check for a selector
	 //  		var selector = routeName.match(App._regSelector)[0].substring(1); //selector
		// 	  if(!~selector.indexOf("(")==0){
		// 	  	//Check for multiple selector values
		// 	    var selValues = selector.replace("(","|").split("|");
		// 	    selector = selValues.shift();
		// 	    var selLen = selValues.length;
		// 	    selValues[selLen-1] = (function(char){return char.substring(0,char.length-1)})(selValues[selLen-1]);
		// 	    routeObject[routeName].selectorValues = Array.prototype.slice.call(selValues);
		// 	  };
		// 	  routeObject[routeName].selector = selector;
		// };
		return keys;
	};

	// This is a Node.Js Response wrapper that performs route checking
	App.response = function(serverMode) {
		if(serverMode) {
			return function (request, response) {
				response.writeHead(200, {"Content-Type" : "text/html"});
				// Default initial response if none is configured
				response.end(App.responseOutput || "This Worked!!!");
			}
		}; 

		//Returns a Standard Node.Js Response 
		return function (request, response) {
			var headers = request.headers;
			var url = require('url').parse(request.url, true, false);
			
			//Static Route Path
			//TODO: Fix issue with trailing slash here
			var pathParent = url.pathname.substring(1).toLowerCase(); //Remove initial slash & force lowercase
			if (!~pathParent.indexOf("/") == 0) {
				// Dynamic Path to Route mapping
				pathParent = pathParent.match(App._regpathParentName);
				// Match the Path name to the stored Route object and return the route
				pathParent = App._getRouteKeyName(App.routes, pathParent);			
			} else {
				// Return the ROOT template if no Path Routes were found
				if(pathParent === "") pathParent = "_root";
				//console.log("!!!!!No slash found=====", pathParent); //users/<users>
			}

			//Instantiate the Routes object
			var routeObject = App.routes.get(pathParent);
			//Extend using URL object properties
			$S.extend(routeObject, url);
			$S.copyProperty(headers, routeObject, 'host');
			
			//Verify the validity of the Route object and Path name
			var portTest = headers.host.lastIndexOf(":");
			if (!~portTest == 0) routeObject.port = headers.host.substring(portTest+1); //port number
			$S.copyProperty(headers, routeObject, 'user-agent');
			
			/**
			* Handle Errors
			* Check for properly formatted path name
			*/ 
			var noError = (!new AssertUrl(url.path).validate());
			noError = ~(~noError); //convert to an number for testing
			// Todo: Need to get the routeObject.errors and routeObject.output properly classified
			if(noError > 0 ) {
				routeObject.errors = true;
				// TODO: Validate if this is getting set automatically or when an error occurs
				routeObject.output = "Assert URL failed to resolve the path name.";
				//Todo: this may be failing on certain URL combintations, please double check it.
				routeObject.errorMessage = App.notFoundMessage || "Resource not found.";
			} else {
				//Validate for resource resolver errors
				if(pathParent) {
					delete routeObject.output;
					routeObject.errors = false;	
				} 
			}
			// Executes the Handler that is configured for the Route			
			routeObject.exec(response);
		}; 
	};
	
	// Append the new routes to the master App.routes object
	App.hasRoutes = function(routes) {
		if(!$S.hasProperty(App, 'routes')) {
			App.routes = routes;
		} else {
			$S.extend(App.routes, routes);
		}
	};

	// Main Application Runner
	App.run = function(applicationObject) {
		//Mainly used for initial bootstrap or when routes are not configured
		if(applicationObject.serverBasicMode) return App.response(true); 

		//construct a new object, then send it
		return App.response();
	};

})(typeof exports === 'object' && exports || this);






