



// Node represents an Generic Resource Type
function Node(id) {
	Item.call(this, id); 
};

Node.prototype = Object.create(Item.prototype);
Node.prototype.constructor = Node;


// Page represents a Template page object, this is also a wrapper for Mustache
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
