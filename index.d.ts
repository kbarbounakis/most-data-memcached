/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
///
declare interface MemcachedOptions {

    host: string;

    port: number;

    maxKeySize?: number;

    poolSize?: number;

    timeout?: number;

    remove?: boolean;

    maxExpiration?: number;
}

export declare class MemcachedCache {
    /**
     *
     * @param options
     */
    constructor(options?: MemcachedOptions);
    /**
     *
     * @param key
     * @param callback
     */
    remove(key: string, callback: (err?: Error) => void): void;

    /**
     *
     * @param callback
     */
    removeAll(callback: (err?: Error) => void): void;

    /**
     *
     * @param key
     * @param value
     * @param ttl
     * @param callback
     */
    add(key: string, value: any, ttl?: number, callback?: (err?: Error) => void): void;

    /**
     *
     * @param key
     * @param getFunc
     * @param callback
     */
    ensure(key: string, getFunc: (err?: Error, res?: any) => void, callback?: (err?: Error) => void): void;

    /**
     *
     * @param key
     * @param callback
     */
    get(key: string, callback?: (err?: Error, res?: any) => void): void;
}


export declare class MemcachedCacheStrategy {

    options: MemcachedOptions;

    add(key: string, value: any, absoluteExpiration?: number): Promise<any>;

    remove(key: string): Promise<any>;

    clear(): Promise<any>;

    get(key: string): Promise<any>;

    getOrDefault(key: string, getFunc: Promise<any>, absoluteExpiration?: number): Promise<any>;

}