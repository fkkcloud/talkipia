var db = require('../db');

var Post = db.model('Post', {
	body    :    { type: String,  required: true },
	place   :  	 { type: String,  required: true },
	location:    { type: String,  required: true },
	lifespan:    { type: Number,  required: true },
	lifeend :    { type: Number,  required: true },
	guid    :    { type: String,  required: true },
	guidtgt :    { type: String,  required: true },
	islocal :    { type: Boolean, required: true },
	date    :  	 { type: Date,    required: true, default: Date.now }
});

module.exports = Post;
