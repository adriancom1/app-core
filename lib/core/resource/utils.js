'use strict';
/**
 * The ResourceUtils class provides helper methods
 * for dealing with resources.
 */


//System Utilities
var $S = require('../../utils/system');


// Export Modules
module.exports = ResourceUtils;

// Creates a synthetic resource with the given path.
function ResourceUtils() {};

ResourceUtils.prototype = {

	/***
	* This resource's path that could be a key-mapped path in Redis.
	**/
	getPath: function() {},

	/***
	* The resource type is meant to point to rendering types or processing scripts.
	**/
	getResourceType: function() {},

	/**
	* Returns a resource metadata object containing the metadata associated
	* with the path of this resource.
	*
	**/
	getResourceMetadata: function() {},

}