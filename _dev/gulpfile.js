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
var serve = require("browser-sync");
var data = require("gulp-data");
var nunjucks = require("gulp-nunjucks-render");
var environments = require("gulp-environments");

var html_min = require("gulp-htmlmin");
var html_prettify = require("gulp-jsbeautifier");
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
    src: ["styles/**/*.scss"],
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
    src: ["scripts/**/*.js"],
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

  // token replacement
  replace: {
    token: /@_@(.*?)@_@/g,
  },

  // templates
  templates: {
    src: ["templates/pages/**/*.+(html|nunjucks)"],
    dest: "../",
    basepath: "templates/",
    watch: ["*.json", "env/*.json", "templates/**/*.*"]
  }
};


/*
 * TASKS
 ****************************************************/


/* templates
 * ------------------------------------------------ */
gulp.task("templates", ["package"], function(done) {
  "use strict";

  gulp.src(config.templates.src)

  // init plumber
  .pipe(plumber())

  // Adding data to Nunjucks
  .pipe(data(function() {
    return require("./templates/data.json");
  }))

  // render nunjucks templates
  .pipe(nunjucks({
    path: config.templates.basepath,
    envOptions: {
      watch: false,
      trimBlocks: true
    }
  }))

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
      html_prettify({
        indentSize: 4
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
  .pipe(gulp.dest(config.templates.dest))

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

  // do check
  .pipe(css_check({
    customReport: css_check_reporter
  }))

  // concat
  .pipe(concat(config.styles.dest.file))

  // compile
  .pipe(css_sass()
    .on("error", css_sass.logError))

  // add vendor prefixes
  .pipe(css_prefix({
    browsers: ["last 2 versions"]
  }))

  // uncss (prod)
  .pipe(
    production(
      css_uncss({
        html: ["index.html"]
      })
    )
  )

  // write to dist
  .pipe(gulp.dest(config.styles.dest.path))

  // rename
  .pipe(rename({
    extname: ".min.css"
  }))

  // minify
  .pipe(css_minify({
    zindex: false,
    discardComments: {
      removeAll: true
    }
  }))

  // write to dist
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

  // do hint check
  .pipe(js_check())

  // reporter output
  .pipe(js_check.reporter("jshint-stylish"))

  // fail task on reporter output
  .pipe(js_check.reporter("fail"))

  // concat
  .pipe(concat(config.scripts.dest.file))

  // write to destination
  .pipe(gulp.dest(config.scripts.dest.path))

  // rename
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

  serve({
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
gulp.task("build", ["templates", "styles", "scripts", "vendor:styles", "vendor:scripts"]);


/* watch files for changes
 * ------------------------------------------------ */
gulp.task("watch", ["build"], function() {
  "use strict";

  // watch and reload browsersync
  gulp.watch(config.templates.watch, ["templates", serve.reload]);
  gulp.watch(config.styles.src, ["styles", serve.reload]);
  gulp.watch(config.scripts.src, ["scripts", serve.reload]);

});


/* default task (DEV)
 * ------------------------------------------------ */
gulp.task("default", ["watch", "serve"]);


/* enviroment task (PROD)
 * ------------------------------------------------ */
gulp.task("prod", ["env:prod", "default"]);
