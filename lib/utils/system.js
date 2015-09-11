'use strict';

// The Utils module to be exported.
module.exports = {
    extend : function(obj, props, filter) {
        for(var item in props) {
            obj[item] = props[item];
        }
    return obj;
    },
    inherit : function(base, parameters) { //Rename this
        var inherit = Object.create(base.prototype);
        Object.getPrototypeOf(inherit).constructor.call(inherit, parameters);
        return inherit;
    },
    addMethod : function(object, name, handler) {
        this.addProperty.call(this, object, name, handler);
    },
    addProperty : function(object, name, value) {
    	Object.defineProperty(object, name, {value: value});
    },
    copyProperty : function(source, target, property) {
    	return target[property] = source[property];
    },
    cloneMethod : function(sourceObject, property, target){
    	target[property] = sourceObject[property];
    },
	containsKey : function(object, key) {
		return !~~Object.keys(object).indexOf(key);
	},
	hasPrototypeKey : function(object, key) {
		return this.hasProperty(Object.getPrototypeOf(object), key);
	},
    hasProperty : function(object, property) {
    	return Object.hasOwnProperty.call(object, property);
    },
    getProperty : function(object, property) {
        if(this.hasProperty(object, property)) {
            return object[property];
        } else {
            return false;
        }
    },
    toJSON : function(input) {
    	return JSON.stringify(input);
    },
    parseJSON : function(inputObject) {
        var data = inputObject;
        this.getKeys(data).forEach(function(key) {
            var value = data[key];
            if(value.substr(0,1) == "{" || value.substr(0,1) == "[") {
                value = value.replace(/\\/g, "");
                data[key] = JSON.parse(value);
            }
        });
        return data;
    },
    contains : function(input, char){
    	//returns true if exists
    	var input = input || this.valueOf(); //verify
    	return (!~input.indexOf(char)==0);
    },
    getValue : function(property){
    	if(!this.hasOwnProperty(property)) {
    		return this[property];
    	}
    },
    getKeys : function(object) {
        return Object.keys(object);
    },
    initWithMixin : function(base, mixin, initValues) {
    	var obj;
    	if(initValues) {
    		obj = new base(initValues);
    	} else {
    		obj = new base;
    	}
    	if(mixin) this.extend(obj, mixin);	
		return obj;
    },
    getType : function (object) {
	    if(object) return this.getFuncName(object);
		return null;
	},
	getProto : function(object) {
		if(object) return this.getFuncName(Object.getPrototypeOf(object));
		return null;
	},
	getFuncName : function(func){
		return func.constructor.toString().match(/function\s*([^(]*)\(/)[1] || null;
	},
	getParam : function(object, param) {
		if(object.hasOwnProperty(param)) return object[param];
		return null;
	},
	_config : function(sourceObject, configObject) {
		var config = {};
		config.isConfig = true;
		for(var item in configObject) {
			config[item] = configObject[item];
		}
		this.extend(sourceObject, config);
	}		
}
