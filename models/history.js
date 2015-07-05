var db = require('../db');

var History = db.model('History', {
	body    :    { type: String, required: true },
	place   :  	 { type: String, required: true },
	location:    { type: String, required: true },
	lifespan:    { type: Number, required: true },
	lifeend :    { type: Number, required: true },
	guid    :    { type: String, required: true },
	date    :  	 { type: Date,   required: true, default: Date.now }
});

module.exports = History;
