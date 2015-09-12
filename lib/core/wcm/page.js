'use strict';
/** 
* Page represents a Template page object
* this is also considered a wrapper for
* Mustache template objects
*/


function Page(id, source) {
	this.source = source || null;
	this.__delimiter = "{{=<%include %>=}}";
	Node.call(this, id);
}

Page.prototype = Object.create(Node.prototype);
Page.prototype = {
	constructor : Page,
	compile : function() {
		var delimiter = this.__delimiter;
		return Mustache.render(delimiter+this.source, this);
	}
}; 
