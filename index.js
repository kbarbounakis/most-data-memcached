/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
///
const Memcached = require("memcached");
const Args = require('@themost/common').Args;
const TraceUtils = require('@themost/common').TraceUtils;
const ConfigurationStrategy = require('@themost/common').ConfigurationStrategy;


/**
 * @this MemcachedCache
 * @private
 * Gets a cached value defined by the given key.
 * @param {Memcached|*} thisCache
 * @param {string|*} key
 * @param {Function} callback - A callback that returns the cached value, if any.
 */
function getInternal(thisCache, key, callback) {
    callback = callback || function() {};
    try {
        if (typeof key === 'undefined' || key == null) {
            return callback(new Error('Invalid key. Expected string.'));
        }
        thisCache.get(key, (err, result) => {
            //if an error occurred
            if (err) {
                return callback(err);
            }
            callback(null, result);
        });
    }
    catch(err) {
        callback(err);
    }
}

/**
 * @this MemcachedCache
 * @private
 * Sets a key value pair in cache.
 * @param {Memcached|*} thisCache
 * @param {string} key - A string that represents the key of the cached value
 * @param {*} value - The value to be cached
 * @param {number=} ttl - A TTL in seconds. This parameter is optional.
 * @param {Function=} callback - Returns true on success. This parameter is optional.
 */
function addInternal(thisCache, key, value, ttl, callback) {
    callback = callback || function() {};
    if (typeof key === 'undefined' || key == null) {
        return callback(new Error('Invalid key. Expected string.'));
    }
    try {
        let setValue;
        if (typeof value === 'undefined' || value == null)
            setValue = null;
        else
            setValue = value;
        thisCache.set(key, setValue, (ttl || this.options.maxExpiration), (err) => {
            //if an error occurred
            if (err) {
                return callback(err);
            }
            //otherwise return true
            callback(null, true);
        });
    }
    catch(err) {
        callback(err);
    }
}

/**
 * Implements the cache for a data application.
 * @class
 * @deprecated
 */
class MemcachedCache {
    /**
     *
     * @param {MemcachedOptions} options
     */
    constructor(options) {
        this.options = Object.assign({
            host: "127.0.0.1",
            port: 11211,
            ttl: 1200
        }, options);
    }

    /**
     * Sets a key value pair in cache.
     * @param {string} key - A string that represents the key of the cached value
     * @param {*} value - The value to be cached
     * @param {number=} ttl - A TTL in seconds. This parameter is optional.
     * @param {Function=} callback - Returns true on success. This parameter is optional.
     */
    add(key, value, ttl, callback) {
        callback = callback || function() {};
        try {
            let memcached = new Memcached(this.options.host + ':' + this.options.port, this.options);
            addInternal.bind(this)(memcached, key, value, ttl, (err, result) => {
                memcached.end();
                if (err) {
                    return callback(err);
                }
                else {
                    return callback(null, result);
                }
            });
        }
        catch(err) {
            callback(err);
        }
    }

    /**
     * Removes a cached value.
     * @param {string} key - A string that represents the key of the cached value
     * @param {Function} callback - Returns the number of deleted entries. This parameter is optional.
     */
    remove(key, callback) {
        callback = callback || function() {};
        try {
            if (typeof key === 'undefined' || key == null) {
                return callback(new Error('Invalid key. Expected string.'));
            }
            let memcached = new Memcached(this.options.host + ':' + this.options.port, this.options);
            memcached.del(key, (err, result) => {
                //close connection
                memcached.end();
                //if an error occurred
                if (err) {
                    TraceUtils.error('An error occurred while trying to delete cache item [' + key + '].');
                    TraceUtils.error(err);
                }
                //otherwise return true
                return callback(null, (typeof result === 'undefined') ? 0 : 1);
            });
        }
        catch(err) {
            return callback(err);
        }
    }

    /**
     * Flushes the underlying cache.
     * @param {Function} callback - Returns the number of deleted entries. This parameter is optional.
     */
    flush(callback) {
       callback = callback || function() {};
        try {
            let memcached = new Memcached(this.options.host + ':' + this.options.port, this.options);
            memcached.flush((err) => {
                memcached.end();
                if (err) {
                    TraceUtils.error('An error occurred while trying to flush cache.');
                    TraceUtils.error(err);
                }
                return callback();
            });
        }
        catch(err) {
            callback(err);
        }
    }
    /**
     * Gets a cached value defined by the given key.
     * @param {string|*} key
     * @param {Function} callback - A callback that returns the cached value, if any.
     */
    get(key, callback) {
         callback = callback || function() {};
        try {
            let memcached = new Memcached(this.options.host + ':' + this.options.port, this.options);
            getInternal.call(this, memcached, key, (err, result) => {
                //close connection
                memcached.end();
                if (err) {
                    return callback(err);
                }
                //return result
                return callback(null, result);
            });
        }
        catch(err) {
            return callback(err);
        }
    }


