# seed-nunjucks

Basic project setup with templating engine.

##### Node Modules
* jQuery
* normalize-css

##### Build Stack
* gulp
* scss
* browser-sync
* jshint
* nunjucks

## Requirements
* nodejs
* ruby

## Setup

Install scss lint ruby gem
```
gem install scss_lint
```

Install gulp and its plugins:
```
npm install
```

Run gulp and start webserver with live-reload:
```
gulp
```

## Stage

Development = default.

Production
```
gulp prod
```

## Version History

### 1.8.2
* add scss lint

### 1.8.1
* add html hint
* add stylish reporter to js hint
* update packages

### 1.8.0
* rename replace task
* move main index.html to _dev-root
* add htmlmin for production
* html prettify only for development

### 1.7.2
* add uncss for production
* update packages

### 1.7.1
* fix for main js / css
* use google closure compiler

### 1.7.0
* add stage environment handling

### 1.6.2
* update packages
* add watcher for package.json

### 1.6.1
* update packages
* optimize sass error logging

### 1.6.0
* refactor gulpfile.js

### 1.5.3
* update packages

### 1.5.2
* update packages

### 1.5.1
* use relative paths for detecting new / deleted files

### 1.5.0
* replace minify-css with cssnano

### 1.4.0
* add replace tokens function
* update packages

### 1.3.0
* remove bower

### 1.2.0
* add browsersync, plumber, prettify, jshint
* restructure gulpfile.js

### 1.1.0
* add version string replacement.

### 1.0.0
* initial version.