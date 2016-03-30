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
var rename = require("gulp-rename");
var concat = require("gulp-concat");
var replace = require("gulp-replace");
var prettify = require("gulp-jsbeautifier");
var serve = require("browser-sync");
var environments = require("gulp-environments");

var css_sass = require("gulp-sass");
var css_prefix = require("gulp-autoprefixer");
var css_minify = require("gulp-cssnano");
var css_uncss = require("gulp-uncss");

var js_jshint = require("gulp-jshint");
var js_cc = require("gulp-closure-compiler");


/* set environments
 * ------------------------------------------------ */
var production = environments.production;


/* get packackage.json
 * ------------------------------------------------ */
var pkg;
var getFile = function (file) {
  "use strict";
  return JSON.parse(fs.readFileSync(file));
};

var getConfig = function () {
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
var replaceTokens = function (match, tokenName) {
  "use strict";

  var tokenValue = pkg[tokenName];

  if (tokenValue) {
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
    src: ["css/main.bundle.scss", "css/**/*.scss", "css/**/*.css"],
    dest: {
      path: "../css/",
      file: "main.bundle.css"
    },

    // vendor styles
    vendor: {
      src: ["node_modules/normalize.css/normalize.css"],
      dest: {
        path: "../css/",
        file: "vendor.bundle.min.css"
      }
    }
  },

  // scripts
  scripts: {
    src: ["js/**/*.js"],
    dest: {
      path: "../js/",
      file: "main.bundle.min.js"
    },

    // vendor scripts
    vendor: {
      src: ["node_modules/jquery/dist/jquery.min.js"],
      dest: {
        path: "../js/",
        file: "vendor.bundle.min.js"
      }
    }
  },

  // templates
  templates: {
    src: ["templates/**/*.html"],
    dest: "../",
  },

  // token replacement
  replace: {
    token: /@_@(.*?)@_@/g,
    src: ["*.json", "env/*.json"]
  }
};



/*
 * TASKS
 ****************************************************/


/* templates
 * ------------------------------------------------ */
gulp.task("templates", ["package"], function (done) {
  "use strict";

  gulp.src(config.templates.src)

  // replace tokens
  .pipe(replace(config.replace.token, replaceTokens))

  // prettify
  .pipe(prettify({
    indentSize: 4
  }))

  // write to dist
  .pipe(gulp.dest(config.templates.dest))

  // finish
  .on("end", done);
});


/* styles
 * ------------------------------------------------ */
gulp.task("styles", function (done) {
  "use strict";

  gulp.src(config.styles.src)

  // init plumber
  .pipe(plumber())

  // compile sass
  .pipe(css_sass().on("error", css_sass.logError))

  // add vendor prefixes
  .pipe(css_prefix({
    browsers: ["last 2 versions"]
  }))

  // concat
  .pipe(concat(config.styles.dest.file))

  // uncss (only for production)
  .pipe(
    production(
      css_uncss({
        html: ["templates/index.html"]
      })
    )
  )

  // minify
  .pipe(css_minify({
    zindex: false,
    discardComments: {
      removeAll: true
    }
  }))

  // rename
  .pipe(rename({
    extname: ".min.css"
  }))

  // write to dist
  .pipe(gulp.dest(config.styles.dest.path))

  // finish
  .on("end", done);
});


/* scripts
 * ------------------------------------------------ */
gulp.task("scripts", function (done) {
  "use strict";

  gulp.src(config.scripts.src)

  // init plumber
  .pipe(plumber())

  // do js hint check
  .pipe(js_jshint())

  // reporter output
  .pipe(js_jshint.reporter("default"))

  // fail task on reporter output
  .pipe(js_jshint.reporter("fail"))

  // closure compiler
  .pipe(js_cc(config.scripts.dest.file))

  // write to destination
  .pipe(gulp.dest(config.scripts.dest.path))

  // finish
  .on("end", done);
});


/* concat all vendor specific styles
 * ------------------------------------------------ */
gulp.task("vendor:styles", function (done) {
  "use strict";

  gulp.src(config.styles.vendor.src)

  // init plumber
  .pipe(plumber())

  // concat all styles into vendor.bundle.min.css
  .pipe(concat(config.styles.vendor.dest.file))

  // write to dist
  .pipe(gulp.dest(config.styles.vendor.dest.path))

  // finish
  .on("end", done);
});


/* concat all vendor specific scripts
 * ------------------------------------------------ */
gulp.task("vendor:scripts", function (done) {
  "use strict";

  gulp.src(config.scripts.vendor.src)

  // init plumber
  .pipe(plumber())

  // concat all scripts into vendor.bundle.min.js
  .pipe(concat(config.scripts.vendor.dest.file))

  // write to dist
  .pipe(gulp.dest(config.scripts.vendor.dest.path))

  // finish
  .on("end", done);
});


/* local webserver
 * ------------------------------------------------ */
gulp.task("serve", function () {
  "use strict";

  serve({
    server: {
      baseDir: "../.",
      notify: false
    }
  });
});


/* get package.json combined with environment json
 * ------------------------------------------------ */
gulp.task("package", function () {
  "use strict";

  pkg = getConfig();
});


/* set environment to PROD
 * ------------------------------------------------ */
gulp.task("set-prod", production.task);


/* manual build
 * ------------------------------------------------ */
gulp.task("build", ["templates", "styles", "scripts", "vendor:styles", "vendor:scripts"]);


/* watch files for changes
 * ------------------------------------------------ */
gulp.task("watch", ["build"], function () {
  "use strict";

  // watch and reload browsersync
  gulp.watch(config.templates.src, ["templates", serve.reload]);
  gulp.watch(config.styles.src, ["styles", serve.reload]);
  gulp.watch(config.scripts.src, ["scripts", serve.reload]);
  gulp.watch(config.replace.src, ["templates", serve.reload]);

});


/* default task (DEV)
 * ------------------------------------------------ */
gulp.task("default", ["watch", "serve"]);


/* enviroment task (PROD)
 * ------------------------------------------------ */
gulp.task("prod", ["set-prod", "default"]);