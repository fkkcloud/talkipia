// 강아지 GET
/*
var Post = require('../../models/post');
var router = require('express').Router();
var db = require('../../db.js');
var Promise = require('bluebird');
var promiseWhile = require('../../scripts/promiseWhileLoop');

var isDirty = true;
var postCount = 0;
var currCount = 0;

router.get('/', function(req, res, next){
	var condition = function(){
		//console.log("Is it dirty? :", currCount !== postCount)
    	return currCount !== postCount;
	}

	var action = function() {
		Post.count(function(err, count){
			if (err) { return next(err); }
			currCount = count;
		});
		// Action to run, should return a promise
    	return new Promise(function(resolve, reject) {
	        // Arbitrary 10ms async method to simulate async process
	        // In real usage it could just be a normal async event that 
	        // returns a Promise.
	        setTimeout(function() {
	            resolve();
	        }, 1);
		});
	}

	promiseWhile(condition, action)
	.then(function() {
	    // Notice we can chain it because it's a Promise, 
	    // this will run after completion of the promiseWhile Promise!
	    console.log("Done -- Refreashing MAP!!!!!!!!!!!!!!!!-------");
	    Post.count(function(err, count){
			if (err) { return next(err); }
			postCount = count;
			currCount = count;
		});

		return res.status(200).json({});
	}, 
	function(err){ 
		console.log("Not done?:", err); 
	});
});

module.exports = router;
*/