'use strict';

angular.module('wooice', ['ngRoute', 'ui.bootstrap', 'ui.slider', 'angular-inview', 'wooice.directives', 'wooice.config', 'wooice.player', 'wooice.waver', 'angularLocalStorage', 'feedback.services', 'playlist.services',
        'auth.services', 'guest.services', 'profile.services', 'sound.services', 'tag.services', 'storage.services', 'user.services', 'sound.pro.services', 'util.services', 'admin.services',
        'page.controllers', 'auth.controllers', 'guest.controllers', 'profile.controllers', 'stream.controllers', 'common.stream.controllers', 'user.stream.controllers', 'user.message.controllers', 'footer.controllers',
        'modal.controllers', 'header.controllers', 'interest.controllers', 'sound.controllers', 'sound.social.controllers', 'player.controllers', 'upload.controllers', 'admin.controllers', 'infringe.controllers']).

    config(['$routeProvider', '$httpProvider', '$locationProvider',
        function ($routeProvider, $httpProvider, $locationProvider) {
            $routeProvider.
                when('/', {templateUrl: 'partials/cover.html', controller: ''}).
                when('/stream', {templateUrl: 'partials/commonStream.html', controller: ''}).
                when('/stream/:value', {templateUrl: 'partials/userStream.html', controller: 'userBasicController'}).
                when('/stream/:filter/:value', {templateUrl: 'partials/commonStream.html', controller: ''}).
                when('/sound/:soundId', {templateUrl: 'partials/soundDetail.html', controller: ''}).
                when('/player/:soundId', {templateUrl: 'partials/player.html', controller: ''}).
                when('/messages', {templateUrl: 'partials/user/messages.html', controller: ''}).
                when('/message/:msgId', {templateUrl: 'partials/user/message.html', controller: ''}).
                when('/iframe', {templateUrl: 'partials/iframe.html', controller: ''}).
                when('/infringement', {templateUrl: 'partials/infringement.html', controller: 'infringeCtrl'}).
                when('/profile', {templateUrl: 'partials/userProfile.html', controller: 'userProfileCtrl'}).
                when('/admin', {templateUrl: 'partials/adminHome.html', controller: 'userProfileCtrl'}).
                when('/upload', {templateUrl: 'partials/upload.html', controller: 'soundUploadCtrl'}).
                when('/interest', {templateUrl: 'partials/interest.html', controller: 'interestCtrl'}).
                when('/copyright', {templateUrl: 'partials/copyright.html', controller: ''}).
                when('/auth/confirm', {templateUrl: 'partials/auth/confirm.html', controller: 'confirmControl'}).
                when('/auth/changePass', {templateUrl: 'partials/auth/changePass.html', controller: 'changePassCtrl'}).
                when('/auth/resetPass', {templateUrl: 'partials/auth/resetPass.html', controller: 'resetPassCtrl'}).
                otherwise({redirectTo: '/'});

            var httpErrors = ['$q', '$location', function ($q) {
                var success = function (response) {
                    return response;
                };

                var error = function (response) {
                    switch (response.status) {
                        case 401:
                            if (!(response.config && response.config.url && response.config.url.indexOf("auth/isAlive") > -1)) {
                                $('#login_modal').modal();
                            }

                            return $q.reject(response);
                        case 403:
                            $('#forbidden_modal').modal();
                            return $q.reject(response);
                        case 404:
                            $('#notFound_modal').modal();
                            return $q.reject(response);
                        default:
                            return $q.reject(response);
                    }
                };

                return function (promise) {
                    return promise.then(success, error);
                };
            }];

            $locationProvider.html5Mode(true);
            $locationProvider.hashPrefix('!');

            $httpProvider.responseInterceptors.push(httpErrors);
        }])

    .run(function ($rootScope, config, $location, $anchorScroll, $routeParams, Auth, UserService, Guest, PlayList, storage) {
        $rootScope.config = config;

        var routesThatDontRequireAuth = ['/guest', '/auth', '/interest', '/stream', '/sound'];
        var routesThatForAdmins = ['/admin'];
        var routesNoCheck = ["/player", "/iframe"];

        // check if current location matches route
        var routeGuest = function (route) {
            return _.find(routesThatDontRequireAuth,
                function (noAuthRoute) {
                    return _.str.startsWith(route, noAuthRoute);
                });
        };

        // check if current location matches route
        var routeAdmin = function (route) {
            return _.find(routesThatForAdmins,
                function (noAuthRoute) {
                    return _.str.startsWith(route, noAuthRoute);
                });
        };

        var noCheck = function (route) {
            return _.find(routesNoCheck,
                function (noCheckRoute) {
                    return _.str.startsWith(route, noCheckRoute);
                });
        }

        $rootScope.$on('$locationChangeStart', function (event, next, current) {
            var user = Auth.isAlive(null, function () {
                if (!user || !user.profile) {
                    UserService.setupUser(null);
                }
                else {
                    UserService.setupUser({
                        userAlias: user.profile.alias,
                        role: user.userRoles[0].role
                    });
                    UserService.setColor(user.profile.color);
                    UserService.setAvatar(user.profile.avatorUrl);
                    UserService.setUnreadMsgs(user.unreadMsgs);
                }

                if (routeAdmin($location.url()) && !UserService.validateRoleAdmin()) {
                    $('#forbidden_modal').modal();
                    event.preventDefault();
                    return;
                }
                if (!routeGuest($location.url()) && UserService.validateRoleGuest()) {
                    event.preventDefault();

                    return;
                }
            }, function () {
                if (storage && storage.get("rememberUser") && storage.get('token') && storage.get('userId')) {
                    var user = {userId: storage.get('userId'),
                        token: storage.get('token')};

                    Guest.tokenLogin({}, user, function (curUser) {
                        $('#login_modal').modal('hide');

                        UserService.setupUser({
                            userAlias: curUser.profile.alias,
                            role: curUser.userRoles[0].role
                        });
                        UserService.setColor(curUser.profile.color);
                        UserService.setAvatar(curUser.profile.avatorUrl);

                        $.cookie('show_verify', false);

                        PlayList.setup();
                    }, function () {
                        UserService.setupUser(null);
                        $('#login_modal').modal();
                    });
                }
                else {
                    UserService.setupUser(null);
                    if (noCheck($location.url()) || routeGuest($location.url())) {
                        return;
                    }

                    if (!$location.url() || $location.url() == "" || $location.url() == "/" || $location.url() == "/#missionId") {
                        return;
                    }

                    $('#login_modal').modal();
                }
            });
        });

    });