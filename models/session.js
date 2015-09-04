var db = require('../db');

var Session = db.model('Session', {
	guid    	:    { type: String, required: true },
	location	:    { type: String, required: true },
	watchloc	:    { type: String, required: true },
	guidtgt 	:    { type: String, required: true },
	date    	:  	 { type: Date,   required: true,  default: Date.now },
	devicetoken : 	 { type: String, required: false, default: '0' },
	onlinestat  :    { type: Boolean, required:true,  default: false }
});

module.exports = Session;
