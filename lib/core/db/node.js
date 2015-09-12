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
	var data = JSON.parse(data);
	if (data.sysid === '') return "Record not found.";
	
	// System Utility to convert from LUA Hash types to Javascript types
	Item.call(this, $S.parseJSON(data));

};
	
Node.prototype = Object.create(Item.prototype);
Node.prototype.constructor = Node;

