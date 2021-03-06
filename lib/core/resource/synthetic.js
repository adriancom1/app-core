'use strict';
/**
 * The SyntheticResource class is a simple implementation that may be used
 * to provide a resource object of resource properties (url, path, script)
 * that contains no actual resource (repository) data.
 */


//System Utilities
var $S = require('../../utils/system');


// Export Modules
module.exports = SyntheticResource;

// Creates a synthetic resource with the given path.
function SyntheticResource() {};

SyntheticResource.prototype = {

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