angular.module('todo', ['ionic'])
  .controller('TodoCtrl', function($scope) {
    // Initialize tasks
    $scope.tasks =
      [
        {title: "First", completed: true},
        {title: "Second", completed: false},
        {title: "Third", completed: false},
      ];

  });
