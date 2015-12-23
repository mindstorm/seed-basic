/*
 * DEFINITIONS
 ****************************************************/


/* include gulp & node modules
 * ------------------------------------------------ */
var gulp = require("gulp");
var fs = require("fs");


/* include gulp plugins
 * ------------------------------------------------ */
var sass = require("gulp-sass");
var minifyCss = require("gulp-minify-css");
var rename = require("gulp-rename");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");
var autoprefixer = require("gulp-autoprefixer");
var nunjucksRender = require("gulp-nunjucks-render");
var prettify = require("gulp-jsbeautifier");
var data = require("gulp-data");
var replace = require("gulp-replace");
var browserSync = require("browser-sync");
var jshint = require("gulp-jshint");
var plumber = require("gulp-plumber");
var prettify = require("gulp-jsbeautifier");


/* get packackage.json
 * ------------------------------------------------ */
var pkg = JSON.parse(fs.readFileSync("./package.json"));


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


/* source paths
 * ------------------------------------------------ */
var srcPaths = {
  styles: [
    "./css/**/*.scss"
  ],
  scripts: [
    "./js/**/*.js"
  ],
  vendor: {
    styles: [
      "./node_modules/normalize.css/normalize.css"
    ],
    scripts: [
      "./node_modules/jquery/dist/jquery.min.js"
    ]
  },
  templates: {
    config: "./templates/",
    pages: "./templates/pages/**/*.+(html|nunjucks)",
    watch: "./templates/**/*.*"
  }
};


/* distribution paths
 * ------------------------------------------------ */
var distPaths = {
  styles: "../css/",
  scripts: "../js/",
  vendor: {
    styles: "../css/",
    scripts: "../js/"
  },
  templates: "../"
};


/* server settings
 * ------------------------------------------------ */
var reload = browserSync.reload;


/*
 * TASKS
 ****************************************************/


/* templates
 * ------------------------------------------------ */
gulp.task("templates", function (done) {
  "use strict";

  // nunjucks settings
  nunjucksRender.nunjucks.configure(srcPaths.templates.config, {
    watch: false,
    trimBlocks: true
  });

  gulp.src(srcPaths.templates.pages)

  // init plumber
  .pipe(plumber())

  // Adding data to Nunjucks
  .pipe(data(function () {
    return require("./templates/data.json");
  }))

  // render nunjucks templates
  .pipe(nunjucksRender())

  // replace tokens
  .pipe(replace(/%(.*?)%/g, replaceTokens))

  // prettify
  .pipe(prettify({
    indentSize: 4
  }))

  // write to dist
  .pipe(gulp.dest(distPaths.templates))

  // finish
  .on("end", done);
});


/* styles
 * ------------------------------------------------ */
gulp.task("styles", function (done) {
  "use strict";

  gulp.src("./css/app.bundle.scss")

  // init plumber
  .pipe(plumber())

  // compile sass
  .pipe(sass({
    errLogToConsole: true
  }))

  // add vendor prefixes
  .pipe(autoprefixer({
    browsers: ["last 2 versions"]
  }))

  // write to dist
  .pipe(gulp.dest(distPaths.styles))

  // minify
  .pipe(minifyCss({
    keepSpecialComments: 0
  }))

  // rename minified file
  .pipe(rename({
    extname: ".min.css"
  }))

  // write to dist
  .pipe(gulp.dest(distPaths.styles))

  // finish
  .on("end", done);
});


/* scripts
 * ------------------------------------------------ */
gulp.task("scripts", function (done) {
  "use strict";

  gulp.src(srcPaths.scripts)

  // init plumber
  .pipe(plumber())

  // do js hint check
  .pipe(jshint())

  // reporter output
  .pipe(jshint.reporter("default"))

  // fail task on reporter output
  .pipe(jshint.reporter("fail"))

  // concat
  .pipe(concat("app.bundle.min.js"))

  // minify
  .pipe(uglify({
    mangle: false
  }))

  // write to dist
  .pipe(gulp.dest(distPaths.scripts))

  // finish
  .on("end", done);
});


/* minify all vendor specific styles
 * ------------------------------------------------ */
gulp.task("vendor-styles", function (done) {
  "use strict";

  gulp.src(srcPaths.vendor.styles)

  // init plumber
  .pipe(plumber())

  // concat all styles into vendor.bundle.min.css
  .pipe(concat("vendor.bundle.min.css"))

  // minify
  .pipe(minifyCss({
    keepSpecialComments: 0
  }))

  // write to dist
  .pipe(gulp.dest(distPaths.vendor.styles))

  // finish
  .on("end", done);
});


/* minify all vendor specific scripts
 * ------------------------------------------------ */
gulp.task("vendor-scripts", function (done) {
  "use strict";

  gulp.src(srcPaths.vendor.scripts)

  // init plumber
  .pipe(plumber())

  // concat all scripts into vendor.bundle.min.js
  .pipe(concat("vendor.bundle.min.js"))

  // write to dist
  .pipe(gulp.dest(distPaths.vendor.scripts))

  // finish
  .on("end", done);
});


/* local webserver
 * ------------------------------------------------ */
gulp.task("webserver", function () {
  "use strict";

  browserSync({
    server: {
      baseDir: "../.",
      notify: false
    }
  });

});


/* manual build
 * ------------------------------------------------ */
gulp.task("build", ["templates", "styles", "scripts", "vendor-styles", "vendor-scripts"]);


/* watch files for changes
 * ------------------------------------------------ */
gulp.task("watch", ["build"], function () {
  "use strict";

  // watch and reload browsersync
  gulp.watch(srcPaths.templates.watch, ["templates", reload]);
  gulp.watch(srcPaths.styles, ["styles", reload]);
  gulp.watch(srcPaths.scripts, ["scripts", reload]);
});


/* default task
 * ------------------------------------------------ */
gulp.task("default", ["watch", "webserver"]);