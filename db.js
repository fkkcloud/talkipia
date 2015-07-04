var mongoose = require('mongoose');
var url = process.env.MONGOLAB_URI || 'mongodb://localhost/bubbles'

mongoose.connect(ur);

/*
mongoose.connect('mongodb://localhost/bubbles', function(){
	console.log('mongodb connected')
});
*/

module.exports = mongoose;