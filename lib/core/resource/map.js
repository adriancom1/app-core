/* 
  Resource to Repository Mapping object

*/


// Import NodeJs Modules
var EventEmitter = require('events').EventEmitter;


// Import Core Modules
var _sysUtils = require('../../utils/system');
var ResourceWriter = require('./writer');
var Repository = require('../db/repository');


// Export Modules
module.exports = ResourceMap;


/// Resource Mapping
function ResourceMap() {
	this.values = [];
	this._isService = false;
	try { 
		EventEmitter.call(this);
		if(arguments.length == 0) throw new Error("ResourceMap():: cannot be instantiated.");
		this.urlmap = null;
		if (arguments[0][2] == true) { //specialRules parameter
			ResourceMap._create.apply(this, arguments[0]);	
		}
	} catch(e) {
		return this.output = e.message;
	}
};

ResourceMap._create = function() { //Clean up this
	if(arguments.length == 0) throw new Error("ResourceMap._create():: Cannot instantiate");
	var hasTrailingSlash = false;
	var umap = this.urlmap = {};
	//Get variable names
	var pathname = arguments[0];
    var route = arguments[1];
    if(pathname.charCodeAt(pathname.length-1) != 47) {
        hasTrailingSlash = true;
        pathname += '/'; //Trailing slash fix   
    } else {
        pathname = pathname.substring(0, pathname.length-1);
    };   
    var ext = this.hasExtension = (!~pathname.indexOf('.') == 0);
	var pathVariables = route.match(/(?:<){0}\w+(?=>)/g);
	var urlParts = this.urlParts = pathname.split("/").splice(1);
    if(hasTrailingSlash) urlParts.pop();   

    if(ext) {
    	var len = urlParts.length;
    	var extension = urlParts[len-1];
    	var loc = extension.indexOf('.');
    	this.type = extension = extension.substring(loc+1).toLowerCase();
    	if(/[\[\]#$\^-_=+&<>!@%*\(\)]/.test(extension)) {
    		this.type = extension.match(/\w+/)[0];
    	}
	}
    
    pathVariables.map(function(item) {
	    var index = urlParts.indexOf(item);
	    umap[item] = urlParts[index+1];
	 });
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
		return this.pathname;
	},
	getParam : function(parameter) {	
		if(_sysUtils.hasProperty(this.query, parameter)) return this.query[parameter];
		return null;
	},
	getParent : function() {
		if(this.hasRules) {
			var rname = this.routename;
			return rname.substring(0, rname.indexOf('/<'));
		}
	},
	getSelectors : function() {
		if(Array.isArray(this.selectorValues)) return this.selectorValues;
		return false;
	},
	getAction : function() {
		//placeholder
	},
	//Returns an HTML resource
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
	//Returns an JSON resource
	getResource : function(resourceName, resourceIndexField, collection) {
	//example: resource.getResource("users", "name", "details");
	//Resource Name = "[users]:1000:details"
	//this looks up the index using hget index:users:[name] - [resourceIndexField ]
	//collection is the "users:1000:[details]" 
	console.log("Args== ", arguments);
		this._isService = true;  
		var self = this;
		//Get 'resourceName' by 'resourceIndexField' where 'optionalCategory'
		var repo = Repository.connect();		
		var resType = "hash";
		var fieldName = null;
		//  console.log("repo ", repo);
		//Init the Event Listener chain
		repo.once("data", function(nodeData) {
			self.emit("data", nodeData);
		});
		if(resourceName.length > 25) {
			//Refactor this to handle Server Side Scripts			
			resType = "sha";
			fieldName = collection[0];
			collection = collection[1]
		} else { 
			fieldName = this.getPathVariable(resourceName);
		}
		
		//console.log("Get Resource========, resourceName== ", resourceName,' resourceIndexField== ', resourceIndexField, 'fieldName= ',fieldName, collection);
		repo.getNode(resourceName, resourceIndexField, fieldName, collection, resType);		
		
		return this;
	},
	getPathVariable : function(variable) {
		if(_sysUtils.hasProperty(this.urlmap, variable)) return this.urlmap[variable];
		return null;
	},
	getHost : function() {
		//placeholder 
	},
	getPort : function() {
		//placeholder
	},
	getVars : function() {
		return this.urlmap;
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
		var writer = _sysUtils.inherit(ResourceWriter, output);
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
	// 	//_sysUtils.extend(ResourceMap.prototype, {_isService : true});
	// 	this._isService = true;
	// 	return this;
	// }
};
_sysUtils.extend(ResourceMap.prototype, EventEmitter.prototype);
