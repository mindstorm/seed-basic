/*
 * DEFINITIONS
 ****************************************************/


/* include gulp & node modules
 * ------------------------------------------------ */
var gulp = require("gulp");
var fs = require("fs");


/* include gulp plugins
 * ------------------------------------------------ */
var plumber = require("gulp-plumber");
var rename = require("gulp-rename");
var concat = require("gulp-concat");
var replace = require("gulp-replace");
var prettify = require("gulp-jsbeautifier");
var serve = require("browser-sync");

var css_sass = require("gulp-sass");
var css_prefix = require("gulp-autoprefixer");
var css_minify = require("gulp-cssnano");

var js_jshint = require("gulp-jshint");
var js_minify = require("gulp-uglify");


/* get packackage.json
 * ------------------------------------------------ */
var pkg;
var getFile = function (file) {
  "use strict";
  return JSON.parse(fs.readFileSync(file));
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
      file: "main.bundle.js"
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
  token: /@_@(.*?)@_@/g
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
  .pipe(replace(config.token, replaceTokens))

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

  // concat
  .pipe(concat(config.scripts.dest.file))

  // minify
  .pipe(js_minify({
    mangle: false
  }))

  // rename
  .pipe(rename({
    extname: ".min.js"
  }))

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


/* get package.json
 * ------------------------------------------------ */
gulp.task("package", function () {
  "use strict";

  pkg = getFile("package.json");
});


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
  gulp.watch("package.json", ["templates", serve.reload]);

});


/* default task
 * ------------------------------------------------ */
gulp.task("default", ["watch", "serve"]);