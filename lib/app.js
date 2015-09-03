// Main App Engine

var _sysUtils = require('./utils/system');
var Routes = require('./core/routing');

(function(exports) {
  'use strict';

  /* Exports */ 

  // Expose the constructor function.
  exports.App = App;

  // Create a new Applicaton 'App' instance.
  exports.create = function() {
    return new App();
  };


  /* App Main Class */
	
	// This constructor only returns 'this' to enable chaining
	function App() {
	    return this;
	};

	//This will initialize an external module, such as a database ** Deprecated
	// App.prototype.init = function(moduleName) {
	// 	var module = require(moduleName);
	// 	var mLen = App._sysModules.length;
	// 	App._sysModulesIndex[moduleName] = mLen++;
	// 	App._sysModules[mLen-1] = module;
	//   return this;
	// }; 

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
		arguments[0]["_root"] = App._rootLocation; //Add the default Root route here
		//Store the route object in a static property App.routes
		App.routes = Routes.apply(this, arguments);
		return this;
	}; 

	//Default Root Page Route config
	App.prototype.root = function(resourceHandler) {
		App._rootLocation = resourceHandler;
		return this;
	};

	//Alias name for root 
	App.prototype.home = App.prototype.root; 

	//Custom 404 Error Message
	App.prototype.notFound = function(message) {
		App.notFoundMessage = message || "404 - Resource not found."
		Routes.notFound(message); //May Not Need. Keep incase
		return this;
	};

	/* Static Properties & Methods */

	App._rootLocation = null;
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
		if(!~keys.indexOf("/@")==0) {		
			//Check for a selector
	  		var selector = routeName.match(App._regSelector)[0].substring(1); //selector
			  if(!~selector.indexOf("(")==0){
			  	//Check for multiple selector values
			    var selValues = selector.replace("(","|").split("|");
			    selector = selValues.shift();
			    var selLen = selValues.length;
			    selValues[selLen-1] = (function(char){return char.substring(0,char.length-1)})(selValues[selLen-1]);
			    routeObject[routeName].selectorValues = Array.prototype.slice.call(selValues);
			  };
			  routeObject[routeName].selector = selector;
		};
		return keys;
	};

	// This is a Node.Js Response wrapper that performs route checking
	App.response = function(serverMode) {
		if(serverMode) {
			return function (request, response) {
				response.writeHead(200, {"Content-Type" : "text/html"});
				response.end(App.responseOutput || "This Worked!!!"); //Default initial response if none is configured
			}
		}; 

		//Returns a Standard Node.Js Response 
		return function (request, response) {
			var headers = request.headers;
			var url = require('url').parse(request.url, true, false);
			
			//console.log("THE MAIN URL==", url);
			//console.log("THE MAIN URL PATH==", url.pathname);

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
			_sysUtils.extend(routeObject, url);
			_sysUtils.copyProperty(headers, routeObject, 'host');
			
			//Verify the validity of the Route object and Path name
			var portTest = headers.host.lastIndexOf(":");
			if (!~portTest == 0) routeObject.port = headers.host.substring(portTest+1); //port number
			_sysUtils.copyProperty(headers, routeObject, 'user-agent');
			
			//Handle Errors
			var noError = (!new AssertUrl(url.path).validate()); //Check for properly formatted path name
			noError = ~(~noError); //convert to an number for testing
			// Todo: Need to get the routeObject.errors and routeObject.output properly classified
			//console.log("THIS IS THE ROUTE OBJECT ERROR MESSAGE======,", routeObject);
			if(noError > 0 ) {
				routeObject.errors = true;
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
 
	// Main Application Runner
	App.run = function(applicationObject) {
		var ware = applicationObject;
		//Mainly used for initial bootstrap or when routes are not configured
		if(ware.serverBasicMode) return App.response(true); 

		//construct a new object, then send it
		return App.response();
	};


	//Helper function that checks for a valid URL string
	function AssertUrl(urlToTest){
	    if(typeof urlToTest !== 'string') return null;
	    this.url = urlToTest;
	    this.specialChars = urlToTest.match(/\W/g).join(""); //Convert all special chars to a string
	};
	AssertUrl.regQueryParams = /(?:\.h)t(?:ml|m)(?!\w)|(?:\.j)so(?:np|n)(?!\w)/;

	AssertUrl.prototype.contains = function(stringToTest, charToTest) {
	    return (!~stringToTest.indexOf(charToTest) == 0) ? true : false;
	};

	AssertUrl.prototype.validate = function() {
	    var url = this.url;
	    var chars = this.specialChars;
	    var has = this.contains.bind(this, chars);
	    var hasText = this.contains.bind(this, url);

	    if(has('?') && !has('=')) return false;
	    if(has('?') && has('&') && !has('=')) return false;
	    if(has('.')) {
	        if(url.match(AssertUrl.regQueryParams) === null) return false;
			if(hasText('jsonp') && !hasText('callback')) return false;
	    }
	    return true; 
	};



})(typeof exports === 'object' && exports || this);






