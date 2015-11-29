'use strict';
/**
 * The SyntheticResource class is a simple implementation that may be used
 * to provide a resource object of resource properties (url, path, script)
 * that contains no actual resource (repository) data.
 */


//System Utilities
var $S = require('../../utils/system');


// Export Modules
module.exports = ResourceResolver;

// Creates a synthetic resource with the given path.
function SyntheticResource() {};

ResourceResolver.prototype = {

	/***
	* Resolves a path ValueMap and returns a string that
	* will retrieve the matching table in the Repository.
	* This method does not support chaining.
	* @route {String, Object}
	**/
	resolve: function() {},

	/***
	* Returns an object mapped from the (resource) path. 
	* This method just applies the mappings.
	* UrlMap
	**/
	map: function() {},

	/**
	* Returns a Resource object for data located at the given path.
	*
	**/
	getResource: function() {},

	/**
	* Returns the search path used to search for resources by relative path.
	* (ie. users/adrian)
	**/
	getSearchPath: function() {},

	/**
	* Returns a collection of Resource objects from the children of the Resource.
	* This specification does not define what the term "child" means.
	* (ie. Pages contain components, this returns a list of the components)
	**/
	listChildren: function() {}


}