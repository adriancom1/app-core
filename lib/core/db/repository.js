'use strict';
/* 
  Repository Internal API
  @ClientSession is returned.
*/

// Import NodeJs Modules
var EventEmitter = require('events').EventEmitter;

// Import Core Modules
var $S = require('../../utils/system');


// Import Vendor Modules
var redis = require('redis');
var config = require('config');


// Export Modules
module.exports = exports = {};
exports.connect = function() {
	return Repository();
};

function Repository() {	
	// ClientSession represents a client connection to Redis 
	function ClientSession() {
		var repo;
		// Redis Config Server Params - DEV or PROD
		var config = require('config');
		var redisConf = config.get('Redis.dbConfig');
		if(~redisConf.name.indexOf('prod') != 0) {
			var url = require('url'); 
			var redisURL = url.parse(process.env.REDIS_URL);
			repo = this.repo = redis.createClient(redisURL.port, redisURL.hostname);
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
		//@urlMapString = String which represents a LUA evalsha command
		getNode : function(luaScriptParams) {
			var self = this;
			var client = this.repo;
			var sha = luaScriptParams.shift(); //SHA Object ID
			client.evalsha(sha /* LUA Object ID */, 3, luaScriptParams[0]/* collection */,
				luaScriptParams[1]/* recordId */, luaScriptParams[2]/*tableName*/, function(err, data) {
					var output = data;
					if(err !== null) {
						output = {error : err.toString()};
					}
					self.emit("data", output);
				client.quit();
			});			
		},
		post : function(luaScriptParams) {
			
		}

		//Todo: Future feature: add a login method
	}
	$S.extend(ClientSession.prototype, EventEmitter.prototype);
	return new ClientSession();
	
};