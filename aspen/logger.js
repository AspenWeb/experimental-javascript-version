var aspen = require('./aspen.js');

exports.log = function(message) {
	console.log(message);
}

exports.debug = function(message) {
	if(aspen.config.debug) {
		console.log('[ASPEN] ' + message);
	}
}

exports.error = function(message) {
	console.error(message);
}