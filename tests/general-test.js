/**
 * Created by kbarbounakis on 7/21/15.
 */
var cache = require("./../index"), winston = require("winston");
describe('Most Data Memcached General Test', function() {
    var gcache = cache.create();
    it('should cache string', function(done) {
        gcache.add('/message', "Hello World" , 20, function(err) {
            done(err);
        });
    });
    it('should get cached string', function(done) {
        gcache.get('/message', function(err, result) {
            winston.log('info', 'GET CACHED STRING: ' + result);
            done(err);
        });
    });
    it('should cache item', function(done) {
        var value = { name:'Anonymous',description:'Anonymous User', dateCreated: new Date(), enabled:true };
        gcache.add('/User/100', value , 20, function(err, result) {
            done(err);
        });
    });

    it('should get cache item', function(done) {
        gcache.get('/User/100', function(err, result) {
            winston.log('info', result);
            done(err);
        });
    });
    it('should ensure cache item #1', function(done) {
        gcache.ensure('/User/101', function(callback) {
            callback(null, { name:'Administrator',description:'Administrator User', dateCreated: new Date(), enabled:true })
        }, function(err, result) {
            winston.log('info', result);
            done(err);
        });
    });
    it('should ensure cache item #2', function(done) {
        gcache.ensure('/User/101', function(callback) {
            callback(null, { name:'Administrator',description:'Administrator Site User', dateCreated: new Date(), enabled:true })
        }, function(err, result) {
            winston.log('info', result);
            done(err);
        });
    });
});