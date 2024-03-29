var db = require('../db');

var Room = db.model('Room', {
	postid  :    { type: String,  required: true },
	body    :    { type: String,  required: true  },
	location:    { type: String,  required: true  },
	place   :    { type: String,  required: true  },
	guid    :    { type: String,  required: true  },
	date    :    { type: Date,    required: true,  default: Date.now },
	pushid  :    { type: String,  required: false, default: '0' },
	like    :    { type: Number,  required: true,  default: 0 },
	view    :    { type: Number,  required: true,  default: 0 },
	userid  :    { type: String,  required: true },
	userplace:   { type: String,  required: true },
	bgimg   :    { type: String, required: true },
	islocal :    { type: Boolean, required: true},
	profileImg : { type: String, required: true }
});

module.exports = Room;