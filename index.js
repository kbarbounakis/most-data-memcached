/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2014-11-27

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice, this
 list of conditions and the following disclaimer.

 * Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation
 and/or other materials provided with the distribution.

 * Neither the name of most-query nor the names of its
 contributors may be used to endorse or promote products derived from
 this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 */
var util = require("util"),
    Memcached = require("memcached"),
    winston  = require("winston"),
    bson = require("bson"),
    BSON = new bson.BSONPure.BSON();
/**
 * Implements the cache for a data application.
 * @class MemcachedCache
 * @param {{host:string,port:number,maxKeySize:number,poolSize:number,timeout:number,remove:boolean,ttl:number}|*} options
 * @constructor
 * @augments EventEmitter2
 */
function MemcachedCache(options) {
    options = options || {};
    options.host = options.host || '127.0.0.1';
    options.port = options.port || 11211;
    options.ttl = options.ttl || (20*60);
    this.options = options;
}


/**
 * Sets a key value pair in cache.
 * @param {string} key - A string that represents the key of the cached value
 * @param {*} value - The value to be cached
 * @param {number=} ttl - A TTL in seconds. This parameter is optional.
 * @param {function(Error=,boolean=)} callback - Returns true on success. This parameter is optional.
 */
MemcachedCache.prototype.add = function(key, value, ttl, callback) {
    var self = this;
    callback = callback || function() {};
    try {
        var memcached = new Memcached(self.options.host + ':' + self.options.port);
        addInternal.call(self, memcached, key, value, ttl, function(err, result) {
                memcached.end();
               if (err) {
                   winston.log('debug', util.format('An error occured while trying to add cache item (%s).', key));
                   winston.log('error', err);
                   return callback(err);
               }
                else {
                   callback(null, result);
               }
        });
    }
    catch(e) {
        callback(e);
    }
};

/**
 * Removes a cached value.
 * @param {string} key - A string that represents the key of the cached value
 * @param {function(Error=,number=)} callback - Returns the number of deleted entries. This parameter is optional.
 */
MemcachedCache.prototype.remove = function(key, callback) {
    var self = this;
    callback = callback || function() {};
    try {
        if (typeof key === 'undefined' || key == null) {
            return callback(new Error('Invalid key. Expected string.'));
        }
        var memcached = new Memcached(self.options.host + ':' + self.options.port);
        memcached.del(key, function(err, result) {
            //close connection
            memcached.end();
            //if an error occured
            if (err) {
                winston.log('debug', util.format('An error occured while trying to delete cache item (%s).', key));
                winston.log('error', err);
            }
            //otherwise return true
            callback(null, (typeof result === 'undefined') ? 0 : 1);
        });
    }
    catch(e) {
        callback(e);
    }
};

/**
 * Flushes the underlying cache.
 * @param {function(Error=,number=)} callback - Returns the number of deleted entries. This parameter is optional.
 */
MemcachedCache.prototype.flush = function(callback) {
    var self = this;
    callback = callback || function() {};
    try {
        var memcached = new Memcached(self.options.host + ':' + self.options.port);
        memcached.flush(function(err) {
            memcached.end();
            if (err) {
                winston.log('An error occured while trying to flush cache.');
                winston.log('error', err);
            }
            callback();
        });
    }
    catch(e) {
        callback(e);
    }
};

/**
 * Gets a cached value defined by the given key.
 * @param {string|*} key
 * @param {function(Error=,*=)} callback - A callback that returns the cached value, if any.
 */
MemcachedCache.prototype.get = function(key, callback) {
    var self = this;
    callback = callback || function() {};
    try {
        var memcached = new Memcached(self.options.host + ':' + self.options.port);
        getInternal.call(this, memcached, key, function(err, result) {
            //close connection
            memcached.end();
            if (err) {
                winston.log('debug', util.format('An error occured while trying to get cache item (%s).', key));
                winston.log('error', err);
                return callback(err);
            }
            //return result
            callback(null, result);
        });
    }
    catch(e) {
        callback(e);
    }
};
/**
 * @private
 * Gets a cached value defined by the given key.
 * @param {Memcached|*} thisCache
 * @param {string|*} key
 * @param {function(Error=,*=)} callback - A callback that returns the cached value, if any.
 */
