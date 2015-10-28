var db = require('../db');

var PostSchema = new mongoose.Schema({
	_id     :    { type: String,  required: true },
	body    :    { type: String,  required: true },
	place   :  	 { type: String,  required: true },
	location:    { type: String,  required: true },
	lifespan:    { type: Number,  required: true },
	lifeend :    { type: Number,  required: true },
	guid    :    { type: String,  required: true },
	islocal :    { type: Boolean, required: true },
	roomid  :    { type: String,  required: false },
	date    :  	 { type: Date,    required: true, default: Date.now },
	pushid  : 	 { type: String, required: false, default: '0' },
	userid  :    { type: String,  required: true },
	userplace:   { type: String,  required: true },
	isPost  :    { type: Boolean, required: true },
	geometry:     location : {
				    type: { 
				      type: String,
				      default: 'Point'
				    }, 
				    coordinates: [Number]
				  }
});

PostSchema.index({ geometry : '2dsphere' });

var Post = db.model('Post', PostSchema);

module.exports = Post;
