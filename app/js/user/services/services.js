angular.module('profile.services', []).
    factory('UserProfile', ['$resource', 'config', function ($resource, config) {
        return $resource(config.service.url + '/user/:uri', {}, {
            updateBasic: {method: 'POST', params: {uri: "updateBasic"}, isArray: false},
            updateExternal: {method: 'POST', params: {uri: "updateSns"}, isArray: false}
        });
    }])
    .factory('UserMessage', ['$resource', 'config', function ($resource, config) {
        return $resource(config.service.url + '/message/:msgId/:action', {}, {
            sendMessage: {method: 'POST', params: {action:'send'}, isArray: false},
            replyMessage: {method: 'PUT', params: {action:'reply'}, isArray: false},
            markMessage: {method: 'POST', params: {action:'mark'}, isArray: false},
            listMessages: {method: 'GET', cache : true, params: {action:"list", pageNum:1,perPage:5}, isArray: true},
            getMessage: {method: 'GET', params: {}, isArray: false},
            countMessage: {method: 'HEAD', cache : true, params: {action:"count"}, isArray: false},
            getReplies: {method: 'GET', cache : true, params: {action:'replies'}, isArray: true}
        });
    }])
;