function getInternal(thisCache, key, callback) {
    var self = this;
    callback = callback || function() {};
    try {
        if (typeof key === 'undefined' || key == null) {
            return callback(new Error('Invalid key. Expected string.'));
        }
        thisCache.get(key, function(err, result) {
            //if an error occured
            if (err) {
                return callback(err);
            }
            if (typeof result === 'undefined' || result == null) {
                return callback(null, result);
            }
            else if (Buffer.isBuffer(result)) {
                callback(null, BSON.deserialize(result));
            }
            else {
                callback(null, result);
            }
        });
    }
    catch(e) {
        callback(e);
    }
};

/**
 * @private
 * Sets a key value pair in cache.
 * @param {Memcached|*} thisCache
 * @param {string} key - A string that represents the key of the cached value
 * @param {*} value - The value to be cached
 * @param {number=} ttl - A TTL in seconds. This parameter is optional.
 * @param {function(Error=,boolean=)} callback - Returns true on success. This parameter is optional.
 */
function addInternal(thisCache, key, value, ttl, callback) {
    var self = this;
    callback = callback || function() {};
    if (typeof key === 'undefined' || key == null) {
        return callback(new Error('Invalid key. Expected string.'));
    }
    try {
        var setValue;
        if (Buffer.isBuffer(value)) {
            callback(new Error('Unsupported value type. Buffer object is not yet implemented.'))
        }
        if (typeof value === 'undefined' || value == null)
            setValue = null;
        else if (typeof value === 'object')
        //serialize to buffer
            setValue = BSON.serialize(value, false, true, false);
        else
            setValue = value;
        thisCache.set(key, setValue, (ttl || self.options.ttl), function(err) {
            //if an error occured
            if (err) {
                return callback(err);
            }
            //otherwise return true
            callback(null, true);
        });
    }
    catch(e) {
        callback(e);
    }
}

/**
 * Gets data from cache or executes the defined function and adds the result to the cache with the specified key
 * @param {string|*} key - A string thath represents the of the cached data
 * @param {function(function(Error=,*=))} fn - A function to execute if data will not be found in cache
 * @param {function(Error=,*=)} callback - A callback function that will return the result or an error, if any.
 */
MemcachedCache.prototype.ensure = function(key, fn, callback) {
    var self = this;
    callback = callback || function() {};
    try {
        if (typeof fn !== 'function') {
            callback(new Error('Invalid argument. Expected function.'));
            return;
        }
        var memcached = new Memcached(self.options.host + ':' + self.options.port);
        getInternal.call(this, memcached, key, function(err, result) {
            if (err) {
                memcached.end();
                winston.log('debug', util.format('An error occured while trying to ensure cache item (%s).', key));
                winston.log('error', err);
                return callback(err);
            }
            if (typeof result !== 'undefined') {
                memcached.end();
                return callback(null, result);
            }
            fn(function(err, result) {
                if (err) { memcached.end(); return callback(err); }
                addInternal.call(self, memcached, key, result, self.options.ttl, function(err, result) {
                    //close connection
                    memcached.end();
                    //if an error occured
                    if (err) {
                        return callback(err);
                    }
                    //otherwise return the result
                    callback(null, result);
                });
            });
        });
    }
    catch(e) {
        callback(e);
    }
};

if (typeof exports !== 'undefined')
{
    module.exports = {
        /**
         * @constructs {MemcachedCache}
         */
        MemcachedCache:MemcachedCache,
        /**
         *
         * @param {{host:string,port:number,maxKeySize:number,poolSize:number,timeout:number,remove:boolean,ttl:number}|*=} options
         * @returns MemcachedCache
         */
        create: function(options) {
            return new MemcachedCache(options);
        }
    };
}