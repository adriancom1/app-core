/* 
  Repository Internal API
  @ClientSession is returned.
*/


//TODO: GetNODE... pull from REDIS FIX

// Import NodeJs Modules
var EventEmitter = require('events').EventEmitter;

// Import Core Modules
var _sysUtils = require('../../utils/system');


// Import Vendor Modules
var redis = require('redis');
var config = require('config');


// Export Modules
module.exports = exports = {};
exports.connect = function() {
	return Repository();
};

function Repository() {	
	
	//Base type, everything pulled from the repository is inherited from Item class
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


	// ClientSession represents a client connection to Redis 
	function ClientSession() {
		var repo = this.repo = null;
		// Redis Config Server Params - DEV or PROD
		var config = require('config');
		var redisConf = config.get('Redis.dbConfig');
		if(~redisConf.name.indexOf('prod') != 0) {
			var url = require('url'); 
			var redisURL = url.parse(process.env.REDIS_URL);
			this.repo = redis.createClient(redisURL.port, redisURL.hostname);
			repo.auth(redisURL.auth.split(":")[1]);			
		} else if (redisConf.name == "dev") {
			this.repo = redis.createClient(redisConf.port, redisConf.host);
		}
		EventEmitter.call(this);
	};
	
	ClientSession.prototype = {
		constructor : ClientSession,
		close : function() {
			this.repo.end();
			this.repo = null;
		},
		
		getNode : function(objectId, indexField, fieldName, collection, dataType) {
			//@operation = CRUD action to perform (create, read, update, delete)
			var luaScript = 'Redis.scripts.'+ operation +'.sha'
			var script = config.get(luaScript);
			
			var dataType = dataType || "string";
			var client = this.repo;
			var _id, _node, _nodeName;
			var commands = client.multi();
			var self = this;
			var callback = function(err, data) {
				_sysUtils.extend(_node, data); //copy the properties from the repository as a Node object		
				self.emit("data",  _node);
				client.quit();
			};


			//Begin by extracting the unique ID value
			commands.hget("index:"+objectId+":"+indexField, fieldName, function(err, id) {
				_nodeName = objectId+":"+id+":" + collection;
				switch(dataType) {
					case "sha" :
						if(dataType = "sha") {
							//Todo: Refactor this to call a server side LUA script
							// Refactor this to optimize for handling Server Side Scripts
							var argLen = indexField || 0;
							var param1 = fieldName || null;
							var param2 = collection || null;
							client.evalsha(objectId,  argLen , param1, param2, function(err, data) {
								self.emit("data",  data);
								client.quit();
							});
						}
						break;
					case "hash":
						_node = new Node(id);
						client.hgetall(_nodeName, callback);
						break;
					case "string":
						client.get(_nodeName, callback);
						break;
					case "page":
						_node = new Page(id);
						client.get(_nodeName, function(err, data) {
							_node.source = data;
							self.emit("pageNode", _node);
						});
					break;
				}
			});
			commands.exec(
				//This Section HANDLES Creation of Pages...this will be Refactored
				// function(err, $id) {
				// 	self.once("pageNode", function(pageNode) {
				// 		var _return = function(err, data) {
				// 			self.emit("data",  pageNode);
				// 			client.quit();
				// 		}
				// 		var _itemReturn = function($pageNode, item) {
				// 			var self = $pageNode;
				// 			return function(err, data) {
				// 				self[item] = data;
				// 			}
				// 		}
				// 		var _objectId = objectId+":"+$id;
				// 		client.hgetall(_objectId + ":components", function(err, comp ){
				// 			for(var item in comp) {
				// 				commands.hget("index:pages:components:" + item, comp[item], _itemReturn(pageNode, item));
				// 			}
				// 			commands.exec(_return);
				// 		});
				// 	})					
				// }
			);
		}
		//Todo: Future feature: add a login method
	}
	_sysUtils.extend(ClientSession.prototype, EventEmitter.prototype);
	return new ClientSession();
	
};