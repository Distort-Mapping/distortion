'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp', ['myApp.filters', 'myApp.services', 'myApp.directives', 'ui.bootstrap', 'ngDragDrop', 'angular-gestures']).
  config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {

	$locationProvider.html5Mode(true);

    $routeProvider.when('/home', {controller: distortArrangeCtrl});
    $routeProvider.otherwise({redirectTo: '/'});
  }]);
