/*
 * ANGULAR APP
 ****************************************************/
var app = angular.module("myApp", []);


/* default controller
 * ------------------------------------------------ */
app.controller("DefaultCtrl", ["$scope", function ($scope) {
  "use strict";

  $scope.dummy = "Hello Angular World!";

}]);