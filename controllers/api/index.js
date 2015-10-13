
var router = require('express').Router();

router.use('/posts', require('./posts'));

router.use('/sessions', require('./sessions'));

router.use('/rooms', require('./rooms'));

router.use('/replies', require('./replies'));

router.use('/emoticons', require('./emoticons'));

router.use('/pois', require('./pois'));

module.exports = router;