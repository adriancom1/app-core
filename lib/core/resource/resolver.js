'use strict';
/**
 * The ResourceResolver defines the API
 * which may be used to resolve Resource objects. 
 */


//System Utilities
var $S = require('../../utils/system');


// Export Modules
module.exports = ResourceResolver;

function ResourceResolver() {

}


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