    /**
     * Retrieves stats items information.
     * @param {Function} callback - A callback function that will return the result or an error, if any.
     */
    items(callback) {
        try {
            let memcached = new Memcached(this.options.host + ':' + this.options.port, this.options);
            memcached.items(function(err, result) {
                memcached.end();
                return callback(err, result);
            });
        }
        catch(err) {
            callback(err);
        }
    }


    /**
     * Gets data from cache or executes the defined function and adds the result to the cache with the specified key
     * @param {string|*} key - A string which represents the of the cached data
     * @param {Function} fn - A function to execute if data will not be found in cache
     * @param {Function} callback - A callback function that will return the result or an error, if any.
     */
    ensure(key, fn, callback) {
        callback = callback || function() {};
        try {
            if (typeof fn !== 'function') {
                callback(new Error('Invalid argument. Expected function.'));
                return;
            }
            let memcached = new Memcached(this.options.host + ':' + this.options.port, this.options);
            getInternal.bind(this)(memcached, key, (err, result) => {
                if (err) {
                    memcached.end();
                    return callback(err);
                }
                else if (typeof result !== 'undefined') {
                    memcached.end();
                    return callback(null, result);
                }
                fn((err, result) => {
                    if (err) {
                        memcached.end();
                        return callback(err);
                    }
                    addInternal.bind(this)(memcached, key, result, this.options.ttl, (err) => {
                        //close connection
                        memcached.end();
                        //if an error occurred
                        if (err) {
                            return callback(err);
                        }
                        //otherwise return the result
                        callback(null, result);
                    });
                });
            });
        }
        catch(err) {
            callback(err);
        }
    }

}



/**
 * @class
 */
class MemcachedCacheStrategy extends ConfigurationStrategy {
    /**
     *
     * @param {ConfigurationBase} config
     */
    constructor(config) {
        super(config);
        this.options = Object.assign({
            host: "127.0.0.1",
            port: 11211,
            maxExpiration: 1200
        }, this.getConfiguration().getSourceAt('settings/memcached'));
    }

    /**
     * Sets a key value pair in cache.
     * @param {string} key - A string that represents the key of the cached value
     * @param {*} value - The value to be cached
     * @param {number=} absoluteExpiration - An absolute expiration time in seconds. This parameter is optional.
     * @returns {Promise|*}
     */
    add(key, value, absoluteExpiration) {
        return new Promise((resolve, reject) => {
            this.open((err, cache) => {
                cache.set(key, value, absoluteExpiration || this.options.maxExpiration, (err, res) => {
                    cache.end();
                    if (err) {
                        return reject(err);
                    }
                    return resolve(res);
                });
            });
        });
    }

    /**
     * This callback is displayed as a global member.
     * @callback MemcachedConnectionCallback
     * @param {Error=} err
     * @param {Memcached=} cache
     */

    /**
     * Opens a new memcached connection
     * @private
     * @param {MemcachedConnectionCallback} callback
     */
    open(callback) {
        try {
            let conn = new Memcached(this.options.host + ':' + this.options.port, this.options);
            return callback(null, conn);
        }
        catch(err) {
            return callback(err);
        }
    }


    /**
     * Gets the value for the given key.
     * @param {string} key
     * @returns {Promise|*}
     */
    get(key) {
        return new Promise((resolve, reject) => {
            this.open((err, cache) => {
                cache.get(key, (err, res) => {
                    cache.end();
                    if (err) {
                        return reject(err);
                    }
                    return resolve(res);
                });
            });
        });
    };

    /**
     * Removes cached data based on the given key.
     * @param {string} key - A string that represents the key of the cached value to be removed
     * @returns {Promise|*}
     */
    remove(key) {
        return new Promise((resolve, reject) => {
            this.open((err, cache) => {
                cache.del(key, (err, res) => {
                    cache.end();
                    if (err) {
                        return reject(err);
                    }
                    return resolve((typeof res === 'undefined') ? 0 : 1);
                });
            });
        });
    };
    /**
     * Flushes the cached data.
     * @abstract
     * @returns {Promise|*}
     */
    clear() {
        return new Promise((resolve, reject) => {
            this.open((err, cache) => {
                cache.flush((err) => {
                    cache.end();
                    if (err) {
                        return reject(err);
                    }
                    return resolve();
                });
            });
        });
    }

    getOrDefault(key, getFunc, absoluteExpiration) {
        return new Promise((resolve, reject) => {
            this.get(key).then((res)=> {
                if (typeof res !== 'undefined') {
                    return resolve(res);
                }
                try {
                    let source = getFunc();
                    Args.check(typeof source !== 'undefined' && typeof source.then === 'function', 'Invalid argument. Expected a valid promise.');
                    return source.then((res) => {
                        if (typeof res === 'undefined') {
                            return resolve();
                        }
                        return this.add(key, res, absoluteExpiration).then(()=> {
                            return resolve(res);
                        });
                    });
                }
                catch(err) {
                    return reject(err);
                }

            }).catch((err)=> {
                return reject(err);
            });
        });
    }

}



if (typeof exports !== 'undefined')
{
    module.exports.MemcachedCache = MemcachedCache;
    module.exports.MemcachedCacheStrategy = MemcachedCacheStrategy;
}