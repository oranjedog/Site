'use strict';

/* Controllers */

angular.module('stream.controllers', []).
    controller('streamCtrl', ['$scope', 'config', '$location', '$timeout', 'Stream', 'Sound', 'PlayList', 'CurSoundList', 'SoundUtilService', 'SoundSocial', '$routeParams', 'UserService', 'WooicePlayer', 'WooiceWaver', 'storage', 'WaveStorage',
        function ($scope, config, $location, $timeout, Stream, Sound, PlayList, CurSoundList, SoundUtilService, SoundSocial, $routeParams, UserService, WooicePlayer, WooiceWaver, storage, WaveStorage) {
            $scope.config = config;
            $scope.userService = UserService;
            $scope.routeParams = $routeParams;
            $scope.wooicePlayer = WooicePlayer;
            $scope.curSoundList = CurSoundList;

            function checkNewSound() {
                var count = Sound.hasNew({startTime: $scope.lastLoadedTime}, function () {
                    $scope.newSoundCount = parseInt(count[0]);
                });
            }

            function checkNewCreated() {
                var count = Sound.hasNewCreated({userAlias: $routeParams.value, startTime: $scope.lastLoadedTime}, function () {
                    $scope.newSoundCount = parseInt(count[0]);
                });
            }

            $scope.togglePause = function (id) {
                var sound = null;
                $.each(CurSoundList.getList(), function (index, oneSound) {
                    if (oneSound.id == id) {
                        sound = oneSound;
                        return;
                    }
                });

                WooicePlayer.toggle(sound);
            };

            $scope.download = function () {
                var sound = SoundSocial.play({sound: this.sound.id}, null, $.proxy(function (count) {
                    var downloadUrl = sound.url + "&download/" + this.sound.alias + ".mp3";

                    var downloadFrame = document.createElement("iframe");
                    downloadFrame.src = downloadUrl;
                    downloadFrame.style.display = "none";
                    document.body.appendChild(downloadFrame);
                }, this));
            }

            var rewriteF5 = function (e) {
                if (e.which === 116) {
                    $scope.loadStream(true);
                    return false;
                }
                if (e.which === 82 && e.ctrlKey) {
                    $scope.loadStream(true);
                    return false;
                }
            };

            $scope.comment = function (sound) {
                if (UserService.validateRoleGuest()) {
                    $('#sound_commentbox_input_' + sound.id).val('');
                    $('#sound_commentbox_input_' + sound.id).attr("placeholder", "对不起，请登陆后留言。。");
                    return;
                }

                var postData = {};
                postData.comment = $('#sound_commentbox_input_' + sound.id).val();
                postData.pointAt = $('#sound_comment_point_' + sound.id).val();

                var result = SoundSocial.comment({sound: sound.id}, postData, function (count) {
                    sound.soundSocial.commentsCount = result.commentsCount;
                    $('#sound_commentbox_input_' + sound.id).val('');
                    $('#sound_commentbox_input_' + sound.id).attr("placeholder", "感谢您的留言!");
                    $('#sound_comment_point_' + sound.id).val(-1);
                }, function (error) {
                    if (error.data == 'INVALID_COMMENT') {
                        $('#sound_commentbox_input_' + sound.id).val('');
                        $('#sound_commentbox_input_' + sound.id).attr("placeholder", "对不起，您的评论含有敏感词，请慎重输入");
                    }
                    else {
                        $('#sound_commentbox_input_' + sound.id).val('');
                        $('#sound_commentbox_input_' + sound.id).attr("placeholder", "对不起，您的评论输入失败，请稍后再试");
                    }
                });
            }

            $scope.delete = function () {
                if (this.sound.owner.alias != UserService.getCurUserAlias()
                    && !UserService.validateRoleAdmin()) {
                    return;
                }

                if (confirm('确定要删除当前音乐吗?')) {
                    Sound.delete({sound: this.sound.id}, $.proxy(function () {
                        WooicePlayer.destroy({
                            id: this.sound.id
                        });

                        storage.remove(this.sound.id + "_wave");

                        var toDelete = 0;
                        $.each(CurSoundList.getList(), $.proxy(function (index, oneSound) {
                            if (this.sound.id == oneSound.id) {
                                toDelete = index;
                                return;
                            }
                        }, this));
                        CurSoundList.getList().splice(toDelete, 1);
                        $scope.$apply();

                        storage.remove(this.sound.id + "_player", null);
                        storage.remove(this.sound.id + "_wave", null);

                        $.globalMessenger().post({
                            message: "声音" + this.sound.alias + "删除成功。",
                            hideAfter: 15,
                            showCloseButton: true
                        });
                    }, this));
                }
            }

            // Once the sound comes into viewport, load wave; Once it goes out, release it.
            $scope.toggleWaveData = function (index, inview, inviewpart) {
                var oneSound = CurSoundList.getList()[index];
                if (inview)
                {
                    if (!oneSound.inview)
                    {
                        oneSound.inview = true;
                        $scope.loadWave(oneSound);
                    }
                }
                else
                {
                    oneSound.inview = false;
                    $scope.releaseWave(oneSound);
                }
            }

            $scope.loadStream = function (force) {
                if ($scope.isloading) {
                    return;
                }
                if (force) {
                    $scope.pageNum = 1;
                    CurSoundList.reset();
                }
                $scope.isloading = true;

                var postData = {};
                if ($scope.$parent.curatedTags) {
                    postData = [];
                    $routeParams.filter = "tags";

                    $.each($scope.$parent.curatedTags, function (index, tag) {
                        if (tag.interested) {
                            postData.push(tag.label);
                        }
                    });
                }

                var soundsData = Stream.stream({filter: $routeParams.filter, value: $routeParams.value, pageNum: $scope.pageNum}, postData, function () {
                    $.each(soundsData, function (index, soundRecord) {
                        if (!soundRecord) {
                            return;
                        }
                        var hasSound = false;
                        $.each(CurSoundList.getList(), function (index, oneSound) {
                            if (oneSound.id === soundRecord.id) {
                                hasSound = true;
                            }
                        });

                        if (hasSound) {
                            return;
                        }

                        var sound = PlayList.getSound(soundRecord.id);
                        if (null == sound) {
                            sound = SoundUtilService.buildSound(soundRecord);
                        }

                        CurSoundList.getList().push(sound);
                    });

                    $timeout(function () {
                        $('.hasTooltip').each(function () {
                            $(this).qtip({
                                content: {
                                    text: $(this).next('div')
                                },
                                show: {
                                    event: 'click'
                                },
                                hide: {
                                    event: 'unfocus'
                                },
                                position: {
                                    at: 'bottom left',
                                    target: $(this)
                                },
                                style: {
                                    def: false,
                                    classes: 'tip qtip-rounded qtip-bootstrap'
                                }
                            });
                        });
                    }, 0);

//                    $.each(CurSoundList.getList(), function (index, oneSound) {
//                        var soundPlayStatus = storage.get(oneSound.id + "_player");
//                        if (soundPlayStatus && soundPlayStatus.playing && PlayList.getSound(oneSound.id)) {
//                            WooicePlayer.play(oneSound);
//                        }
//                    });

                    if (CurSoundList.getList().length >= config.soundsPerPage) {
                        $scope.pageNum++;
                    }

                    $scope.isloading = false;
                    $scope.newSoundCount = 0;
                    $scope.lastLoadedTime = new Date().Format("yyyy-MM-dd hh:mm:ss");
                });
            };

            $scope.loadWave = function (sound) {
                WaveStorage.get({remoteId: sound.remoteId + ".png"}, function (waveData) {
                    WooiceWaver.render(
                        {
                            id: sound.id,
                            waveData: waveData.waveData[0],
                            duration: sound.duration * 1000,
                            color: UserService.getColor(),
                            commentable: sound.comment.mode !== 'closed'
                        }
                    );

                    delete waveData.waveData;
                });
            }

            $scope.releaseWave = function(sound) {
                WooiceWaver.release({id: sound.id});
            }

//            if (!UserService.validateRoleGuest()) {
//                var soundsReLoad = null;
//                if ($routeParams.value) {
//                    soundsReLoad = setInterval(checkNewCreated, 60 * 1000);
//                }
//                else {
//                    if (!$routeParams.q && !$routeParams.tag) {
//                        soundsReLoad = setInterval(checkNewSound, 60 * 1000);
//                    }
//                }
//                $scope.$on('$destroy', function (e) {
//                    if (soundsReLoad) {
//                        clearInterval(soundsReLoad);
//                    }
//                });
//            }

            $scope.$watch('curatedTags.change', function (newValue, oldValue) {
                //If interestedTags are changed, reload stream
                $scope.loadStream(true);
            });

            $(document).bind('keydown keyup', rewriteF5);
            $scope.$on('$destroy', function (e) {
                $(document).unbind('keydown keyup', rewriteF5);
                CurSoundList.reset();
            });

            $scope.pageNum = 1;
            CurSoundList.reset();
            $scope.isloading = false;
            $scope.newSoundCount = 0;
            $scope.lastLoadedTime = new Date().Format("yyyy-MM-dd hh:mm:ss");
            $scope.userCurPage = $routeParams.value;
            if ($scope.userCurPage) {
                document.title = "WOWOICE - " + $scope.userCurPage;
            }

            $scope.loadStream();
        }])
;

