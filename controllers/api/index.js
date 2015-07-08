
var router = require('express').Router();

router.use('/posts', require('./posts'));

router.use('/sessions', require('./sessions'));

module.exports = router;