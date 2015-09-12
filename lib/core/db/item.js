'use strict';
/**
* Item is the base 'interface' of a Node
* Base type, everything pulled from the 
* repository is inherited from Item class
*/

// Import Core Modules
var $S = require('../../utils/system');

// Export public modules
module.exports = exports = Item;


function Item() {
	this._data = arguments[0];
};

Item.prototype = {
	constructor : Item,
	getData : function() {
		return this._data;
	},
	getProperty : function(propertyName) {
		if($S.hasProperty(this, propertyName)) {
			return this[propertyName];
		} 
		return propertyName + " not found";
	}
};