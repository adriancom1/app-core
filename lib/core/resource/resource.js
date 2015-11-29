'use strict';
/**
 * Resources are pieces of content on which the system acts
 * It is recommended to not implement this interface directly.
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