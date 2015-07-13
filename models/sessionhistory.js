var db = require('../db');

var SessionHistory = db.model('SessionHistory', {
	guid    :    { type: String, required: true },
	location:    { type: String, required: true },
	watchloc:    { type: String, required: true },
	guidtgt :    { type: String, required: true },
	date    :  	 { type: Date,   required: true, default: Date.now }
});

module.exports = SessionHistory;
