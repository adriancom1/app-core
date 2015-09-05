'use strict';
/* 
  Resource to Repository Mapping object

*/


// Import NodeJs Modules
var EventEmitter = require('events').EventEmitter;

// Import Core Modules
var $S = require('../../utils/system'); //System Utilities
var ResourceWriter = require('./writer');
var Repository = require('../db/repository');
var config = require('config');


// Export Modules
module.exports = ResourceMap;

/*
	Resource Mapping Arguments contain
	@Resource URL Path
	@Route Name
	@isSpecialRules boolean
*/
function ResourceMap() {
	this.values = [];
	this._isService = false;
	//Resource and Route Paths
	var resRoutePaths = arguments[0];
	try { 
		EventEmitter.call(this);
		if(arguments.length == 0) throw new Error("ResourceMap():: cannot be instantiated.");
		this.urlmap = null;
		if (arguments[0][2] == true) { //specialRules parameter
			ResourceMap._create.apply(this, resRoutePaths);	
		}
	} catch(e) {
		return this.output = e.message;
	}
};
// TODO: Consider making this as the official 'constructor'
ResourceMap._create = function() { 
	if(arguments.length == 0) throw new Error("ResourceMap._create():: Cannot instantiate");
	var hasTrailingSlash = false;
	var umap = this.urlmap = {};
	//Get variable names
	var urlPath = this.pathname = arguments[0].substr(1);
	var route = this.routename = arguments[1];

	urlPath = urlPath.toLowerCase();
	// Check for Trailing Slash
    if(urlPath.charCodeAt(urlPath.length-1) != 47) {
        hasTrailingSlash = true;
        urlPath += '/'; //Trailing slash fix   
    } else {
        urlPath = urlPath.substring(0, urlPath.length-1);
    };   
    var ext = this.hasExtension = (!~urlPath.indexOf('.') == 0);
    // This extracts the Path Variables from the Routh name (ie, ['books', 'tech'])
	var pathVariables = route.match(/(?:<){0}\w+(?=>)/g);
	var urlParts = this.urlParts = urlPath.split("/").splice(1);

    if(hasTrailingSlash) urlParts.pop();   

    /*
		Test the URL path for a mime/type extension
		Mainly used to test for .html or .jsonp
		The system internally sets 'application/json' as the default type
    */
    if(ext) {
    	var len = urlParts.length;
    	var extension = urlParts[len-1];
    	var loc = extension.indexOf('.');
    	this.type = extension = extension.substring(loc+1).toLowerCase();
    	if(/[\[\]#$\^-_=+&<>!@%*\(\)]/.test(extension)) {
    		this.type = extension.match(/\w+/)[0];
    	}
	}
	/*
		Extract the URL Path variables
		Converts path variable 'route' into the key
		sets the value with the path resource

	*/
    pathVariables.map(function(item) {
	    var index = urlParts.indexOf(item);
	    umap[item] = urlParts[index+1];
	 });

	/* 
		Extract the mode if available (get or set)
		@get retrieves values from the server
		@set stores values and returns a status code
	*/
	var rgxMode = /^(g|s)et/;
	var hash = this.hashtag(umap);
	if(rgxMode.test(hash)) {
	    umap['mode'] = hash.match(rgxMode)[0];
	    umap.h = umap.h.substr(3);
	}    


	//if(this.isParent() == false) {
		
	//	throw new Error('Resource._resolve():: Resource Parent does not match the Route name');
	//}
};

ResourceMap.prototype = {
	constructor : ResourceMap,
	getUrl : function() {
		return this.host + this.path;
	},
	getRoute : function() {
		return this.routename;
	},
	getPath : function() {
		var path = this.pathname;
		if(path.charCodeAt(0) == 47) {
			return path.substr(1);
		}
	},
	getParam : function(parameter) {	
		if($S.hasProperty(this.query, parameter)) return this.query[parameter];
		return null;
	},
	getParent : function() {
		return this.getPath().split("/")[0];
	},
	getSelectors : function() {
		if(Array.isArray(this.selectorValues)) return this.selectorValues;
		return false;
	},
	getAction : function() {
		//placeholder
	},
	//Returns an HTML page resource
	getTemplate : function(resourceName, resourceIndexField) {
		var resourceIndexField = resourceIndexField || "name";
		this._isService = true;
		var self = this;
		var repo = Repository.connect();
		//Init the Event Listener chain
		repo.once("data", function(nodeData) {
			//Get the template master
			//Get the associated parts 
			self.emit("page", nodeData);
		});
		
		repo.getNode("pages", resourceIndexField, resourceName, "templates", "page");
	},
	// Returns an JSON resource by extracting the URLmap or Hashtag params
	getResource : function() {
		this._isService = true;
		var self = this;
		var umap = this.urlmap;
		var repo = Repository.connect();		 
		
		// Listen for the 'data' ready state
		repo.once("data", function(nodeData) {
			var data = JSON.parse(nodeData);
			if (data.id !== '') {
			// Iterate through the list of field names
				Object.keys(data).forEach(function(key) {
					var value = data[key];
					//LUA Redis Hash Hack convert to Javascript JSON type
					if(value.substr(0,1) == "{" || value.substr(0,1) == "[") {
						value = value.replace(/\\/g, "");
						data[key] = JSON.parse(value);
					}
				});
			} else {
				data.id = "Record not found.";
			} 
			self.emit("data", data);
		});
		/*
			The Resolve method should trigger a .getNode call on the Repository
			Resolve the UrlMap object and convert into a LUA KEYS & ARGS String
		*/
		var resKeys;
		try {
			resKeys = this._resolve(umap);
			repo.getNode(resKeys);
		} catch(e) {
			throw new Error(e.message);
		}
		return this;
	},
	/* 
		Resolves a path ValueMap and returns a string that
		will retrieve the matching table in the Repository.
		This method does not support chaining.
		@route {String, Object}
	*/
	_resolve : function(routeMap) {
		//console.log('TEST valid paths== ', this.getPath(), this.getRoute());
		var scripts = config.get('Redis.scripts');
		// Return the main script keys to search for
		var crud = Array.prototype.slice.call(Object.keys(scripts), 1);
		var hashkey = this.hashtag(routeMap);
		var sha = crud.map(function(item) {
		    if(scripts[item].hasOwnProperty(hashkey)) {
		       return scripts[item][hashkey].sha;
		    }
		})[0]; //Return only the 'found' record

		// Get the resource parent and validate
		if(this.isParent() != false) {
			var rParent = this.getParentVar();
			return ['99167f78886031bb7b9b2e0625dd6412fde5d999', rParent, 'adrian-com', routeMap.h];
		} else {
			throw new Error('Resource._resolve():: Resource Parent does not match the Route name');
		}
	},
	// Translates a representation of a "#" hashtag. The reserved name 'h' is used in place of a "#" hashtag symbol
	// because ther server does not interpret "#" in the Url string. Hashtags are a client-side browser tecnnique.
	hashtag: function() {
		var hashString = "h";
		if($S.hasProperty(this.urlmap, hashString)) return this.urlmap[hashString];
	},
	// Returns the value from the Path name that matches the Variable in the Route
	getHost : function() {
		//placeholder 
	},
	getPort : function() {
		//placeholder
	},
	getVar : function(variable) {
		if($S.hasProperty(this.urlmap, variable)) return this.urlmap[variable];
		return null;
	},	
	getVars : function() {
		return $S.getKeys(this.urlmap);
	},
	getParentVar : function() {
		return this.getVars()[0];
	},
	/* 
		This method ensures that the parent route name configured
		matches the path variable in the URL. 
	*/
	isParent : function() {		
		return (this.getParentVar() === this.getParent());
	},
	getFileName : function() {
		if(this.hasExtension) {
			var fragments = this.urlParts;
			return fragments[fragments.length-1];
		}
		return null;
	}, 
	output : function(output) {
		var self = this;
		var rendition = (this.type) ? this.type : (function(value){
			//console.log("THIS IS THE ResourceMap Output MESSAGE======,", value);
			//test value
			//Todo: Fix this.
			//return "html"; //Test this..mainly when the "root" / route is triggered
		})(output);
		var writer = $S.inherit(ResourceWriter, output);
		if(rendition === 'jsonp') return writer.getWriter(rendition, this.query); //need to query for the remote callback
		return writer.getWriter(rendition);
	},
	render : function(resourceHandler) {
		var type = this.type || "json";
		if(type !== "jsonp") {
			return resourceHandler[type]();	
		}
		return resourceHandler["json"]();
	}
	//,//  not needed
	// webService : function() {
	// 	//$S.extend(ResourceMap.prototype, {_isService : true});
	// 	this._isService = true;
	// 	return this;
	// }
};
$S.extend(ResourceMap.prototype, EventEmitter.prototype);
