var router = require('express').Router();

// app.use(path, 인자) - 인자에 router를 리턴하고, path가 일어날때마다 사용하도록 하는 미들웨어 바인딩 방식
router.use('/', require('./static')); // same as app.use(require('./controllers/api/static'))

// app.use(path, 인자) - 인자에 router를 리턴하고, path가 일어날때마다 사용하도록 하는 미들웨어 바인딩 방식
router.use('/api', require('./api'));

module.exports = router;