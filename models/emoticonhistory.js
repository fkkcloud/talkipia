var db = require('../db');

var EmoticonHistory = db.model('EmoticonHistory', {
	location:    { type: String,  required: true },
	lifespan:    { type: Number,  required: true },
	lifeend :    { type: Number,  required: true },
	guid    :    { type: String,  required: true },
	type    :    { type: Number,  required: true },
	date    :  	 { type: Date,    required: true, default: Date.now },
});

module.exports = EmoticonHistory;
