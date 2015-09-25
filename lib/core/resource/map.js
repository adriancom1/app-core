'use strict';
/**
* Resource to Repository Mapping object
*/


// Import NodeJs Modules
var EventEmitter = require('events').EventEmitter;

// Import Core Modules
var $S = require('../../utils/system'); //System Utilities
var ResourceWriter = require('./writer');
var Repository = require('../db/repository');
var Node = require('../db/node.js');
var Page = require('../wcm/page.js');
var config = require('config');


// Export Modules
module.exports = ResourceMap;

/**
* Resource Mapping Arguments contain
* @Resource {string} URL Path
* @Route {strrng} Name
* @isSpecialRules {boolean}
*/
function ResourceMap() {
	this.values = [];
	this._isService = false;

	// Default Redis record hashmap table key (ie.record:id:details)
	this.DEFAULT_HASH_TABLE = 'details';
	this.DEFAULT_CONTENT_RESOURCE = 'page';

	//Resource and Route Paths
	var resRoutePaths = arguments[0];

	// SpecialRules parameter
	var hasSpecialRules = arguments[0][2];

	try { 
		EventEmitter.call(this);
		if(arguments.length == 0) throw new Error("ResourceMap():: cannot be instantiated.");
		this.urlmap = null;
		ResourceMap._create.call(this, resRoutePaths, hasSpecialRules);
	} catch(e) {
		return this.output = e.message;
	}
};

