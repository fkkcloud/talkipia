
var router = require('express').Router();

router.use('/posts', require('./posts'));

router.use('/sessions', require('./sessions'));

router.use('/rooms', require('./rooms'));

router.use('/replies', require('./replies'));

module.exports = router;