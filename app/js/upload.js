/*
 * jQuery File Upload Plugin Angular JS Example 1.2.0
 * https://github.com/blueimp/jQuery-File-Upload
 *
 * Copyright 2013, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

/*jslint nomen: true, regexp: true */
/*global window, angular */


(function () {
    'use strict';

    angular.module('wooice.module.upload', [
            'wooice.config'
        ])
        .controller('soundUploadCtrl', [
            '$scope', 'Sound', 'Tag','User', 'config',
            function ($scope, Sound, Tag, User, config) {
                $scope.uploadUrl = config.service.url_noescp + '/storage/upload';
                $scope.uploadPosterUrl = config.service.url_noescp + '/storage/upload/poster';
                $scope.defaultSound = {};
                reset();

                $scope.jqXHR = $('.upload_button').fileupload({
                    url: $scope.uploadUrl,
                    dataType: 'json',
                    acceptFileTypes: /(\.|\/)(mp3|wav)$/i,

                    add: function (e, data) {
                        console.log('add');

                        if (!(/\.(mp3|wav|flac|ogg)$/i).test(data.files[0].name)) {
                            $scope.$apply(function () {
                                $scope.defaultSound.uploadMsgClass = "alert alert-error";
                                $scope.defaultSound.uploadMsg = '对不起,您上传的文件格式不被本站接受，请上传以下音频文件中的一种：mp3,wav,flac,ogg';
                            });
                            return;
                        }
                        if (data.files[0].size > 20000000) {
                            $scope.$apply(function () {
                                $scope.defaultSound.uploadMsgClass = "alert alert-error";
                                $scope.defaultSound.uploadMsg = '对不起,您上传的文件过大，请上传小于20MB的音频文件';
                            });
                            return;
                        }
                        $('#uploadpart').hide();
                        $('#progresspart').show();
                        $('#sound_info').show();

                        data.submit();
                    },
                    submit: function (e, data) {
                        var soundName = data.files[0].name;
                        var names = soundName.split(".");
                        if (!$scope.defaultSound.name) {
                            $scope.defaultSound.name = names[0];
                        }

                        if (!$scope.defaultSound.fileName) {
                            $scope.defaultSound.fileName = new Date().getTime() + "_robot." + names[1];
                        }

                        data.formData = {fileName: $scope.defaultSound.fileName};
                    },
                    progress: function (e, data) {
                        var progress = parseInt(data.loaded / data.total * 100, 10);
                        $('#progress .bar').css(
                            'width',
                            progress + '%'
                        );
                        $scope.$apply(function () {
                            $scope.defaultSound.uploadMsgClass = "alert alert-info";
                            if (progress < 100) {
                                $scope.defaultSound.uploadMsg = '已上传' + progress + '%';
                            } else {
                                $scope.defaultSound.uploadStatus = 'progress-striped active';
                                $scope.defaultSound.uploadMsg = '音频文件处理中，请稍后'
                            }
                        });
                    },
                    send: function (e, data) {
                        console.log('send');
                        $scope.$apply(function () {
                            $scope.defaultSound.uploadMsgClass = "alert alert-info";
                            $scope.defaultSound.uploadMsg = '已上传0%';
                        });
                    },
                    done: function (e, data) {
                        console.log('done');
                        $scope.$apply(function () {
                            $scope.defaultSound.uploadStatus = 'bar-success';
                            $scope.defaultSound.uploadMsgClass = "alert alert-success";
                            $scope.defaultSound.uploadMsg = '上传完成，请填写信息介绍这段声音。 我们将尽快处理您上传的声音，这可能需要几分钟，请耐心等待。';
                        });
                        $('#progress .bar').addClass('bar-success');
                        $scope.defaultSound.dataSaved = true;

                        if ($scope.defaultSound.profileSaved) {
                            $scope.defaultSound.uploadMsgClass = "alert alert-success";
                            $scope.defaultSound.uploadMsg = "您的声音" + $scope.defaultSound.name + "上传成功。我们将尽快处理您上传的声音，这可能需要几分钟，请耐心等待。";
                            $('#uploadpart').show();
                            $('#progresspart').hide();
                            $('#sound_info').hide();
                            reset();
                        }
                    },
                    fail: function (e, data) {
                        $scope.$apply(function () {
                            $scope.defaultSound.uploadMsgClass = "alert alert-error";
                            $scope.defaultSound.uploadMsg = '上传失败，请稍后再试。';
                        });
                    }
                });

                $('#poster_upload').fileupload({
                    url: $scope.uploadPosterUrl,
                    dataType: 'json',
                    acceptFileTypes: /\.(gif|jpg|jpeg|tiff|png)$/i,

                    add: function (e, data) {
                        console.log('add');
                        if (!(/\.(gif|jpg|jpeg|tiff|png)$/i).test(data.files[0].name)) {
                            $scope.$apply(function () {
                                $scope.defaultSound.uploadMsgClass = "alert alert-error";
                                $scope.defaultSound.uploadMsg = '您上传的海报图片可能不正确，请上传以下格式中的一种:gif, jpg, jpeg, tiff, png。';
                            });
                            return;
                        }
                        if (data.files[0].size > 10000000) {
                            $scope.$apply(function () {
                                $scope.defaultSound.profileMsgClass = "alert alert-error";
                                $scope.defaultSound.profileMsg = '您上传的文件过大，请上传小于10MB的海报图片。';
                            });
                            return;
                        }
                        data.submit();
                    },
                    submit: function (e, data) {
                        var posterName = data.files[0].name;
                        var posterNames = posterName.split(".");

                        var fileNames =  $scope.defaultSound.fileName.split(".");
                        $scope.defaultSound.posterFileName = fileNames[0] + '.' + posterNames[1];
                        data.formData = {fileName:  $scope.defaultSound.posterFileName, length: data.files[0].size};
                        $scope.defaultSound.uplodingPoster = true;
                        $("#save_button").addClass("disabled");
                    },
                    progress: function (e, data) {
                    },
                    send: function (e, data) {
                    },
                    done: function (e, data) {
                        console.log('done');
                        $scope.$apply(function () {
                            $scope.defaultSound.profileMsgClass = "alert alert-success";
                            $scope.defaultSound.profileMsg = '声音海报上传成功';
                        });

                        $scope.defaultSound.uplodingPoster = false;
                        if ($scope.defaultSound.name && $scope.defaultSound.tags)
                        {
                            $("#save_button").removeClass("disabled");
                        }
                    },
                    fail: function (e, data) {
                        $scope.$apply(function () {
                            $scope.defaultSound.profileMsgClass = "alert alert-error";
                            $scope.defaultSound.profileMsg = '海报图片上传失败，请稍后再试。';
                        });
                    }
                });


                $scope.cancelUpload = function () {
                    if ($scope.jqXHR) {
                        $scope.jqXHR.abort();
                    }
                }

                $scope.removeTag = function (label) {
                    $scope.defaultSound.tags = jQuery.grep($scope.defaultSound.tags, function (value) {
                        return value != label;
                    });
                    $("#tag_" + label).remove();

                    if ($scope.defaultSound.tags.length == 0) {
                        $('#profile_error').removeClass("hide");
                        $("#tags").attr("placeholder", "请打一个标签");
                        $("#save_button").addClass("disabled");
                    }
                }

                $scope.setPrivate = function() {
                    $scope.defaultSound.status = "private";
                }

                $scope.setPublic = function() {
                    $scope.defaultSound.status = "public";
                }

                $scope.save = function () {
                    if ($("#save_button").hasClass("disabled")) {
                        return;
                    }
                    if ($scope.defaultSound.name && $scope.defaultSound.tags.length > 0) {
                        $scope.defaultSound.profileError = '';

                        if ($scope.defaultSound.alias) {
                            var soundProfile = {};
                            soundProfile.name = $scope.defaultSound.name;
                            soundProfile.description = $scope.defaultSound.description;
                            soundProfile.status = $scope.defaultSound.status;
                            if($scope.defaultSound.posterFileName)
                            {
                                soundProfile.poster = {};
                                soundProfile.poster.posterId = $scope.defaultSound.posterFileName.split(".")[0];
                                soundProfile.poster.extension = $scope.defaultSound.posterFileName.split(".")[1];
                            }
                            var sound = Sound.update({sound: $scope.defaultSound.alias}, soundProfile, function (count) {

                                $scope.defaultSound.profileMsgClass = "alert alert-success";
                                $scope.defaultSound.profileMsg = "声音信息保存成功";
                                $scope.defaultSound.alias = sound.alias;
                                Tag.attach({path: sound.alias+"/attach"}, {tags: $scope.defaultSound.tags}, function (count) {
                                    $scope.defaultSound.profileSaved = true;
                                    if ($scope.defaultSound.dataSaved) {
                                        $scope.defaultSound.uploadMsgClass = "alert alert-success";
                                        $scope.defaultSound.uploadMsg = "您的声音" + $scope.defaultSound.name + "上传成功。我们将尽快处理您上传的声音，这可能需要几分钟，请耐心等待。";

                                        $('#uploadpart').show();
                                        $('#progresspart').hide();
                                        $('#sound_info').hide();
                                        reset();
                                        var user = User.get({userAlias:'robot'}, function(){
                                            var minutesLeft = 120 - (user.userSocial.soundDuration)/(60);
                                            $scope.defaultSound.minutesToUpload =  minutesLeft;
                                        });
                                    }
                                });

                            }, function () {
                                $scope.defaultSound.profileMsgClass = "alert alert-error";
                                $scope.defaultSound.profileMsg = "声音信息保存失败";
                            });
                        }
                        else {
                            var soundProfile = {};
                            soundProfile.name = $scope.defaultSound.name;
                            soundProfile.description = $scope.defaultSound.description;
                            soundProfile.status = $scope.defaultSound.status;
                            var fileNames = $scope.defaultSound.fileName.split(".");
                            soundProfile.remoteId = fileNames[0];
                            soundProfile.extension = fileNames[1];
                            if($scope.defaultSound.posterFileName)
                            {
                                soundProfile.poster = {};
                                soundProfile.poster.posterId = $scope.defaultSound.posterFileName.split(".")[0];
                                soundProfile.poster.extension = $scope.defaultSound.posterFileName.split(".")[1];
                            }

                            var sound = Sound.save({sound: $scope.defaultSound.name}, soundProfile, function (count) {

                                $scope.defaultSound.profileMsgClass = "alert alert-success";
                                $scope.defaultSound.profileMsg = "声音信息保存成功";
                                $scope.defaultSound.alias = sound.alias;
                                Tag.attach({path: sound.alias}, {tags: $scope.defaultSound.tags}, function (count) {
                                    $scope.defaultSound.profileSaved = true;
                                    if ($scope.defaultSound.dataSaved) {
                                        $scope.defaultSound.uploadMsgClass = "alert alert-success";
                                        $scope.defaultSound.uploadMsg = "您的声音" + $scope.defaultSound.name + "上传成功。我们将尽快处理您上传的声音，这可能需要几分钟，请耐心等待。";
                                        $('#uploadpart').show();
                                        $('#progresspart').hide();
                                        $('#sound_info').hide();
                                        reset();
                                        var user = User.get({userAlias:'robot'}, function(){
                                            var minutesLeft = 120 - (user.userSocial.soundDuration)/(60);
                                            $scope.defaultSound.minutesToUpload =  minutesLeft;
                                        });
                                    }
                                });

                            }, function () {
                                $scope.defaultSound.profileMsgClass = "alert alert-error";
                                $scope.defaultSound.profileMsg = "声音信息保存失败";
                            });
                        }
                    }
                    else {
                        $scope.defaultSound.profileMsgClass = "alert alert-error";
                        $scope.defaultSound.profileMsg = "请填写声音名称并打至少一个tag"
                    }
                }

                $scope.$on('$viewContentLoaded', function () {
                   var user = User.get({userAlias:'robot'}, function(){
                       var minutesLeft = 120 - (user.userSocial.soundDuration)/(60);
                       $scope.defaultSound.minutesToUpload =  minutesLeft;
                    });
                    var soundToUpload = Sound.getSoundToUpload(
                        {sound: 'toupload'}, function () {
                            if (soundToUpload.profile) {
                                $scope.defaultSound.name = soundToUpload.profile.name;
                                $scope.defaultSound.fileName = soundToUpload.profile.remoteId + '.' + soundToUpload.profile.extension;
                                $scope.defaultSound.alias = soundToUpload.profile.alias;
                                $scope.defaultSound.description = soundToUpload.profile.description;
                                $scope.defaultSound.status = soundToUpload.profile.status;

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
                                $scope.defaultSound.uploadMsgClass = "alert alert-warning";
                                $scope.defaultSound.uploadMsg = "您有未完成的声音分享，请完成声音" + $scope.defaultSound.name + "音频的上传。";
                                $('#uploadpart').hide();
                                $('#progresspart').show();
                                $('#sound_info').show();
                            }
                            else {
                                if (soundToUpload.soundData) {
                                    $scope.defaultSound.uploadStatus = "hide";
                                    var names = soundToUpload.soundData.originName.split(".");
                                    $scope.defaultSound.name = names[0];
                                    $scope.defaultSound.fileName = soundToUpload.soundData.objectId;
                                    $scope.defaultSound.dataSaved = true;
                                    $scope.defaultSound.uploadMsgClass = "alert alert-warning";
                                    $scope.defaultSound.uploadMsg = "您有未完成的声音分享，请完成" + $scope.defaultSound.name + "的声音信息。";
                                    $('#uploadpart').hide();
                                    $('#progresspart').show();
                                    $('#sound_info').show();
                                }
                                else {
                                    $('#uploadpart').show();
                                }
                            }
                        }
                    );

                    $("#tags").typeahead({
                        remote: {
                            url: config.service.url_noescp + '/tag/list?term=%QUERY',
                            filter: function (parsedResponse) {
                                var tags = [];
                                $.each(parsedResponse, function (index, tag) {
                                    tags.push(tag.label);
                                });
                                return tags;
                            }
                        }

                    });
                    $("#tags").bind('keyup', function (event) {
                        if (event.keyCode == 13) {
                            var label = $("#tags").val();
                            if (label) {
                                if ($.inArray(label, $scope.defaultSound.tags) != -1) {
                                    return;
                                }
                                $scope.$apply(function () {
                                    $scope.defaultSound.tags.push(label);
                                });
                                $("#tags").val("");
                                $("#tags").attr("placeholder", "请再多打几个");

                                if ($scope.defaultSound.name && !$scope.defaultSound.uplodingPoster) {
                                    $("#save_button").removeClass("disabled");
                                } else {
                                    $("#save_button").addClass("disabled");
                                }
                            }
                        }
                    });

                    $('#name').bind('keyup', function (event) {
                        if ($scope.defaultSound.name && $scope.defaultSound.tags.length > 0  && !$scope.defaultSound.uplodingPoster) {
                            $("#save_button").removeClass("disabled");
                        } else {
                            $("#save_button").addClass("disabled");
                        }
                    });
                });

                function reset() {
                    $scope.defaultSound.name = null;
                    $scope.defaultSound.fileName = null;
                    $scope.defaultSound.alias = null;
                    $scope.defaultSound.description = null;
                    $scope.defaultSound.status = "public";
                    $scope.defaultSound.tags = [];
                    $scope.defaultSound.profileSaved = false;
                    $scope.defaultSound.dataSaved = false;
                    $scope.defaultSound.posterFileName = null;
                    $scope.defaultSound.posterUrl = "img/default_avatar_large.png";
                    $scope.defaultSound.minutesToUpload = 120;
                }
            }
        ])

}());
