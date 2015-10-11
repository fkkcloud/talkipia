var db = require('../db');

var Reply = db.model('Reply', {
	roomid  :    { type: String,  required: true },
	body    :    { type: String,  required: true  },
	location:    { type: String,  required: true  },
	guid    :    { type: String,  required: true  },
	isLocal :    { type: Boolean, required: false },
	width   :    { type: Number,  required: true  },
	date    :  	 { type: Date,    required: true,  default: Date.now },
	pushid  :    { type: String,  required: false, default: '0' },
	isOnline:    { type: String,  required: false, default: false},
	userid  :    { type: String,  required: true },
	userplace:   { type: String,  required: true },
	profileImg : { type: String,  required: true }
});

module.exports = Reply;
