/**
 * Module dependencies.
 */

var express = require('express')
  , passport = require('passport')
  , nowww = require('nowww')
  , log = require('debug')('app:config')
  , MongoStore = require('connect-mongo')(express)
  , path = require('path')
  , env = require('./env')
  , utils = require('lib/utils')
  , expressUrl = require('lib/express-url');

/**
 * Expose `Config`
 *
 * @api private
 */

module.exports = Config;

/**
 * Configs Express Application with
 * defaults configs
 */

function Config(app) {
  /**
   * Set `development` only settings
   */

  app.configure('development', function() {

    // Log config settigs load
    log( 'development settings' );

    /**
     * Load custom `config` settings from
     * file `config.json`
     */

    app.set( 'config', require('./config.dev.json') );

    /**
     * Set `mongoUrl` to `mongodb://localhost/pdr`
     * for MongoDB connection
     */

    app.set( 'mongoUrl', 'mongodb://localhost/pdr-app' );

    /**
     * Build
     */

    app.use(require('lib/build').middleware);

  });


  /**
   * Set `testing` only settings
   */

  app.configure('testing', function() {

    // Log config settigs load
    log( 'testing settings' );

    /**
     * Load custom `config` settings from
     * file `config.json`
     */

    app.set( 'config', require('./config.testing.json') );

    /**
     * Set `mongoUrl` to `mongodb://localhost/pdr-testing`
     * for MongoDB connection
     */

    app.set( 'mongoUrl', 'mongodb://localhost/pdr-testing' );

    /**
     * Build
     */

    app.use(require('lib/build'));

  });


  /**
   * Set `production` only settings
   */

  app.configure('production', function() {

    // Log config settigs load
    log( 'production settings' );

    /**
     * Set `nowww` middleware helper
     */

    app.use( nowww() );
    
    /**
     * Set `native` express compression middleware
     */

    app.use( express.compress() );
    
    /**
     * Set custom `config` settings from
     * file `config.json`
     */
    
    var confFile = {};
    
    try {
      confFile = require('./config.json');
    } catch (e) {
      log( 'loading config settings from heroku only' )
    }

    app.set( 'config', utils.merge( env, confFile ) );
    
    /**
     * Set `mongoUrl` setting from environment
     * for MongoDB connection
     */

    app.set( 'mongoUrl', app.get('config').mongoUrl );

    /**
     * Set `Basic HTTP-Auth` restriction middleware
     */
    // app.use(express.basicAuth('pepe', 'tortugasninja'));
    // app.use( utils.httpAuth(app) );

  });

  /**
   * Set `common` settings
   */

  app.configure(function() {
    // Log config settigs load
    log( 'common settings' );

    /**
     * Set application http server port from `env`
     * Defaults to 3005
     */

    app.set( 'port', process.env.PORT || 3005 );
    
    /**
     * Set `public-assets` default path
     */

    app.use( express.static( path.join(__dirname, '..', '/public') ) );
    
    /**
     * Configure native `express` body parser
     */

    app.use( express.bodyParser() );
    
    /**
     * Configure native `express` cookie parser
     */

    app.use( express.cookieParser('democracyos-cookie') );
    
    /**
     * Configure native `express` session middleware
     */

    app.use( express.session( {
        cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 },
        secret: 'democracyos-secret',
        key: "democracyos.org",
        store: new MongoStore( { url: app.get('mongoUrl') } )
      } )
    );

    /**
     * Use `passport` setup & helpers middleware
     */

    app.use(passport.initialize());
    
    /**
     * Use `passport` sessions middleware
     */

    app.use(passport.session());
    
    /**
     * Set template `custom` helpers
     */

    app.use(function(req, res, next) {

      // Markdown template helper
      res.locals.md = utils.md;

      // Call next middleware
      next();

    });
    
    /**
     * View `helper` for building up relative routes
     */
  
    app.use( expressUrl(app) );

    /**
     * Set template local variables
     */

    app.use(function(req, res, next) {

      // Set default page 'class'
      if(!res.locals.page) res.locals.page = "default";

      // Set user as local var if authenticated
      if(req.isAuthenticated() && req.user) res.locals.citizen = req.user;

      // Set categories as local var
      res.locals.categories = app.get('categories');

      // Call next middleware
      next();

    });
        
    /**
     * Set native `express` router middleware
     */

    app.use(app.router);
    
    // Here we should have our own error handler!
    
    /**
     * Set native `express` error handler
     */

    app.use(express.errorHandler());
  });

}