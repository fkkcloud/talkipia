// 강아지 GET에서 썼던 모듈인데 다른곳에 쓰일지 모르겠음.
// asynchronous while loop임.
// 한 task가 비동기적으로 진행되고 마칠때 비로소 다음 task로 넘어간다.

/*
var Promise = require('bluebird');

var promiseWhile = function(condition, action) {
    var resolver = Promise.defer();

    var loop = function() {
        if (condition()) return resolver.resolve();
        return Promise.cast(action())
            .then(loop)
            .catch(resolver.reject);
    };

    process.nextTick(loop);

    return resolver.promise;
};

module.exports = promiseWhile;
*/