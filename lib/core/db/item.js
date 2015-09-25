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
		var data = this.getData();
		if($S.hasProperty(data, propertyName)) {
			return data[propertyName];
		} 
		return propertyName + " not found";
	},
	//Todo: Implement methods that will perform a filter on the data payload
	//ie: ?property=content
};