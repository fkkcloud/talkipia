var db = require('../db');

var History = db.model('History', {
	_id     :    { type: String,  required: true },
	body    :    { type: String,  required: true },
	place   :  	 { type: String,  required: true },
	location:    { type: String,  required: true },
	lifespan:    { type: Number,  required: true },
	lifeend :    { type: Number,  required: true },
	guid    :    { type: String,  required: true },
	guidtgt :    { type: String,  required: true },
	islocal :    { type: Boolean, required: true },
	roomid  :    { type: String,  required: false },
	date    :  	 { type: Date,    required: true, default: Date.now },
	devicetoken : 	 { type: String, required: false, default: '0' },
	userid  :    { type: String,  required: true },
});

module.exports = History;
