// Include gulp
var gulp = require("gulp");

// Include Plugins
var sass = require("gulp-sass");
var minifyCss = require("gulp-minify-css");
var rename = require("gulp-rename");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");
var webserver = require("gulp-webserver");
var autoprefixer = require("gulp-autoprefixer");
var nunjucksRender = require("gulp-nunjucks-render");
var prettify = require("gulp-jsbeautifier");
var data = require("gulp-data");
var replace = require("gulp-replace");

// Get packackage.json
var fs = require("fs");
var pkg = JSON.parse(fs.readFileSync("./package.json"));

// Source Paths
var srcPaths = {
  styles: ["./css/**/*.scss"],
  scripts: ["./js/**/*.js"],
  vendor: {
    scripts: ["./bower_components/jquery/dist/jquery.min.js"],
    styles: ["./bower_components/normalize-css/normalize.css"]
  },
  templates: ["./templates/**/*.html"]
};

// Distribution Paths
var distPaths = {
  styles: "../css/",
  scripts: "../js/",
  vendor: {
    styles: "../css/",
    scripts: "../js/"
  },
  templates: "../"
};

// Server Settings
var server = {
  host: "localhost",
  port: "8001"
};

// Complile SCSS
gulp.task("sass", function (done) {
  "use strict";

  gulp.src("./css/main.bundle.scss")
    .pipe(sass({
      errLogToConsole: true
    }))
    .pipe(autoprefixer({
      browsers: ["last 2 versions"]
    }))
    .pipe(gulp.dest(distPaths.styles))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({
      extname: ".min.css"
    }))
    .pipe(gulp.dest(distPaths.styles))
    .on("end", done);
});

// UglifyJs task.
gulp.task("uglify", function (done) {
  "use strict";

  gulp.src(srcPaths.scripts)
    .pipe(concat("main.bundle.min.js"))
    .pipe(uglify({
      mangle: false
    }))
    .pipe(gulp.dest(distPaths.scripts))
    .on("end", done);
});

// Task to minify all vendor specific files.
gulp.task("vendor-styles", function (done) {
  "use strict";

  gulp.src(srcPaths.vendor.styles)
    .pipe(concat("vendor.bundle.min.css"))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(gulp.dest(distPaths.vendor.styles))
    .on("end", done);
});

// Task to minify all vendor specific files.
gulp.task("vendor-scripts", function (done) {
  "use strict";

  gulp.src(srcPaths.vendor.scripts)
    .pipe(concat("vendor.bundle.min.js"))
    .pipe(gulp.dest(distPaths.vendor.scripts))
    .on("end", done);
});

// Nunjuncks Templates
gulp.task("templates", function (done) {
    "use strict";
    nunjucksRender.nunjucks.configure(srcPaths.templates.config, {
        watch: false,
        trimBlocks: true
    });

    // Gets .html and .nunjucks files in pages
    gulp.src(srcPaths.templates.pages)
    
        .pipe(replace("%VERSION%", pkg.version))
    
        // Adding data to Nunjucks
        .pipe(data(function () {
            return require("./templates/data.json");
        }))
        .pipe(nunjucksRender())
        .pipe(prettify({
            indentSize: 4
        }))
        .pipe(gulp.dest(".."))
        .on("end", done);
});

// Task to start the local webserver
gulp.task("webserver", function () {
  "use strict";

  gulp.src("../")
    .pipe(webserver({
      host: server.host,
      port: server.port,
      livereload: true,
      directoryListing: false,
      open: true
    }));
});

// Manual build
gulp.task("build", ["sass", "uglify", "vendor-styles", "vendor-scripts", "templates"]);

// Watch files for changes
gulp.task("watch", ["build"], function () {
  "use strict";

  gulp.watch(srcPaths.templates, ["templates"]);
  gulp.watch(srcPaths.styles, ["sass"]);
  gulp.watch(srcPaths.scripts, ["uglify"]);
});

// Default task
gulp.task("default", ["watch", "webserver"]);