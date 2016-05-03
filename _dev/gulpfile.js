/*
 * DEFINITIONS
 ****************************************************/


/* include gulp & node modules
 * ------------------------------------------------ */
var gulp = require("gulp");
var fs = require("fs");
var merge = require("merge");


/* include gulp plugins
 * ------------------------------------------------ */
var plumber = require("gulp-plumber");
var order = require("gulp-order");
var replace = require("gulp-replace");
var concat = require("gulp-concat");
var rename = require("gulp-rename");
var cache = require("gulp-cached");
var remember = require("gulp-remember");
var environments = require("gulp-environments");
var prettify = require("gulp-jsbeautifier");
var serve = require("browser-sync").create();

var html_min = require("gulp-htmlmin");
var html_check = require("gulp-htmlhint");

var css_sass = require("gulp-sass");
var css_prefix = require("gulp-autoprefixer");
var css_minify = require("gulp-cssnano");
var css_uncss = require("gulp-uncss");
var css_check = require("gulp-scss-lint");
var css_check_reporter = require("gulp-scss-lint-stylish");

var js_check = require("gulp-jshint");
var js_cc = require("gulp-closure-compiler");
var js_minify = require("gulp-uglify");

//var debug = require("gulp-debug");
var dependencies = require("gulp-dependencies");


/* set environments
 * ------------------------------------------------ */
var production = environments.production;
var development = environments.development;


/* get packackage.json
 * ------------------------------------------------ */
var pkg;
var getFile = function(file) {
  "use strict";
  return JSON.parse(fs.readFileSync(file));
};
var getConfig = function() {
  "use strict";

  // get standard package.json
  var pkg = getFile("package.json");

  // get the correct environment
  var env = getFile(production() ? "env/env.prod.json" : "env/env.dev.json");

  // merge & return
  return merge.recursive(pkg, env);
};


/* replace tokens
 * ------------------------------------------------ */
var replaceTokens = function(match, tokenName) {
  "use strict";

  var tokenValue = pkg[tokenName];

  if (tokenValue || tokenValue === "") {
    return tokenValue;
  } else {
    console.warn("No matching token found for %s", tokenName);
    return "";
  }
};


/*
 * CONFIG
 ****************************************************/
var config = {

  // styles
  styles: {
    src: [
      "styles/main.scss",
      "styles/**/*.scss",
      "templates/**/*.scss"
    ],
    dest: {
      path: "../css/",
      file: "main.bundle.css"
    },

    // vendor styles
    vendor: {
      src: [
        "node_modules/normalize.css/normalize.css",
        "styles/main.css"
      ],
      dest: {
        path: "../css/",
        file: "vendor.bundle.min.css"
      }
    }
  },

  // scripts
  scripts: {
    src: [
      "scripts/main.js",
      "scripts/**/*.js",
      "templates/**/*.js"
    ],
    dest: {
      path: "../js/",
      file: "main.bundle.js"
    },

    // vendor scripts
    vendor: {
      src: [
        "node_modules/jquery/dist/jquery.min.js"
      ],
      dest: {
        path: "../js/",
        file: "vendor.bundle.min.js"
      }
    }
  },

  // token replacement
  replace: {
    token: /@_@(.*?)@_@/g,
    src: [
      "index.html"
    ],
    dest: "../",
    watch: [
      "index.html",
      "*.json",
      "env/*.json"
    ]
  }
};


/*
 * TASKS
 ****************************************************/


/* replace
 * ------------------------------------------------ */
gulp.task("replace", ["package"], function(done) {
  "use strict";

  gulp.src(config.replace.src)

  // init plumber
  .pipe(plumber())

  // replace tokens
  .pipe(replace(config.replace.token, replaceTokens))

  // do hint check
  .pipe(html_check(".htmlhintrc"))

  // reporter output
  .pipe(html_check.reporter("htmlhint-stylish"))

  // fail task on reporter output
  .pipe(html_check.failReporter({
    suppress: true
  }))

  // prettyify for development
  .pipe(
    development(
      prettify({
        indentSize: 2
      })
    )
  )

  // html min for production
  .pipe(
    production(
      html_min({
        removeComments: true,
        collapseWhitespace: true,
        removeEmptyAttributes: true
      })
    )
  )

  // write to dist
  .pipe(gulp.dest(config.replace.dest))

  // finish
  .on("end", done);
});


/* styles
 * ------------------------------------------------ */