ResourceMap._create = function(resourceRoutePaths, isSpecialRules) {
	if(arguments.length == 0) throw new Error("ResourceMap._create():: Cannot instantiate");
	var hasTrailingSlash = false;
	//Initialize a 'ValueMap' with defaults
	// TODO: Convert this into a ValueMap object
	var umap = this.urlmap = {};
	
	//Get variable names
	var urlPath = this.pathname = resourceRoutePaths[0].substr(1);
	var route = this.routename = resourceRoutePaths[1];

	urlPath = urlPath.toLowerCase();

	// Check for Trailing Slash
    if(urlPath.charCodeAt(urlPath.length-1) != 47) {
        hasTrailingSlash = true;
        urlPath += '/'; //Trailing slash fix   
    } else {
        urlPath = urlPath.substring(0, urlPath.length-1);
    };   
    var ext = this.hasExtension = (!~urlPath.indexOf('.') == 0);
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
    	};
	};
	/*
		Extract the URL Path variables from the Routh name (ie, ['books', 'tech'])
		Converts path variable 'route' into the key
		sets the value with the path resource

	*/
	if(isSpecialRules) {
		var pathVariables = route.match(/(?:<){0}\w+(?=>)/g);
    	pathVariables.map(function(item) {
	    	var index = urlParts.indexOf(item);
	    	umap[item] = urlParts[index+1];
	 	});
	};
	/* 
		Extract the mode if available (get or set)
		@get retrieves values from the server
		@set stores values and returns a status code (update)
		@del removes a complete record
		@new creates an initial record
	*/
	var rgxMode = /^(g|s)et|del|new/;
	var hash = this.hashtag(umap);
	if(rgxMode.test(hash)) {
	    umap['mode'] = hash.match(rgxMode)[0];
	    umap['script'] = true;
	    umap.h = umap.h.substr(3);
	} else {
		/* 
			Sets the default response type to always perform 'READ' (GET) requests
			In 'Publish' server mode, only 'READ' and 'UPDATE' are supported
			In 'Author' server mode, all methods are supported. Author is available
			only with a valid Authentication
		*/
		umap['mode'] = 'get';
		// boolean @script validates if the hashtag is an internal LUA script
		umap['script'] = false;
	};
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
	getParams : function() {
		// Get all values
		// TODO: Implement
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
	/**
	* Returns a JSON resource from the repository
	* Values are provided by the URLmap or Hashtag params 
	*/ 
	getResource : function() {
		this._isService = true;
		var self = this;
		var umap = this.urlmap;
		var repo = Repository.connect();
		var scripts = config.get('Redis.scripts');
		
		// Listen for the 'data' ready state
		repo.once("data", function(nodeData) {
			self.emit("data", new Node(nodeData) );
			//console.log("This is returned====,", nodeData);
			//self.emit("data", nodeData );
		});
		/*
			The Resolve method should trigger a .getNode call on the Repository
			Resolve the UrlMap object and convert into a LUA KEYS & ARGS String
		*/
		var resKeys;
		try {
			resKeys = this._resolve(umap);
			var scriptName = resKeys[3];
			// LUA Script SHA ID
			var sha = resKeys[0];
			// Check if the Resource is a Script or a regular Node
			if(umap.script && scriptName !== this.DEFAULT_HASH_TABLE) {
				var argv = resKeys[2];
				/**
				* If the script is for a Page Content resource then, check first 
				* for an existing interpolated source, but if the source is not 
				* present then execute a new Script call and generate the source.
				*/
				var pageTable = this.DEFAULT_CONTENT_RESOURCE;
				if(scriptName === pageTable) {
					// Check if the page content 'source' already exists
					repo.once("exists", function(data) {
						if(data.status !== false) {
							// Exists
							// Replace the script key, with the getDetails script
							resKeys[0] = scripts.get.details.sha;
							// Replace the table with the existing table
							resKeys[3] = data.table;
							// Get the node
							console.log("resKeys", resKeys);
						//TODO: Fix Issue with the Node type
							repo.getNode(resKeys);
						} else {
							// Not Exists
							console.log("NO EXIST=", sha, data.id);
							// Test this and ensure it works ok
							//repo.getScript(sha, argv);
						}
						
					});					
					/**
					* @collection = Pages collection
					* @recordId = Page name
					* @table {string} = Hash table in redis for the collection
					*/
					repo.exists({collection: this.getParentVar(), recordId: argv, table: 'source'});
					return this;
				} else {
					repo.getScript(sha /* SHA */, argv /* argv param */);	
				}
			} else {
				repo.getNode(resKeys);	
			}			
			
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
		var mode = this.getVar('mode');
		var scripts = config.get('Redis.scripts');

		// Return the main script keys to search for
		var hashkey = this.hashtag(routeMap);
		var script = scripts[mode];

		/*
			Get the resource parent and validate
			The script sha is returned from the config object
			based on the reserved keyword 'mode'
		*/
		if(this.isParent() != false) {  //TODO:: Handle if a Summary hashkey was sent instead
			// Resource Parent
			var rParent = this.getParentVar(); // Key
			var vParent = this.getVar(rParent); // Value
			/* 
				Verify the existence of a valid hashtag key
				If a hash <h> is specified in the Route object
				but not present in the URL, then set the default
				mode 'get' & hashkey 'details'
			*/
			if(vParent === hashkey) hashkey = this.DEFAULT_HASH_TABLE;
			// Check for a valid script that matches the hashtag provided
			var isScript = this.getValueMap().script;
			console.log("is SCRIPT=", this.getValueMap());
			if(script.hasOwnProperty(hashkey) == false && isScript == true) {
				throw new Error('Resource._resolve():: Resource ' + mode + hashkey + ' was not found.');
			} else {
				/* 
					if a 'mode' was implicitly set & an internal LUA script conig was
					not found, then apply the default 'getRecord' script and allow
					the REDIS server to handle the procesing
				*/
				if(!isScript) {
					script = script[this.DEFAULT_HASH_TABLE];
				} else {
					script = script[hashkey];
				}
			}			
			/*
				@sha = the Redis LUA compiled SHA value
				@rParent = collection
				@vParent = record to locate
				@hashkey = represents the hashmap object in Redis (table)
			*/		
			return [script.sha, rParent, vParent, hashkey];
		} else {
			throw new Error('Resource._resolve():: Resource Parent does not match the Route name');
		}
	},
	/*
		Translates a representation of a "#" hashtag. The reserved name 'h' is
		used in place of a "#" hashtag symbol because ther server does not interpret 
		"#" in the Url string. Hashtags are a client-side browser tecnnique.
	*/
	hashtag : function() {
		var hashString = "h";
		if($S.hasProperty(this.urlmap, hashString)) {
			return this.urlmap[hashString];
		} 
		return this.DEFAULT_HASH_TABLE; // Default
		
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
	/*
		Returns a ValueMap of URL params
		TODO: Create the ValueMap Object
	*/
	getValueMap : function() {
		return this.urlmap;
	},
	getParentVar : function() {
		return this.getVars()[0];
	},
	/* 
		This method ensures that the parent Noderoute name configured
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
	onComplete : function(data) {
		this.emit('complete', data);
	},
	// This is mainly called from the Route Object
	render : function(renditions) {
		var type = this.type || "json";
		// TODO: Abstract the 'post' render as a module
		//var rHandler = renditions;
		// rHandler['post'] = function() {
		// 	console.log("WTF=", this);
		// 	return "CUSTOM POST RESPONSE WILL GO HERE<p>";//+ this.getParam('data');
		// };
		// rHandler['edit'] = function() {
		// 	return "CUSTOM 'Author' User Interface will go here";
		// };
		// If the 'html' render is not set, provide a generic one 
		// if(!$S.hasProperty(rHandler, 'html')) {
		// 	rHandler.html =  function() {
		// 		var HTMLwriter = require('app-core/lib/core/resource/writer').HTML;
		// 		var html = new HTMLwriter();
		// 		html.title("Sample Page");
		// 		html.body("<h1>Sample Test Page </h1><p>Need to configure an HTML view<p>");
		// 		return html;
		// 	};
		// }
		var self = this;
		var type = this.type || "json";		
		if(type !== "jsonp") {
			return renditions[type](self);	
		}
		return renditions["json"](self);
	}
};
$S.extend(ResourceMap.prototype, EventEmitter.prototype);
