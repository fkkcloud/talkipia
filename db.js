var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/bubbles', function(){
	console.log('mongodb connected')
});

module.exports = mongoose;