gulp.task("styles", function(done) {
  "use strict";

  gulp.src(config.styles.src)

  // init plumber
  .pipe(plumber())

  // use only changed files
  .pipe(cache("styles"))

  // build dependencies
  .pipe(dependencies({

    // extract 'imports' and append '.scss'
    match: /@import\s+"(.+)"/g,
    replace: function(f) {
      return f + ".scss";
    },

    // destination and extension for output files
    dest: config.styles.dest.path,
    dependencies_file: "dependencies.styles.json"
  }))

  // order
  .pipe(order(config.styles.src, {
    base: "."
  }))

  // scss-lint
  .pipe(css_check({
    customReport: css_check_reporter
  }))

  // compile
  .pipe(css_sass()
    .on("error", css_sass.logError))

  // add vendor prefix
  .pipe(css_prefix({
    browsers: ["last 2 versions"]
  }))

  // format
  .pipe(prettify({
    indentSize: 2
  }))

  // add files back again
  .pipe(remember("styles"))

  // concat
  .pipe(concat(config.styles.dest.file))

  // remove unused css (prod)
  .pipe(production(
    css_uncss({
      html: ["index.html"]
    })
  ))

  // write to destination
  .pipe(gulp.dest(config.styles.dest.path))

  // rename for minification
  .pipe(rename({
    extname: ".min.css"
  }))

  // minification
  .pipe(css_minify({
    zindex: false,
    discardComments: {
      removeAll: true
    }
  }))

  // write to destination
  .pipe(gulp.dest(config.styles.dest.path))

  // finish
  .on("end", done);
});


/* scripts
 * ------------------------------------------------ */
gulp.task("scripts", function(done) {
  "use strict";

  gulp.src(config.scripts.src)

  // init plumber
  .pipe(plumber())

  // use only changed files
  .pipe(cache("scripts"))

  // js hint
  .pipe(js_check())

  // reporter output
  .pipe(js_check.reporter("jshint-stylish"))

  // fail task on reporter output
  .pipe(js_check.reporter("fail"))

  // add files back again
  .pipe(remember("scripts"))

  // order
  .pipe(order(config.scripts.src, {
    base: "."
  }))

  // concat
  .pipe(concat(config.scripts.dest.file))

  // write to destination
  .pipe(gulp.dest(config.scripts.dest.path))

  // rename for minification
  .pipe(rename({
    extname: ".min.js"
  }))

  // minify: uglify (dev)
  .pipe(development(
    js_minify()
  ))

  // minify: closure compiler (prod)
  .pipe(production(
    js_cc(config.scripts.dest.file.replace(".js", ".min.js"))
  ))

  // write to destination
  .pipe(gulp.dest(config.scripts.dest.path))

  // finish
  .on("end", done);
});


/* concat all vendor specific styles
 * ------------------------------------------------ */
gulp.task("vendor:styles", function(done) {
  "use strict";

  gulp.src(config.styles.vendor.src)

  // init plumber
  .pipe(plumber())

  // order
  .pipe(order(config.styles.vendor.src, {
    base: "."
  }))

  // concat all styles into vendor.bundle.min.css
  .pipe(concat(config.styles.vendor.dest.file))

  // write to dist
  .pipe(gulp.dest(config.styles.vendor.dest.path))

  // finish
  .on("end", done);
});


/* concat all vendor specific scripts
 * ------------------------------------------------ */
gulp.task("vendor:scripts", function(done) {
  "use strict";

  gulp.src(config.scripts.vendor.src)

  // init plumber
  .pipe(plumber())

  // order
  .pipe(order(config.scripts.vendor.src, {
    base: "."
  }))

  // concat all scripts into vendor.bundle.min.js
  .pipe(concat(config.scripts.vendor.dest.file))

  // write to dist
  .pipe(gulp.dest(config.scripts.vendor.dest.path))

  // finish
  .on("end", done);
});


/* local webserver
 * ------------------------------------------------ */
gulp.task("serve", function() {
  "use strict";

  serve.init({
    server: {
      baseDir: "../.",
      notify: false
    }
  });
});


/* get package.json combined with environment json
 * ------------------------------------------------ */
gulp.task("package", function() {
  "use strict";

  pkg = getConfig();
});


/* set environment to PROD
 * ------------------------------------------------ */
gulp.task("env:prod", production.task);


/* manual build
 * ------------------------------------------------ */
gulp.task("build", ["replace", "styles", "scripts", "vendor:styles", "vendor:scripts"]);


/* watch files for changes
 * ------------------------------------------------ */
gulp.task("watch", ["build"], function() {
  "use strict";

  // watch and reload browsersync
  gulp.watch(config.replace.watch, ["replace", serve.reload]);
  gulp.watch(config.styles.src, ["styles", serve.reload]);
  gulp.watch(config.scripts.src, ["scripts", serve.reload]);
});


/* default task (DEV)
 * ------------------------------------------------ */
gulp.task("default", ["watch", "serve"]);


/* enviroment task (PROD)
 * ------------------------------------------------ */
gulp.task("prod", ["env:prod", "default"]);
