'use strict';

/* Controllers */

angular.module('page.controllers', [])
    .controller('pageCtrl', ['$scope', '$rootScope', '$routeParams', '$location', '$anchorScroll', 'User', 'UserSocial', 'SoundSocial', 'PlayList', 'WooicePlayer', 'WooiceWaver', 'storage',
        function ($scope, $rootScope, $routeParams, $location, $anchorScroll, User, UserSocial, SoundSocial, PlayList, WooicePlayer, WooiceWaver, storage) {

            window.onbeforeunload = function (event) {
                // when user leave the page, record the current status of the sound.
                for (var soundIndex in PlayList.list()) {
                    var oneSound = WooicePlayer.getSoundFromPlayer(PlayList.list()[soundIndex].id);

                    if (oneSound && oneSound.position != null) {
                        var playing = false;
                        var curSound = WooicePlayer.getCurSound();
                        if (curSound && curSound.id == oneSound.id) {
                            playing = curSound.isPlaying;
                        }
                        storage.set(oneSound.id + "_player", {
                            id: oneSound.id,
                            from: oneSound.position,
                            playing: playing
                        });
                    }
                }

                //record wave status
                WooiceWaver.recordWaveStatus();
            }

            $scope.scrollTo = function(id){
                $location.hash("temp");
                $anchorScroll();
                $location.hash(id);
                $anchorScroll();
            }

            $scope.addToCurList = function(sound){
                WooicePlayer.addSound(sound);
            }

            $scope.findBootstrapEnvironment = function() {
                var envs = ['xs', 'sm', 'md', 'lg'];

                var el = $('<div>');
                el.appendTo($('body'));

                for (var i = envs.length - 1; i >= 0; i--) {
                    var env = envs[i];

                    el.addClass('hidden-'+env);
                    if (el.is(':hidden')) {
                        el.remove();
                        return env
                    }
                };
            }
            $rootScope.deviceEnv = $scope.findBootstrapEnvironment();

            $rootScope.formatTime = function(duration) {
                if (!duration)
                {
                    return '';
                }
                var minutes = Math.floor(duration/60);
                var seconds = Math.floor(duration%60);

                return ((minutes>=10)?minutes: ('0'+minutes)) + ":" + ((seconds>=10)?seconds: ('0'+seconds));
            }

            $rootScope.follow = function (user) {
                if (!user) {
                    return;
                }
                if (user.userPrefer && user.userPrefer.following) {
                    UserSocial.unfollow({toUserAlias: user.profile.alias}, null, function (followedCount) {
                        user.userPrefer.following = false;
                        user.userSocial.followed = followedCount.followed;
                    });
                }
                else {
                    UserSocial.follow({ toUserAlias: user.profile.alias}, null, function (followedCount) {
                        if (user.userPrefer) {
                            user.userPrefer.following = true;
                            user.userSocial.followed = followedCount.followed;
                        }
                    });
                }
            };

            $scope.like = function (sound) {
                if (!sound) {
                    return;
                }
                sound.isLiking = true;
                if (sound.soundUserPrefer && sound.soundUserPrefer.like) {
                    SoundSocial.unlike({ sound: sound.id}, null, function (likesCount) {
                        sound.soundUserPrefer.like = false;
                        sound.soundSocial.likesCount = likesCount.liked;
                        sound.isLiking = false;
                    }, function(){
                        sound.isLiking = false;
                    });
                }
                else {
                    SoundSocial.like({sound: sound.id}, null, function (likesCount) {
                        sound.soundUserPrefer.like = true;
                        sound.soundSocial.likesCount = likesCount.liked;
                        sound.isLiking = false;
                    }, function(){
                        sound.isLiking = false;
                    });
                }
            };

            $scope.repost = function (sound) {
                if (!sound) {
                    return;
                }
                sound.isReposting = true;
                if (sound.soundUserPrefer && sound.soundUserPrefer.repost) {
                    SoundSocial.unrepost({sound: sound.id}, null, function (repostsCount) {
                        sound.soundUserPrefer.repost = false;
                        sound.soundSocial.reportsCount = repostsCount.reposted;
                        sound.isReposting = false;
                    }, function(){
                        sound.isReposting = false;
                    });
                }
                else {
                    SoundSocial.repost({sound: sound.id}, null, function (repostsCount) {
                        sound.soundUserPrefer.repost = true;
                        sound.soundSocial.reportsCount = repostsCount.reposted;
                        sound.isReposting = false;
                    }, function(){
                        sound.isReposting = false;
                    });
                }
            };

            function toTopBar(toTopEle, mainBody) {
                this.backToTop = toTopEle;
                this.mainBody = mainBody;
                this.load = function () {
                    this.backToTop.fadeOut();
                    $(window).bind('scroll', $.proxy(function (event) {
                        $(window).scrollTop() > 300 ? this.backToTop.show() : this.backToTop.hide();
                    }, this));
                    this.backToTop.bind('click', function (event) {
                        if (event) {
                            event.preventDefault();
                        }
                        $("html, body").animate({scrollTop: 0}, 1000);
                    });
                }
            }

            $scope.getWindowHeightCss = function(){
                return {height: $(window).height()};
            }

            $scope.getWindowWidthCss = function(){
                return {width: $(window).width()};
            }

            $scope.showQrCode = function(title, input) {
                $('#qrcodeTitle').text(title);
                jQuery('#qrcodeCanvas').empty();
                jQuery('#qrcodeCanvas').qrcode({
                    text	: utf16to8(input)
                });

                $('#qrcode_modal').modal();
            }

            new toTopBar($('#back_top'), $(document)).load();
        }]);