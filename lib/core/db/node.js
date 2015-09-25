'use strict';
/** 
* A Node represents a Generic Resource Type.
*/


// Import core modules
var $S = require('../../utils/system');
var Item = require('./item.js');


// Export public modules
module.exports = exports = Node;


function Node(data) {
	// System Utility to convert from LUA Hash types to Javascript types
	var data = $S.parseJSON(JSON.parse(data));
	if (data.sysid === '') return "Record not found.";
	
	Item.call(this, data);

};
	
Node.prototype = Object.create(Item.prototype);
Node.prototype.constructor = Node;

