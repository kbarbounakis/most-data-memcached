## Most Web Framework Data Caching Service with Memcached

@themost/memcached implements the usage of [Memcached](https://memcached.org/) 
as backend for caching data inside Most Web Framework applications.

##### Installation

    npm install @themost/memcached

#### Configuration

Add settings/memcached section in your application configuration file (config/app.json)

    ...
    "settings": {
            "memcached": {
                "host": "127.0.0.1",
                "port": 11211,
                "maxExpiration": 1200
            },
            ...
            "auth": {
                "name": ".MAUTH",
                "timeout": 480,
                "slidingExpiration": false
            },
            ...
        }
    ...

* `host`: the memcached server host address (the default value is 127.0.0.1)
* `port`: the memcached server port (the default value is 11211)
* `maxExpiration`: the maximum expiration time of keys (in seconds).

For a complete documentation about memcached extra options read 
[memcached module docs](https://github.com/3rd-Eden/memcached#options)

### Usage

In your application startup script register MemcachedCacheStrategy as DataCacheStrategy:

    import {HttpApplication} from '@themost/web/app';
    import path from 'path';
    import {LocalizationStrategy, I18nLocalizationStrategy} from "@themost/web/localization";
    import {DataCacheStrategy} from "@themost/data";
    import {MemcachedCacheStrategy} from "@themost/memcached";
    
    //initialize app
    let app = new HttpApplication(path.resolve(__dirname));
    
    //set static content
    app.useStaticContent(path.resolve('./app'));
    
    //use i18n localization strategy
    app.useStrategy(LocalizationStrategy, I18nLocalizationStrategy);
    
    //use memcached as caching strategy
    app.getConfiguration().useStrategy(DataCacheStrategy, MemcachedCacheStrategy);
    
    //start http application
    app.start({
        port:process.env.PORT ? process.env.PORT: 3000,
        bind:process.env.IP || '0.0.0.0'
    });
