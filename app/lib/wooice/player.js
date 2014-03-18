'use strict';

angular.module('wooice.player', []).
    factory('WooicePlayer', ['config', "$rootScope", '$location', 'storage', 'CurSoundList', 'PlayList', 'WooiceWaver', 'SoundSocial', 'UserService',
        function (config, $rootScope, $location, storage, CurSoundList, PlayList, WooiceWaver, SoundSocial, UserService) {

            function init() {
                var settings;
                var soundData = {};
                settings = $.extend(
                    {
                        'swfUrl': 'lib/soundmanager/swf/',
                        'preferFlash': true,
                        'volume': 50,
                        'multiShot': false
                    }
                );
                soundData.settings = settings;

                soundManager.setup({
                    url: soundData.settings.swfUrl,
                    preferFlash: soundData.settings.preferFlash
                });

                return soundData;
            }

            var currentSound = {};
            var soundData = init();

            $rootScope.$watch(currentSound, function () {
            });

            soundData.getNextSound = function (id) {
                return PlayList.getNextSound(id);
            }

            soundData.getRandomSound = function () {
                return PlayList.getRandomSound();
            }

            soundData.setup = function (sound) {
                soundManager.setup({
                    url: soundData.settings.swfUrl,
                    preferFlash: soundData.settings.preferFlash,

                    onready: function () {
                        var playOption = $.extend(
                            {
                                'id': 'defaultSoundId',
                                'url': '',
                                'autoLoad': false,
                                'autoPlay': false,
                                'stream': true,
                                'multiShot': false
                            },
                            sound
                        );

                        var soundStream = soundManager.createSound({
                            id: playOption.id,
                            url: playOption.url,
                            autoLoad: playOption.autoLoad,
                            autoPlay: playOption.autoPlay,
                            stream: playOption.stream,
                            multiShot: playOption.multiShot,

                            onload: function () {
                                console.log(this.id + ' loaded.');
                                soundManager._writeDebug(this.id + ' loaded.');

                                if (null == playOption.position) {
                                    var playerStatus = storage.get(this.id + "_player");
                                    soundData.jump(playerStatus);
                                }
                                else {
                                    if (playOption.position > 0) {
                                        soundData.jump({id: this.id, from: playOption.position});
                                    }
                                }
                            },
                            onplay: function () {
                                if (currentSound && currentSound.id && currentSound.id != this.id) {
                                    currentSound.isPlaying = false;
                                    soundManager.pause(currentSound.id);
                                }
                                currentSound = PlayList.getSound(this.id);
                                currentSound.isPlaying = true;
                                soundManager.setVolume(this.id, 100 - UserService.getVolume());
                                soundManager._writeDebug('Starting sound: ' + this.id);

                                var playerStatus = storage.get(this.id + "_player");
                                if (playerStatus) {
                                    playerStatus.playing = true;
                                    storage.set(this.id + "_player", playerStatus);
                                }

                                if ($location.path() && $location.path().indexOf("/sound/") > -1
                                    && $location.path() !== ("/sound/" + currentSound.alias)) {
                                    $location.url("/sound/" + currentSound.alias);
                                }
                            },
                            whileloading: function () {
                                soundManager._writeDebug(this.id + ': loading ' + this.bytesLoaded + ' / ' + this.bytesTotal);
                                WooiceWaver.load({
                                    id: this.id,
                                    soundBytesloaded: this.bytesLoaded,
                                    soundBytesTotal: this.bytesTotal
                                });
                            },
                            whileplaying: function () {
                                var curSound = PlayList.getSound(this.id);

                                if (curSound) {
                                    currentSound = curSound;
                                    var curPosition = this.position;
                                    $rootScope.$apply(function () {
                                        currentSound.curPostion = curPosition;
                                    });
                                }

                                WooiceWaver.move({
                                    id: this.id,
                                    soundPosition: this.position
                                });
                            },
                            onpause: function () {
                                soundManager._writeDebug('Sound paused: ' + this.id);
                                WooiceWaver.stop({
                                    id: this.id
                                });

                                PlayList.getSound(this.id).isPlaying = false;
                                var playerStatus = storage.get(this.id + "_player");
                                if (playerStatus) {
                                    playerStatus.playing = false;
                                    storage.set(this.id + "_player", playerStatus);
                                }
                            },
                            onresume: function () {
                                if (currentSound && currentSound.id && currentSound.id != this.id) {
                                    currentSound.isPlaying = false;
                                    soundManager.pause(currentSound.id);
                                }
                                currentSound = PlayList.getSound(this.id);
                                currentSound.isPlaying = true;

                                soundManager._writeDebug('Resuming sound: ' + this.id);

                                var playerStatus = storage.get(this.id + "_player");
                                if (playerStatus) {
                                    playerStatus.playing = true;
                                    storage.set(this.id + "_player", playerStatus);
                                }

                                if ($location.path() && $location.path().indexOf("/sound/") > -1
                                    && $location.path() !== ("/sound/" + currentSound.alias)) {
                                    $location.url("/sound/" + currentSound.alias);
                                }
                            },
                            onfinish: function () {
                                var cur = soundManager.getSoundById(this.id);
                                cur.setPosition(0);
                                WooiceWaver.jump({
                                    id: this.id,
                                    soundPosition: 0
                                });
                                WooiceWaver.stop({
                                    id: this.id
                                });

                                $rootScope.$apply($.proxy(function () {
                                    PlayList.getSound(this.id).isPlaying = false;
                                }, this));

                                var playerStatus = storage.get(this.id + "_player");
                                if (playerStatus) {
                                    playerStatus.playing = false;
                                    storage.set(this.id + "_player", playerStatus);
                                }

                                switch (UserService.getPlayMode()) {
                                    case 0:
                                        var sound = PlayList.getNextSound(this.id);
                                        break;
                                    case 1:
                                        var sound = PlayList.getSound(this.id);
                                        break
                                    case 2:
                                        var sound = PlayList.getRandomSound();
                                        break;
                                    case 3:
                                        break;
                                    default:
                                        var sound = PlayList.getNextSound(this.id);
                                        break;
                                }
                                $rootScope.$apply($.proxy(function () {
                                    sound.isPlaying = true;
                                }, this));
                                sound.position = 0;
                                soundData.play(sound);
                            }
                        });

                        if (playOption.autoPlay) {
                            soundStream.play(playOption);
                        }
                    },

                    ontimeout: function () {
                        soundManager._writeDebug('Sound load timeout: ' + this.id);
                    },

                    onfinish: function () {
                        soundManager._writeDebug('Sound play finished. ' + this.id);

                    }
                });
            };

            soundData.jump = function (sound) {
                if (!sound) {
                    return;
                }
                var soundToJump = null;
                if (currentSound.id && currentSound.id == sound.id) {
                    soundToJump = currentSound.id;
                }
                else {
                    soundToJump = sound.id;
                }

                var soundToJump = soundManager.getSoundById(soundToJump);

                if (!soundToJump) {
                    return false;
                }

                if (soundToJump.readyState === 0) { // hasn't started loading yet...
                    // load the whole sound, and play when it's done
                    soundToJump.load({
                        onload: function () {
                            this.play({
                                position: sound.from
                            });
                        }
                    });
                } else if (soundToJump.readyState === 3) {
                    soundToJump.setPosition(sound.from);
                }
            }

            soundData.play = function (input) {
                if (input && input.id) {
                    if (!soundManager.getSoundById(input.id)) {
                        var sound = input;
                        var playsCount = SoundSocial.play({sound: sound.id}, null, function (count) {

                            sound.url = playsCount.url;
                            sound.autoPlay = true;
                            soundData.setup(sound);

                            $('#play_count_' + sound.id).text(playsCount.played);
                        });
                    }
                    else {
                        var soundToPlay = soundManager.getSoundById(input.id);
                        soundToPlay.play();
                        if (input.position) {
                            soundToPlay.setPosition(input.position);
                        }
                    }

                    PlayList.addSound(input);
                }
            }

            soundData.toggle = function (input) {
                if (input && input.id) {
                    var sound = input;
                }
                else {
                    var sound = (currentSound.id) ? currentSound : PlayList.getFirstSound();
                }

                if (!sound) {
                    return;
                }

                if (!soundManager.getSoundById(sound.id) || !PlayList.getSound(sound.id)) {
                    soundData.play(sound);
                    return;
                }
                soundManager.togglePause(sound.id);

                return sound;
            }

            function setupListeners() {
                $(window).bind('onJump', $.proxy(function (event, oneSound) {
                    var sound = CurSoundList.getSound(oneSound.id);
                    if (!sound) {
                        sound = PlayList.getSound(oneSound.id);
                    }

                    sound.from = oneSound.from;
                    soundData.jump(sound);
                    $rootScope.$apply(function () {
                        currentSound.isPlaying = currentSound.isPlaying;
                    });
                }, this));

                $(window).bind('onToggle', $.proxy(function (event, oneSound) {
                    var sound = CurSoundList.getSound(oneSound.id);
                    if (!sound) {
                        sound = PlayList.getSound(oneSound.id);
                    }

                    soundData.toggle(sound);
                    $rootScope.$apply(function () {
                        currentSound.isPlaying = currentSound.isPlaying;
                    });
                }, this));
            }

            setupListeners();

            return {
                addSound: function (sound) {
                    PlayList.addSound(sound);
                },

                updateAlias: function (sound) {
                    var target = PlayList.getSound(input.id);

                    if (target) {
                        if (sound.id == currentSound.id) {
                        }
                    }
                },

                loadFromCache: function (sound) {
                    return PlayList.getSoundByAlias(sound.alias);
                },

                getCurSound: function () {
                    return currentSound;
                },

                getSoundFromPlayer: function (id) {
                    return soundManager.getSoundById(id);
                },

                jump: function (sound) {
                    soundData.jump(sound);
                },

                toggle: function (input) {
                    return soundData.toggle(input);
                },

                toggleInPlaylist: function (id) {
                    return soundData.toggle(PlayList.getSound(id));
                },

                play: function (input) {
                    soundData.play(input);
                },

                playSibling: function (sibling) {
                    var sound = null;
                    if (sibling == 'next') {
                        sound = PlayList.getNextSound(currentSound.id);
                    }
                    else {
                        sound = PlayList.getPreSound(currentSound.id);
                    }

                    if (!sound) {
                        return;
                    }
                    sound.position = 0;
                    soundData.play(sound);

                    return sound;
                },

                setVolume: function (sound) {
                    soundManager.setVolume(sound.id, sound.volume);
                },

                stop: function (sound) {
                    soundManager.stop(sound.id);
                },

                destroy: function (sound) {
                    if (!sound) {
                        return;
                    }

                    if (currentSound && sound.id == currentSound.id) {
                        if (currentSound.isPlaying && PlayList.list().length > 1) {
                            soundManager.pause(currentSound.id);
                            var nextSound = PlayList.getNextSound(currentSound.id);
                            nextSound.position = 0;
                            soundData.play(nextSound);
                        }
                        else {
                            currentSound = {};
                        }
                    }

                    PlayList.removeSound(sound);
                    soundManager.destroySound(sound.id);
                },

                clearCurPlayList: function () {
                    if (confirm('确定要清空播放列表吗?')) {
                        var sounds = PlayList.list();
                        for (var i = 0; i < sounds.length; i++) {
                            if (currentSound && sounds[i].id == currentSound.id) {
                                soundManager.togglePause(sounds[i].id);
                                currentSound = {};
                            }
                            soundManager.destroySound(sounds[i].id);
                        }

                        PlayList.clearAll();
                    }
                }
            }
        }]);