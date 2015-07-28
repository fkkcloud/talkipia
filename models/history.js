var db = require('../db');

var History = db.model('History', {
	body    :    { type: String,  required: true },
	place   :  	 { type: String,  required: true },
	location:    { type: String,  required: true },
	lifespan:    { type: Number,  required: true },
	lifeend :    { type: Number,  required: true },
	guid    :    { type: String,  required: true },
	guidtgt :    { type: String,  required: true },
	islocal :    { type: Boolean, required: true },
	date    :  	 { type: Date,    required: true, default: Date.now },
	devicetoken : 	 { type: String, required: false, default: '0' }
});

module.exports = History;
