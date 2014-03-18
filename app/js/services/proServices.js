'use strict';

/* Services */

angular.module('sound.pro.services', ['ngResource'])
    .factory('SoundProSocial', ['$resource', 'config', function ($resource, config) {
        return $resource(config.service.url + '/soundPro/:soundId/:action', {}, {
            promote: {method: 'POST', params:{action: 'promote'}, isArray:false},
            demote: {method: 'POST', params:{action: 'demote'}, isArray:false}
        });
    }
    ])
    .factory('SoundSocialProSocial', ['$resource', 'config', function ($resource, config) {
        return $resource(config.service.url + '/soundActivityPro/:soundId/:action', {}, {
            plays: {method: 'GET', cache : true, params: {action: 'plays', pageNum: 0, perPage: config.repostsPerPage}, isArray: true},
            visits: {method: 'GET', cache : true, params: {action: 'visits', pageNum: 0, perPage: config.repostsPerPage}, isArray: true}
        });
    }
    ]);