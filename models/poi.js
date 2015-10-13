var db = require('../db');

var POI = db.model('POI', {
	location:    { type: String,  required: true },
	guid    :    { type: String,  required: true },
	date    :  	 { type: Date,    required: true, default: Date.now },
});

module.exports = POI;
