var db = require('../db');

var SessionHistory = db.model('SessionHistory', {
	guid    	:    { type: String, required: true },
	location	:    { type: String, required: true },
	watchloc	:    { type: String, required: true },
	guidtgt 	:    { type: String, required: true },
	userid  	:    { type: String,  required: true },
	date    	:  	 { type: Date,   required: true,  default: Date.now },
	pushid      : 	 { type: String, required: false, default: '0' },
	onlinestat  :    { type: Boolean, required:true,  default: false },
	lastupdate  :    { type: Date,   required: true,  default: Date.now },
	blocklist   :    { type: String, required: true, default:"[\"1234\"]" },
});

module.exports = SessionHistory;
