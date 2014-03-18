'use strict';

/* Controllers */

angular.module('interest.controllers', [])
    .controller('interestCtrl', ['$scope', 'config', '$routeParams', 'Tag', 'UserSocial',
        function ($scope, config, $routeParams, Tag, UserSocial) {
            $scope.pageNum = 1;
            $scope.pageSize = 8;
            $scope.curatedTags = [];
            $scope.recommendUsers = [];
            $scope.includePage = "";
            $scope.curCategory = '音乐流派';
            $scope.includePage = "partials/stream.html";
            $scope.loadingUsers = false;

            var categories = Tag.categories({}, function () {
                $.each(categories, function (index, cate) {
                    cate.id = index;
                });
                $scope.categories = categories;
            });

            $scope.loadingUsers = true;
            var tags = Tag.curated({}, function () {
                var interestedTags = [];
                $.each(tags, function (index, tag) {
                    if (tag.interested) {
                        tag.class = "#191919";
                        interestedTags.push(tag.label);
                    }
                    else {
                        tag.class = 'gray';
                    }
                    $scope.curatedTags.push(tag);
                });

                var users = UserSocial.getRecommandByTags({}, {tags: interestedTags, pageNum: $scope.pageNum, pageSize: $scope.pageSize}, function () {
                    $scope.loadingUsers = false;
                    $.each(users, function (index, user) {
                        user.route = config.userStreamPath + user.profile.alias;
                        if (!user.userPrefer) {
                            user.userPrefer = {};
                        }
                        if (user.profile.description && user.profile.description.length >= 18) {
                            user.profile.descSummary = user.profile.description.substring(0, 18) + "...";
                        }
                    });
                    $.each(users, function (index, user) {
                        var exist = false;
                        $.each($scope.recommendUsers, function (index, recommendUser) {
                            if (user.profile.alias == recommendUser.profile.alias) {
                                exist = true;
                            }
                        });
                        if (!exist) {
                            $scope.recommendUsers.push(user);
                        }
                    });
                });
            });

            $scope.toogleInterest = function (curatedTag) {
                $scope.$apply();

                if (curatedTag.interested) {
                    curatedTag.class = "gray";
                    curatedTag.interested = false;
                }
                else {
                    curatedTag.class = "#191919";
                    curatedTag.interested = true;
                }

                var interestedTags = {tags: [], pageNum: $scope.pageNum, pageSize: $scope.pageSize};
                $.each($scope.curatedTags, function (index, curatedTag) {
                    if (curatedTag.interested) {
                        interestedTags.tags.push(curatedTag.label);
                    }
                });
                $scope.curatedTags.change = !$scope.curatedTags.change;

                var users = UserSocial.getRecommandByTags({}, interestedTags, function () {
                    $.each(users, function (index, user) {
                        users.class = "";
                        user.route = config.userStreamPath + user.profile.alias;
                    });
                    $.each(users, function (index, user) {
                        var exist = false;
                        $.each($scope.recommendUsers, function (index, recommendUser) {
                            if (user.profile.alias = recommendUser.profile.alias) {
                                exist = true;
                            }
                        });
                        if (!exist) {
                            $scope.recommendUsers.push(user);
                        }
                    });
                });
            }

        }]);