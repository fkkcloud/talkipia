var db = require('../db');

var SessionHistory = db.model('SessionHistory', {
	guid    	:    { type: String, required: true },
	location	:    { type: String, required: true },
	watchloc	:    { type: String, required: true },
	guidtgt 	:    { type: String, required: true },
	date    	:  	 { type: Date,   required: true,  default: Date.now },
	devicetoken : 	 { type: String, required: false, default: '0' },
	onlinestat  :    { type: Boolean, required:true,  default: false }
});

module.exports = SessionHistory;
