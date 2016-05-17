/*
 * ANGULAR APP
 ****************************************************/
var app = angular.module("App", ["ui.router"]);


/* ui routes
 * ------------------------------------------------ */
app.config(["$stateProvider", "$urlRouterProvider", function($stateProvider, $urlRouterProvider) {
  "use strict";

  $stateProvider.state("home", {
    url: "/home",
    views: {
      main: {
        templateUrl: "views/home.html",
        controller: "DefaultCtrl"
      }
    }
  })

  .state("about", {
    url: "/about",
    views: {
      main: {
        templateUrl: "views/about.html",
        controller: "DefaultCtrl"
      }
    }
  })

  .state("contact", {
    url: "/contact",
    views: {
      main: {
        templateUrl: "views/contact.html",
        controller: "DefaultCtrl"
      }
    }
  });

  $urlRouterProvider.otherwise("/home");

}]);


/* default controller
 * ------------------------------------------------ */
app.controller("DefaultCtrl", ["$scope", function($scope) {
  "use strict";

  $scope.dummy = "Hello Angular World!";

}]);
