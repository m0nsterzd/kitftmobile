angular.module('ionicApp', ['ionic'])
    .config(function($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('tabs', {
                url: "/tab",
                abstract: true,
                templateUrl: "tabs.html"
            })
            .state('tabs.teams', {
                url: "/teams",
                views: {
                    'teams-tab': {
                        templateUrl: "teams.html",
                        controller: 'kitftCtrl'
                    }
                }
            })
            .state('tabs.anglers', {
                url: "/anglers",
                views: {
                    'anglers-tab': {
                        templateUrl: "anglers.html",
                        controller: 'anglersCtrl'
                    }
                }
            })
            .state('tabs.boats', {
                url: "/boats",
                views: {
                    'boats-tab': {
                        templateUrl: "boats.html",
                        controller: 'boatsCtrl'
                    }
                }
            })
            .state('tabs.team_details', {
                url: "/team_details/:team_number",
                views: {
                    'teams-tab': {
                        templateUrl: "team_details.html",
                        controller: 'teamsCtrl'
                    }
                }
            })
            .state('tabs.angler_team_details', {
                url: "/angler_team_details/:team_number",
                views: {
                    'anglers-tab': {
                        templateUrl: "team_details.html",
                        controller: 'angler_teamsCtrl'
                    }
                }
            })
            .state('tabs.boat_team_details', {
                url: "/boat_team_details/:team_number",
                views: {
                    'boats-tab': {
                        templateUrl: "team_details.html",
                        controller: 'boat_teamsCtrl'
                    }
                }
            });

        $urlRouterProvider.otherwise("/tab/teams");


    })
    .factory('todoDb', function() {
        // PouchDB.destroy('kitft2014', function(err, info) {
        //     console.log(err);
        //     console.log(info)
        // });




        var db = new PouchDB('kitftmobile');
        return db;
    })
    .controller('kitftCtrl', function($scope, $ionicModal, todoDb, $ionicPopup, $ionicListDelegate, $location, $rootScope) {
        // Initialize tasks
        $scope.tasks = [];
        $scope.teams = [];
        $rootScope.anglers = [];
        $rootScope.allboats = [];

        ////////////////////////
        // Online sync to CouchDb
        ////////////////////////
        $scope.online = false;
        $scope.toggleOnline = function() {
            console.log('toggle clicked');
            $scope.online = !$scope.online;
            if ($scope.online) { // Read http://pouchdb.com/api.html#sync
                $scope.sync = todoDb.sync('http://localhost:5984/kitftmobile', {
                        live: true
                    })
                    .on('error', function(err) {
                        console.log("Syncing stopped");
                        console.log(err);
                    })
                    .on('complete', function() {

                        todoDb.query('kitft/get_team_boats', function(err, response) {
                            if (typeof response != 'undefined') {
                                for (var i = 0; i < response.rows.length; i++) {
                                    $scope.teams.push(response.rows[i].value);
                                }
                            }

                        });
                        todoDb.query('kitft/get_angler_by_team_number', function(err, response) {
                            if (typeof response != 'undefined') {
                                var result = response.rows;
                                for (var i = 0; i < result.length; i++) {
                                    $rootScope.anglers.push(result[i].value);
                                }
                            }

                        });

                        todoDb.query('kitft/get_all_boats', function(err, response) {
                            if (typeof response != 'undefined') {
                                var result = response.rows;
                                for (var i = 0; i < result.length; i++) {
                                    $rootScope.allboats.push(result[i].value);
                                }
                            }

                        });
                    });
            } else {
                $scope.sync.cancel();
            }
        };
        $scope.completionChanged = function(task) {
            task.completed = !task.completed;
            $scope.update(task);
        };

        todoDb.changes({
            live: true,
            onChange: function(change) {
                if (!change.deleted) {
                    todoDb.get(change.id, function(err, doc) {
                        if (err) console.log(err);
                        $scope.$apply(function() { //UPDATE
                            for (var i = 0; i < $scope.tasks.length; i++) {
                                if ($scope.tasks[i]._id === doc._id) {
                                    $scope.tasks[i] = doc;
                                    return;
                                }
                            } // CREATE / READ
                            $scope.tasks.push(doc);
                        });
                    })
                } else { //DELETE
                    $scope.$apply(function() {
                        for (var i = 0; i < $scope.tasks.length; i++) {
                            if ($scope.tasks[i]._id === change.id) {
                                $scope.tasks.splice(i, 1);
                            }
                        }
                    })
                }
            }
        });


        todoDb.query('kitft/get_team_boats', function(err, response) {
            if (typeof response != 'undefined') {
                for (var i = 0; i < response.rows.length; i++) {
                    $scope.teams.push(response.rows[i].value);
                }
            }
            todoDb.query('kitft/get_anglername_by_team_number', function(err, response) {
                if (typeof response != 'undefined') {
                    var result = response.rows;
                    for (var i = 0; i < result.length; i++) {
                        $rootScope.anglers.push(result[i].value);
                    }
                }

            });
            todoDb.query('kitft/get_boats', function(err, response) {
                if (typeof response != 'undefined') {
                    var result = response.rows;
                    for (var i = 0; i < result.length; i++) {
                        $rootScope.allboats.push(result[i].value);
                    }
                }

            });

        });


        $scope.teamSelect = function(team) {
            $rootScope.team = team;
            var anglers = Array();
            var boats = Array();
            todoDb.query('kitft/get_team_boats', {
                key: team.team_number.toString()
            }, function(err, response) {
                if (typeof response != 'undefined') {
                    for (var i = 0; i < response.rows.length; i++) {
                        boats.push(response.rows[i].value);
                    }
                }
            });
            todoDb.query('kitft/get_anglers_by_team_number', {
                key: team.team_number.toString()
            }, function(err, response) {
                result = response.rows;
                result.sort(function(a, b) {
                    return a.value.angler_number - b.value.angler_number;
                });
                for (var i = 0; i < result.length; i++) {
                    var obj = {
                        angler_number: result[i].value.angler_number,
                        angler: result[i].value.first_name + ' ' + result[i].value.last_name,
                        angler_cell: result[i].value.cell,
                        angler_boat: result[i].value.boat_no
                    }
                    anglers.push(obj);
                }

            });
            $rootScope.anglers = anglers;
            $rootScope.boats = boats;
            $location.path('/tab/team_details/');

        }
        $scope.anglerSelect = function(team) {
            $rootScope.team = team;
            var anglers = Array();
            var boats = Array();
            todoDb.query('kitft/get_team_boats', {
                key: team.team_number.toString()
            }, function(err, response) {
                if (typeof response != 'undefined') {
                    for (var i = 0; i < response.rows.length; i++) {
                        boats.push(response.rows[i].value);
                    }
                }

            });
            todoDb.query('kitft/get_anglers_by_team_number', {
                key: team.team_number.toString()
            }, function(err, response) {
                result = response.rows;
                result.sort(function(a, b) {
                    return a.value.angler_number - b.value.angler_number;
                });
                for (var i = 0; i < result.length; i++) {
                    var obj = {
                        angler_number: result[i].value.angler_number,
                        angler: result[i].value.first_name + ' ' + result[i].value.last_name,
                        angler_cell: result[i].value.cell,
                        angler_boat: result[i].value.boat_no
                    }
                    anglers.push(obj);
                }

            });
            $rootScope.anglers = anglers;
            $rootScope.boats = boats;
            $location.path('/tab/angler_team_details/');

        }
        $scope.boatSelect = function(team) {
            $rootScope.team = team;
            var anglers = Array();
            var boats = Array();
            todoDb.query('kitft/get_team_boats', {
                key: team.team_number.toString()
            }, function(err, response) {
                if (typeof response != 'undefined') {
                    for (var i = 0; i < response.rows.length; i++) {
                        boats.push(response.rows[i].value);
                    }
                }

            });
            todoDb.query('kitft/get_anglers_by_team_number', {
                key: team.team_number.toString()
            }, function(err, response) {
                result = response.rows;
                result.sort(function(a, b) {
                    return a.value.angler_number - b.value.angler_number;
                });
                for (var i = 0; i < result.length; i++) {
                    var obj = {
                        angler_number: result[i].value.angler_number,
                        angler: result[i].value.first_name + ' ' + result[i].value.last_name,
                        angler_cell: result[i].value.cell,
                        angler_boat: result[i].value.boat_no
                    }
                    anglers.push(obj);
                }

            });
            $rootScope.anglers = anglers;
            $rootScope.boats = boats;
            $location.path('/tab/boat_team_details/');

        }

    })
    .
controller('anglersCtrl', function($scope, $ionicModal, todoDb, $ionicPopup, $ionicListDelegate, $location, $rootScope) {


    })
    .
controller('boatsCtrl', function($scope, $ionicModal, todoDb, $ionicPopup, $ionicListDelegate, $location, $rootScope) {


    })
    .
controller('teamsCtrl', function($scope, $location, $rootScope) {

    })
    .
controller('angler_teamsCtrl', function($scope, $location, $rootScope) {

    })
    .
controller('boat_teamsCtrl', function($scope, $location, $rootScope) {

})
