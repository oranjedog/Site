'use strict';

angular.module('header.controllers', [])
    .controller('headerCtrl', ['$scope', '$rootScope', '$location', '$routeParams', '$timeout', 'User', 'CurSoundList', 'UserService', 'PlayList', 'WooicePlayer','Feedback','storage',
    function ($scope, $rootScope, $location, $routeParams, $timeout, User,CurSoundList, UserService, PlayList, WooicePlayer, Feedback, storage) {
        $scope.q = $routeParams.q;
        $scope.userAlias = UserService.getCurUserAlias();
        $scope.userAvatar = UserService.getAvatar();
        $scope.unreadMsgs =  UserService.getUnreadMsgs();
        $scope.playMode = UserService.getPlayMode();
        $scope.playModes = ['顺序播放', '单曲循环', '随机播放', '播完即止'];
        $scope.wooicePlayer =  WooicePlayer;
        $scope.playList = PlayList;
        $scope.userService = UserService;
        $scope.showVolumePanel = false;
        $scope.volume = UserService.getVolume();

        $scope.$watch('volume', function(newValue, oldValue){
            var curSound = WooicePlayer.getCurSound();
            curSound.volume = 100 - newValue;
            WooicePlayer.setVolume(curSound, newValue);
            UserService.setVolume(newValue);
        });

        function postLogout(){
            UserService.setupUser(null);

            $.removeCookie('curSound');
            storage.remove("token");
            storage.remove("rememberUser");
            storage.remove("userId");

            $.globalMessenger().post({
                message: "感谢您的使用",
                hideAfter: 5,
                showCloseButton: true
            });
            $location.path('/interest');
        }

        $scope.logout = function () {
            var type = UserService.getLoginType();

             switch(type)
             {
                 case 'wowoice':
                     User.logout({}, function () {
                         postLogout();
                     })
                     break;
                 case 'sina':
                     if (WB2.checkLogin())
                     {
                         WB2.logout(function(){
                             postLogout();
                         });
                     }
                     else
                     {
                         postLogout();
                     }
                 case 'qq':
                     if (QC.Login.check())
                     {
                         QC.Login.logout();
                     }
                     postLogout();
                     break;
             }
        };

        $scope.showLoginForm = function() {
            $('#login_modal').modal({
                backdrop: false
            });
        }

        $scope.feedback = {};
        $scope.feedback.function = null;
        $scope.feedback_content = null;
        $scope.sendFeedback = function (){
            $scope.feedback.content = $scope.feedback_content;
            Feedback.create({}, $scope.feedback, function(){
                $('#feedback').modal('hide');
                $.globalMessenger().post({
                    message: "感谢您的反馈！",
                    hideAfter: 10,
                    showCloseButton: true
                });
            });
        }

        $scope.goto = function (uri) {
            $location.url(uri);
        }

        $scope.togglePause = function () {
            WooicePlayer.toggle({});
        };

        $scope.togglePauseList = function (id) {
            WooicePlayer.toggleInPlaylist(id);
        };

        $scope.playPre = function () {
            WooicePlayer.playSibling('pre');
        };

        $scope.playNext = function () {
            WooicePlayer.playSibling('next');
        };

        $scope.changePlayStyle = function() {
            $scope.playMode = ++$scope.playMode %  $scope.playModes.length;
            UserService.setPlayMode($scope.playMode);
        }

        $scope.removeSoundFromPlaylist = function(sound) {
             WooicePlayer.destroy(sound);
        }

        $scope.clearPlaylist = function(sound) {
            WooicePlayer.clearCurPlayList();
        }

        $('#search_box').bind('keyup', function (event) {
            if (event.keyCode == 13) {
                $scope.$apply(function () {
                    $location.url('/stream/match/' + $scope.q);
                });
            }
        });

        $scope.togglePlaylist = function(){
            $('#playlist_content').slideToggle();
        }

        $('body').click(function(evt) {
            if(evt.target.id!='playlist_content' && $(evt.target).parents('#playlist_content').length==0
                && evt.target.id!='playlist_content' && $(evt.target).parents('.display_song').length==0
                && evt.target.id!='playlist_button' && $(evt.target).parents('#playlist_button').length==0) {
                $('#playlist_content').slideUp();
            }
        });
    }]);