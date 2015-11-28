/* 
  ResourceWriter is instantiated by the ResourceWrapper Object. 
  The ResourceWriter is a Factory Class that constructs
  a message response based on Mime type. (ie, JSON, HTML)
*/

//Import Core Modules
var $S = require('../../utils/system');

//Export Modules
module.exports = exports = ResourceWriter;
exports.JSON = JSONwriter;
exports.HTML = HTMLwriter;

//Factory Class
function ResourceWriter(output) {
	var type = $S.getType(output);
	//console.log("RESOURCE OUTP---", type);
	switch(type) {
		// String will default to HTML
		case "String":
			var output = output.toString() || "Output";
			output = "<!DOCTYPE html><body>" + output + "</body></html>";
		break;
		// Plain JS Object
		case "Object":
			output = {"output" :  output};
		break;
		//JSONwriter contains a values object
		case "JSONwriter":
			output = output.values;
			//TODO: consider calling the 'build' method here
		break;
		case "HTMLwriter":
			Array.prototype.unshift.call(output.values, "<!DOCTYPE html>");
			output.values.push("</html>");
			output = output.values.join("");
		break;		
	}
	//console.log("This is a Writer!!!!", typeof(output) );
	this.output = output;
};

ResourceWriter.prototype.getWriter = function(formatType, parameters) {	
	var params = parameters || null;
	var formatType = (formatType || 'json');
		// If formatType is either json or jsonp
		if(!~"jsonp".indexOf(formatType) == 0) {
			if(formatType === 'jsonp') {
				if(typeof this.output === 'object') this.output = JSON.stringify(this.output); 
				return $S.inherit(JSONPwriter, {values:this.output, query:params}).write(); //if JSONP	
			} 
			return $S.inherit(JSONwriter, this.output).write();
			// HTML and special renderer types get returned as an HTMLWriter object
		} else if(formatType == "html" || formatType == "post" || formatType == "edit") {
			return $S.inherit(HTMLwriter, this.output).write();
		}
};

// Writer Base Prototype
function OutputWriter(output){
	this.values = [];//(values || []);
	this.output = output;
};
OutputWriter.prototype.constructor = OutputWriter;
OutputWriter.prototype.write = function() {
	// console.log("THIS IS THE WRITE CALL METHOD====", typeof this.output)
	if(typeof this.output === 'object') {		
		return JSON.stringify(this.output);	
	} 
	return this.output;
};
OutputWriter.prototype.build = function() {
	var values = this.values;
	var len = values.length-2;
	if(values[len] == ',') values.splice(len,1);
	this.values = values.join("");
	//return this;
};

$S.copyProperty($S, OutputWriter.prototype, "getType");
$S.copyProperty($S, OutputWriter.prototype, "getParam");

//JSONP Object writer
function JSONPwriter(/* values, query */) {
	var args = Array.prototype.slice.call(arguments, 0)[0];
	//console.log("JSONPwriter----", args.values)
	var cb = this.getParam(args.query, "callback"); //get the remote callback name
	//console.log("JSONPwriter==== Type---> ",typeof(args.values) )
	//OutputWriter.call(this, cb+"("+JSON.stringify(args.values)+");");
	OutputWriter.call(this, cb+"("+ args.values +");"); //Object
};
JSONPwriter.prototype = Object.create(OutputWriter.prototype);
JSONPwriter.prototype.constructor = JSONPwriter;

//JSON Object writer
function JSONwriter(values) {
	OutputWriter.call(this, values);
};
JSONwriter.prototype = Object.create(OutputWriter.prototype);
JSONwriter.prototype.constructor = JSONwriter;
$S.extend(JSONwriter.prototype, {
	object : function() {
		this.values.push("{");
		return this;
	},
	endObject : function() {
		this.values.push("}");
		return this;
	},
    nextItem : function() {
        this.values.push(",");
        return this;
    },
	array : function() {
		this.values.push("[");
		return this;
	},
	endArray : function() {
		this.values.push("]");
		return this;
	},
	end : function() {
		var isObj = this.values[0];
		if(isObj == '{') {
			this.endObject();
		} else {
			this.endArray();
		}
		this.build();		
	},
	key : function(keyName) {
		this.values.push('\"'+keyName+'\":');
		return this;
	},
	value : function(value) {
		if(typeof value == 'object') {
			this.values.push(JSON.stringify(value));
			return this;
		}
		if(!Number.isInteger(value)) {			
			this.values.push('\"' +value+ '\"');
		} else {
			this.values.push(value);
		}
		return this;
	},
	insert : function(value) {
		this.value(value);
		this.nextItem();
		return this;
	},
	insertObject : function(value) {
		this.values.push(value.values);
		this.nextItem();
		return this;
	},
	length : function() {
		return this.values.length;
	},
	nextKeyValue : function(key, value) {
		this.nextItem();
		this.key(key);
		this.value(value);
		return this;
	},
	keyValue : function(key, value) {
		this.key(key);
		this.value(value);
		return this;
	},
	parse : function(data) {
		this.data = JSON.parse(data);
		return this.getData();
	},
	getData : function() {
		return this.data;
	}
});
//TODO::: Fix the Inheritance... Build the HTML Writer.. and send it to output:
//HTML Object writer
function HTMLwriter(htmlContent) {	
	OutputWriter.call(this, htmlContent);
};
HTMLwriter.prototype = Object.create(OutputWriter.prototype);
HTMLwriter.prototype.constructor = HTMLwriter;
$S.extend(HTMLwriter.prototype, {
	head : function(values) {
		var head = [];
		var i = 0;
		for(var item in values) {
			head[i++] = "<" + item + ">" + values[item] + "</" + item + ">";
		}
		this.values.push("<head>" + head.join("") + "</head>");
		return this;
	},
	title : function(value) {
		this.head({title: value});
		return this;
	},
	body : function(value) {
		this.values.push("<body>" + value + "</body>");	
		return this;
	}
});