
var router = require('express').Router();

router.use('/posts', require('./posts'));

//router.use('/refresh', require('./refresh')); // 강아지 GET

module.exports = router;