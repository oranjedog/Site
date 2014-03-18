angular.module('playlist.services', ['ngResource'])
    .factory('PlayListService', ['$resource', 'config', function ($resource, config) {
        return $resource(config.service.url + '/sound/playlist', {}, {
            get: {method: 'GET', params: { }, isArray: true},
            add: {method: 'POST', params: { }, isArray: false},
            remove: {method: 'DELETE', params: { }, isArray: false}
        });
    }
    ])
    .factory('PlayList', ['$q', 'User', 'UserService', 'PlayListService', 'SoundUtilService', 'CurSoundList', 'config', 'storage',
        function ($q, User, UserService, PlayListService, SoundUtilService, CurSoundList, config, storage) {
            var sounds = [];

            if (!UserService.validateRoleGuest()) {
                var playlist = PlayListService.get({}, function () {
                    $.each(playlist, function (index, oneSound) {
                        var sound = SoundUtilService.buildSound(oneSound);
                        sounds.push(sound);
                    });
                });
            }
            else
            {
                if (storage.get('guest_list') && $.isArray(storage.get('guest_list')))
                {
                    sounds = storage.get('guest_list');

                    $.each(sounds, function (index, oneSound) {
                        oneSound.isPlaying = false;
                    });
                }
            }

            return {
                setup: function () {
                    sounds = [];

                    if (!UserService.validateRoleGuest()) {
                        var playlist = PlayListService.get({}, function () {
                            $.each(playlist, function (index, oneSound) {
                                var sound = SoundUtilService.buildSound(oneSound);
                                sounds.push(sound);
                            });
                        });
                    }
                },
                clearAll: function() {
                        if (!UserService.validateRoleGuest())
                        {
                            var calls = [];

                            for (var i = 0; i < sounds.length; i++) {
                                var callDefer = $q.defer();
                                PlayListService.remove({soundId: sounds[i].id}, function () {
                                    callDefer.resolve();
                                });
                                calls.push(callDefer.promise);
                            }

                            $q.all(calls).then(
                                function(){
                                    sounds = [];
                                }
                            );
                        }
                        else
                        {
                            sounds = [];
                            storage.set('guest_list', sounds);
                        }
                },
                list: function () {
                    return sounds;
                },
                addSound: function (sound) {
                    for (var i = 0; i < sounds.length; i++) {
                        if (sounds[i].id == sound.id) {
                            var temp = sounds[i];
                            sounds[i] = sound;
                            sounds[i].isPlaying = temp.isPlaying;
                            return;
                        }
                    }
                    sounds.push(sound);

                    if (UserService.validateRoleGuest())
                    {
                        storage.set('guest_list', sounds);
                    }
                },
                removeSound: function (sound) {
                    for (var i = 0; i < sounds.length; i++) {
                        if (sounds[i].id == sound.id) {
                            var removeIndex = i;
                            if (!UserService.validateRoleGuest()) {
                                PlayListService.remove({soundId: sound.id}, function () {
                                    sounds.splice(removeIndex, 1);
                                });
                            }
                            else {
                                sounds.splice(removeIndex, 1);
                            }
                        }
                    }

                    if (UserService.validateRoleGuest())
                    {
                        storage.set('guest_list', sounds);
                    }
                },
                getSound: function (id) {
                    for (var i = 0; i < sounds.length; i++) {
                        if (sounds[i].id == id) {
                            return  sounds[i];
                        }
                    }
                    return  null;
                },
                getSoundByAlias: function (alias) {
                    for (var i = 0; i < sounds.length; i++) {
                        if (sounds[i].alias == alias) {
                            return  sounds[i];
                        }
                    }
                    return  null;
                },
                getNextSound: function (id) {
                    if (sounds.length == 0) {
                        return null;
                    }
                    var soundIndex = null;
                    for (var i = 0; i < sounds.length; i++) {
                        if (sounds[i].id == id) {
                            soundIndex = i;
                        }
                    }

                    if (soundIndex !== null) {
                        return sounds[(soundIndex >= sounds.length - 1) ? 0 : (soundIndex + 1)];
                    }
                    else {
                        return sounds[0];
                    }
                },
                getPreSound: function (id) {
                    if (sounds.length == 0) {
                        return null;
                    }
                    var soundIndex = null;
                    for (var i = 0; i < sounds.length; i++) {
                        if (sounds[i].id == id) {
                            soundIndex = i;
                            break;
                        }
                    }

                    if (soundIndex !== null) {
                        return sounds[(soundIndex == 0) ? (sounds.length - 1) : (soundIndex - 1)];
                    }
                    else {
                        return sounds[0];
                    }
                },
                getFirstSound: function () {
                    if (sounds.length) {
                        return sounds[0];
                    }
                    else {
                        return null;
                    }
                },
                getRandomSound: function () {
                    var random = Math.floor(Math.random() * sounds.length);
                    return sounds[random];
                }
            };
        }])
