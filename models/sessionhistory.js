var db = require('../db');

var SessionHistory = db.model('SessionHistory', {
	guid    	:    { type: String, required: true },
	location	:    { type: String, required: true },
	watchloc	:    { type: String, required: true },
	guidtgt 	:    { type: String, required: true },
	userid  	:    { type: String,  required: true },
	date    	:  	 { type: Date,   required: true,  default: Date.now },
	devicetoken : 	 { type: String, required: false, default: '0' },
	onlinestat  :    { type: Boolean, required:true,  default: false },
	lastupdate  :    { type: Date,   required: true,  default: Date.now },
	following   :    { type: String, required: false },
	blocklist   :    { type: String, required: false },
});

module.exports = SessionHistory;
