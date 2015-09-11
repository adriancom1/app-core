
// Base type, everything pulled from the repository is inherited from Item class
function Item(id) {
	this.id = id || null;
};

Item.prototype = {
	constructor : Item,
	getProperty : function(propertyName) {
		if(_sysUtils.hasProperty(this, propertyName)) {
			return this[propertyName];
		} 
		return propertyName + " not found";
	}
};