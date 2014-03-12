'use strict';

angular.module('upload.controllers', [
        'wooice.config'
    ])
    .controller('soundUploadCtrl', [
        '$scope', '$http', 'Sound', 'Tag', 'User', 'config', 'Storage', 'UserService',
        function ($scope, $http, Sound, Tag, User, config, Storage, UserService) {
            $scope.commentModes = [
                {name: '所有人可见', id: 'public'},
                {name: '自己可见', id: 'private'},
                {name: '关闭评论', id: 'closed'}
            ];

            $scope.defaultSound = {};
            reset();

            $scope.uploadUrl = "http://up.qiniu.com";
            $scope.defaultSound.minutesToUpload = 120;
            $scope.defaultSound.secondsToUpload = 0;

            $scope.removeTag = function (label) {
                $scope.defaultSound.tags = jQuery.grep($scope.defaultSound.tags, function (value) {
                    return value != label;
                });
                $("#tag_" + label).remove();

                if ($scope.defaultSound.tags.length == 0) {
                    $('#profile_error').removeClass("hide");
                    $("#tags").attr("placeholder", "请打一个标签");
                }
            }

            $scope.showLinkPanel = function(){
                $("#link_panel").modal({
                    keyboard: false
                });
            }

            $scope.showTags = function() {
                $("#tags_modal").modal({
                    keyboard: false,
                    backdrop: 'static'
                });
            }

            $scope.syncToWowoice = function(){
                if (!$scope.defaultSound.soundLink)
                {
                    return;
                }

                $("#link_panel").modal('hide');

                //Disable upload panel
                $('.upload_button').fileupload(
                    'option',
                    'dropZone',
                    null
                );

                //生成文件唯一标示
                if (!$scope.defaultSound.fileName) {
                    $scope.defaultSound.fileName = new Date().getTime() + "_" + UserService.getCurUserAlias();
                }
                $scope.defaultSound.name = UserService.getCurUserAlias()+"_"+new Date().getTime();

                $scope.defaultSound.uploadType = "sync";
                $scope.defaultSound.isSoundUploading = true;
                $scope.inUpload = true;

                Storage.syncSound({}, {
                    "from": $scope.defaultSound.soundLink,
                    "to": $scope.defaultSound.fileName
                }, function(){
                    $scope.postUpload();
                },function(){
                    $scope.inUpload = false;
                    $scope.defaultSound.isSoundUploading = false;
                    $scope.defaultSound.uploadMsgClass = "text-warning";
                    $scope.defaultSound.uploadMsg = "同步失败，请确认您输入的URL可正常访问，并再次尝试";
                });
            }

            $scope.discard = function()
            {
                if (confirm('确定要放弃本次上传吗?')) {
                    if ($scope.cancelUpload)
                    {
                        $scope.cancelUpload();
                    }

                    Sound.discard({remoteId: $scope.defaultSound.fileName}, function(){
                        $scope.defaultSound.uploadMsg = null;
                        reset();
                    }, function(){
                        $scope.defaultSound.uploadMsgClass = "text-error";
                        $scope.defaultSound.uploadMsg = "放弃上传失败，请售后再试";
                    });
                }
            }

            $scope.postUpload = function(){
                var postData = {};
                postData.fileName = $scope.defaultSound.fileName;
                postData.originName = $scope.defaultSound.name;
                postData.type = $scope.defaultSound.uploadType;

                Storage.upload({}, postData, function () {
                    $scope.defaultSound.uploadStatus = 'progress-bar-success';
                    $scope.defaultSound.uploadMsgClass = "text-success";
                    $scope.defaultSound.uploadMsg = '上传完成，请填写并保存声音信息。 ';

                    $scope.defaultSound.dataSaved = true;

                    if ($scope.defaultSound.profileSaved) {
                        $.globalMessenger().post({
                            message: "您的声音" + $scope.defaultSound.name + "上传成功。我们将尽快处理您上传的声音，这可能需要几分钟，请耐心等待。",
                            hideAfter: 15,
                            showCloseButton: true
                        });

                        $scope.inUpload = false;
                        reset();
                    }

                    $scope.defaultSound.isSoundUploading = false;
                });
            }

            $scope.save = function () {
                if ($scope.defaultSound.name) {
                    $scope.defaultSound.profileError = '';

                    if ($scope.defaultSound.alias) {
                        var soundProfile = {};
                        soundProfile.name = $scope.defaultSound.name;
                        soundProfile.description = $scope.defaultSound.description;
                        soundProfile.status = $scope.defaultSound.status;
                        soundProfile.commentMode = $scope.defaultSound.commentMode.id;
                        soundProfile.recordType = $scope.defaultSound.recordType;
                        soundProfile.soundRight = $scope.defaultSound.soundRight;
                        soundProfile.downloadable = $scope.defaultSound.downloadable;

                        if ($scope.defaultSound.posterId) {
                            soundProfile.poster = {};
                            soundProfile.poster.posterId = $scope.defaultSound.posterId;
                        }
                        var sound = Sound.update({sound: $scope.defaultSound.id}, soundProfile, function (count) {
                            $scope.defaultSound.profileMsgClass = "text-success";
                            $scope.defaultSound.profileMsg = "声音信息保存成功";
                            $scope.defaultSound.id = sound.id;
                            $scope.defaultSound.alias = sound.alias;
                            Tag.attach({action: sound.id}, {tags: $scope.defaultSound.tags}, function (count) {
                                $scope.defaultSound.profileSaved = true;
                                if ($scope.defaultSound.dataSaved) {
                                    $scope.defaultSound.profileMsg = "";
                                    $.globalMessenger().post({
                                        message: "您的声音" + $scope.defaultSound.name + "上传成功。我们将尽快处理您上传的声音，这可能需要几分钟，请耐心等待。",
                                        hideAfter: 15,
                                        showCloseButton: true
                                    });

                                    $scope.inUpload = false;
                                    reset();
                                }
                            });

                        }, function () {
                            $scope.defaultSound.profileMsgClass = "text-error";
                            $scope.defaultSound.profileMsg = "声音信息保存失败";
                        });
                    }
                    else {
                        var soundProfile = {};
                        soundProfile.name = $scope.defaultSound.name;
                        soundProfile.description = $scope.defaultSound.description;
                        soundProfile.status = $scope.defaultSound.status;
                        soundProfile.remoteId = $scope.defaultSound.fileName;
                        soundProfile.commentMode = $scope.defaultSound.commentMode.id;
                        soundProfile.recordType = $scope.defaultSound.recordType;
                        soundProfile.soundRight = $scope.defaultSound.soundRight;
                        soundProfile.downloadable = $scope.defaultSound.downloadable;
                        soundProfile.uploadType = $scope.defaultSound.uploadType;

                        if ($scope.defaultSound.posterId) {
                            soundProfile.poster = {};
                            soundProfile.poster.posterId = $scope.defaultSound.posterId;
                        }

                        var sound = Sound.save({sound: $scope.defaultSound.name}, soundProfile, function (count) {
                            $scope.defaultSound.profileMsgClass = "text-success";
                            $scope.defaultSound.profileMsg = "声音信息保存成功";
                            $scope.defaultSound.id = sound.id;
                            $scope.defaultSound.alias = sound.alias;
                            Tag.attach({action: sound.id}, {tags: $scope.defaultSound.tags}, function (count) {
                                $scope.defaultSound.profileSaved = true;
                                if ($scope.defaultSound.dataSaved) {
                                    $.globalMessenger().post({
                                        message: "您的声音" + $scope.defaultSound.name + "上传成功。我们将尽快处理您上传的声音，这可能需要几分钟，请耐心等待。",
                                        hideAfter: 15,
                                        showCloseButton: true
                                    });

                                    $scope.defaultSound.uploadMsg = "";
                                    $scope.inUpload = false;
                                    reset();
                                }
                            });

                        }, function () {
                            $scope.defaultSound.profileMsgClass = "text-warning";
                            $scope.defaultSound.profileMsg = "声音信息保存失败";
                        });
                    }
                }
                else {
                    $scope.defaultSound.profileMsgClass = "text-warning";
                    $scope.defaultSound.profileMsg = "请填写声音名称并打至少一个tag"
                }
            }

            $scope.shouldCheckCapacity = function () {
                return UserService.validateRoleUser() || UserService.validateRolePro();
            }

            $scope.$on('$viewContentLoaded', function () {
                var user = User.get({userAlias: UserService.getCurUserAlias()}, function () {
                    $scope.defaultSound.minutesToUpload = Math.floor(UserService.getTimeCapacity() - user.userSocial.soundDuration / 60);
                    $scope.defaultSound.secondsToUpload = (user.userSocial.soundDuration == 0) ? 0 : (60 - user.userSocial.soundDuration % 60);
                });
                var soundToUpload = Sound.getSoundToUpload(
                    {sound: 'toupload'}, function () {
                        if (soundToUpload.profile && soundToUpload.profile.alias) {
                            $scope.defaultSound.id = soundToUpload.id;
                            $scope.defaultSound.name = soundToUpload.profile.name;
                            $scope.defaultSound.fileName = soundToUpload.profile.remoteId;
                            $scope.defaultSound.alias = soundToUpload.profile.alias;
                            $scope.defaultSound.description = soundToUpload.profile.description;
                            $scope.defaultSound.status = soundToUpload.profile.status;
                            $scope.defaultSound.uploadType = soundToUpload.profile.uploadType;

                            if (soundToUpload.profile.poster && soundToUpload.profile.poster.url) {
                                $scope.defaultSound.posterUrl = soundToUpload.profile.poster.url;
                            }
                            var tagList = [];
                            $.each(soundToUpload.tags, function (index, oneTag) {
                                tagList.push(oneTag.label);
                            });
                            $scope.defaultSound.uploadStatus = "hide";
                            $scope.defaultSound.tags = tagList;
                            $scope.defaultSound.profileSaved = true;
                            $scope.defaultSound.uploadMsgClass = "text-warning";
                            $scope.defaultSound.uploadMsg = "您有未完成的声音分享，请完成声音" + $scope.defaultSound.name + "的音频上传。";

                            $scope.inUpload = true;
                        } else {
                            if (soundToUpload.profile && !soundToUpload.profile.alias) {
                                $scope.defaultSound.uploadStatus = "hide";
                                var names = soundToUpload.profile.name.split(".");
                                $scope.defaultSound.name = names[0];
                                $scope.defaultSound.fileName = soundToUpload.profile.remoteId;
                                $scope.defaultSound.uploadType = soundToUpload.profile.uploadType;
                                $scope.defaultSound.dataSaved = true;
                                $scope.defaultSound.uploadMsgClass = "text-warning";
                                $scope.defaultSound.uploadMsg = "您有未完成的声音分享，请完善" + $scope.defaultSound.name + "的声音信息。";

                                $scope.inUpload = true;
                            }
                            else {
                                $scope.inUpload = false;
                            }
                        }
                    }
                );
            });

            $('#poster_upload').change(function () {
                var oFReader = new FileReader();
                oFReader.onload = function (oFREvent) {
                    $("#poster_img").attr('src', oFREvent.target.result);
                };
                oFReader.readAsDataURL(this.files[0]);
            });

            $scope.$on('$locationChangeStart', function (event, next, current) {
                if ($scope.defaultSound.isSoundUploading || $scope.defaultSound.uplodingPoster) {
                    if (confirm("你的声音正在上传，离开当然页面将放弃本次上传，确定离开吗？"))
                    {
                        if ($scope.cancelUpload)
                        {
                            $scope.cancelUpload();
                        }
                    }
                    else
                    {
                        event.preventDefault();
                    }

                }
            });

            window.onbeforeunload = function (event) {
                if ($scope.defaultSound.isSoundUploading || $scope.defaultSound.uplodingPoster) {
                    var message = '你的声音正在上传，离开当然页面将放弃本次上传，确定离开吗？';

                    if (typeof event == 'undefined') {
                        event = window.event;
                    }
                    if (event) {
                        event.returnValue = message;
                    }
                    return message;
                }
            }

            $scope.jqXHR = $('.upload_button').fileupload({
                url: $scope.uploadUrl,
                dataType: 'json',

                add: function (e, data) {

                    $('.upload_button').fileupload(
                        'option',
                        'dropZone',
                        null
                    );

                    if (!(/\.(mp3|wma|flac|ogg)$/i).test(data.files[0].name)) {
                        $scope.$apply(function () {
                            $scope.defaultSound.uploadMsgClass = "text-warning";
                            $scope.defaultSound.uploadMsg = '对不起,您上传的文件格式不被本站接受，请上传以下音频文件中的一种：mp3,wma,flac,ogg';
                        });
                        return;
                    }
                    if (data.files[0].size > 100 * 1000 * 1000) {
                        $scope.$apply(function () {
                            $scope.defaultSound.uploadMsgClass = "text-warning";
                            $scope.defaultSound.uploadMsg = '对不起,您上传的文件过大，请上传小于100MB的音频文件';
                        });
                        return;
                    }
                    $scope.inUpload = true;
                    $scope.defaultSound.uploadStatus = '';

                    var soundName = data.files[0].name;
                    var names = soundName.split(".");
                    if (!$scope.defaultSound.name) {
                        $scope.defaultSound.name = names[0];
                    }

                    //生成文件唯一标示
                    if (!$scope.defaultSound.fileName) {
                        $scope.defaultSound.fileName = new Date().getTime() + "_" + UserService.getCurUserAlias();
                    }

                    $scope.urlInfo = Storage.getSoundUploadURL({key: $scope.defaultSound.fileName}, function () {
                        data.formData = {key: $scope.defaultSound.fileName, token: $scope.urlInfo.token};
                        data.submit();
                    });
                },
                submit: function (e, data) {
                    $scope.defaultSound.isSoundUploading = true;

                    $scope.cancelUpload = function()
                    {
                        if (data)
                        {
                            data.abort();
                        }
                        $scope.$apply(function () {
                            $scope.defaultSound.isSoundUploading = false;
                        });
                    }
                },
                progress: function (e, data) {
                    $scope.defaultSound.uploadStatus = "progress-bar-info";
                    var progress = parseInt(data.loaded / data.total * 100, 10);
                    $('#progress .progress-bar').css(
                        'width',
                        progress + '%'
                    );
                    $scope.$apply(function () {
                        $scope.defaultSound.uploadMsgClass = "text-info";
                        if (progress < 100) {
                            $scope.defaultSound.uploadMsg = '已上传' + progress + '%';
                        } else {
                            $scope.defaultSound.uploadStatus = 'progress-striped active';
                            $scope.defaultSound.uploadMsg = '音频文件处理中，请稍后'
                        }
                    });
                },
                send: function (e, data) {
                    $scope.defaultSound.uploadMsgClass = "text-info";
                    $scope.defaultSound.uploadMsg = '已上传0%';
                },
                done: function (e, data) {
                    $('.upload_button').fileupload(
                        'option',
                        'dropZone',
                        $(document)
                    );

                    $('#progress .progress-bar').addClass('progress-bar-success');

                    $scope.postUpload();
                },
                fail: function (e, data) {
                    $scope.defaultSound.isSoundUploading = false;
                    if (data.errorThrown === 'abort') {
                        $scope.defaultSound.uploadMsgClass = "text-success";
                        $scope.defaultSound.uploadMsg = '声音上传已取消。';
                        $scope.defaultSound.uploadStatus = "hide";
                    }
                    else {
                        $scope.defaultSound.uploadMsgClass = "text-warning";
                        $scope.defaultSound.uploadMsg = '上传失败，请稍后再试。';
                    }
                }
            });

            $scope.imgJqXHR = $('#poster_upload').fileupload({
                url: $scope.uploadUrl,
                dataType: 'json',
                acceptFileTypes: /\.(gif|jpg|jpeg|tiff|png)$/i,
                dropZone: null,

                add: function (e, data) {
                    if (!(/\.(gif|jpg|jpeg|tiff|png)$/i).test(data.files[0].name)) {
                        $scope.$apply(function () {
                            $scope.defaultSound.imgUploadMsgClass = "text-warning";
                            $scope.defaultSound.imgUploadMsg = '您上传的海报图片可能不正确，请上传以下格式中的一种:gif, jpg, jpeg, tiff, png。';
                        });
                        return;
                    }
                    if (data.files[0].size > 5 * 1000 * 1000) {
                        $scope.$apply(function () {
                            $scope.defaultSound.imgUploadMsgClass = "text-warning";
                            $scope.defaultSound.imgUploadMsg = '您上传的文件过大，请上传小于5MB的海报图片。';
                        });
                        return;
                    }
                    if (!$scope.defaultSound.fileName) {
                        $scope.defaultSound.fileName = new Date().getTime() + "_" + UserService.getCurUserAlias();
                    }
                    $scope.posterInfo = Storage.getImageUploadURL({key: $scope.defaultSound.fileName}, function () {
                        data.formData = {key: $scope.defaultSound.fileName, token: $scope.posterInfo.token};
                        data.submit();
                    });
                },
                submit: function (e, data) {
                    $scope.defaultSound.uplodingPoster = true;
                    $('#cancel_img_upload').click(function () {
                        data.abort();
                        $scope.$apply(function () {
                            $scope.defaultSound.uplodingPoster = false;
                        });

                        return false;
                    });
                },
                progress: function (e, data) {
                    var progress = parseInt(data.loaded / data.total * 100, 10);
                    $scope.$apply(function () {
                        $scope.defaultSound.imgUploadMsg = '已上传' + progress + '%';
                    });
                },
                send: function (e, data) {
                    $scope.defaultSound.imgUploadMsgClass = "text-info";
                    $scope.defaultSound.imgUploadMsg = '已上传0%';
                },
                done: function (e, data) {
                    $scope.$apply(function () {
                        $scope.defaultSound.imgUploadMsgClass = "text-success";
                        $scope.defaultSound.imgUploadMsg = '声音海报上传成功';
                        $scope.defaultSound.uplodingPoster = false;
                    });

                    $scope.defaultSound.posterId = $scope.defaultSound.fileName;
                },
                fail: function (e, data) {
                    $scope.defaultSound.uplodingPoster = false;
                    if (data.errorThrown === 'abort') {
                        $scope.defaultSound.imgUploadMsgClass = "text-success";
                        $scope.defaultSound.imgUploadMsg = '海报上传已取消。';
                    }
                    else {
                        $scope.defaultSound.imgUploadMsgClass = "text-warning";
                        $scope.defaultSound.imgUploadMsg = '海报图片上传失败，请稍后再试。';
                    }
                }
            });

            function reset() {
                $scope.defaultSound.uploadType = "local";
                $scope.defaultSound.soundRight = {};
                $scope.defaultSound.name = null;
                $scope.defaultSound.fileName = null;
                $scope.defaultSound.alias = null;
                $scope.defaultSound.description = null;
                $scope.defaultSound.status = "public";
                $scope.defaultSound.tags = [];
                $scope.defaultSound.profileSaved = false;
                $scope.defaultSound.dataSaved = false;
                $scope.defaultSound.downloadable = false;
                $scope.defaultSound.recordType = 'resing';
                $scope.defaultSound.posterUrl = "img/voice.jpg";

                $scope.defaultSound.profileMsgClass = "";
                $scope.defaultSound.profileMsg = "";

                $scope.defaultSound.isSoundUploading = false;
                $scope.defaultSound.uploadMsgClass = "";
                $scope.defaultSound.uploadMsg = '';

                $scope.defaultSound.uplodingPoster = false;
                $scope.defaultSound.imgUploadMsgClass = "";
                $scope.defaultSound.imgUploadMsg = '';

                $scope.defaultSound.commentMode = $scope.commentModes[0];

                $scope.inUpload = false;
            }
        }
    ])
