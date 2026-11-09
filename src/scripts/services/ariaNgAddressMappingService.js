(function () {
    'use strict';

    angular.module('ariaNg').factory('ariaNgAddressMappingService', ['ariaNgSettingService', function (ariaNgSettingService) {
        var trimTrailingSlashes = function (address) {
            if (!address) {
                return '';
            }

            var result = address.trim();

            while (result.length > 0 && result.charAt(result.length - 1) === '/') {
                result = result.substring(0, result.length - 1);
            }

            return result;
        };

        var getHostAndPath = function (address) {
            var protocolSeparatorIndex = address.indexOf('://');

            if (protocolSeparatorIndex > 0) {
                return address.substring(protocolSeparatorIndex + 3);
            }

            return address;
        };

        var escapeRegExp = function (s) {
            return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        };

        var getCurrentMapping = function () {
            var publicAddress = trimTrailingSlashes(ariaNgSettingService.getAddressMappingPublicAddress());
            var internalAddress = trimTrailingSlashes(ariaNgSettingService.getAddressMappingInternalAddress());

            if (!publicAddress || !internalAddress) {
                return null;
            }

            var publicHost = getHostAndPath(publicAddress);

            if (!publicHost) {
                return null;
            }

            if (internalAddress.indexOf('://') < 0) {
                internalAddress = 'http://' + internalAddress;
            }

            return {
                publicAddress: publicAddress,
                internalAddress: internalAddress,
                publicHost: publicHost
            };
        };

        return {
            getCurrentMapping: function () {
                return getCurrentMapping();
            },
            isMappingConfigured: function () {
                return !!getCurrentMapping();
            },
            replaceAddresses: function (text) {
                var mapping = getCurrentMapping();

                if (!text || !mapping) {
                    return {
                        text: text,
                        replacedCount: 0
                    };
                }

                // Match the address from the beginning of each line. The protocol is ignored when matching,
                // so "http://host/path" could also be mapped by "https://host".
                var addressRegExp = new RegExp('^([ \\t]*)(?:[a-zA-Z][a-zA-Z0-9+.\\-]*:\\/\\/)?'
                    + escapeRegExp(mapping.publicHost) + '(?=$|[/?#\\s])', 'i');
                var lines = text.split('\n');
                var replacedCount = 0;

                for (var i = 0; i < lines.length; i++) {
                    if (!addressRegExp.test(lines[i])) {
                        continue;
                    }

                    lines[i] = lines[i].replace(addressRegExp, function (match, leadingWhitespace) {
                        return leadingWhitespace + mapping.internalAddress;
                    });

                    replacedCount++;
                }

                if (replacedCount < 1) {
                    return {
                        text: text,
                        replacedCount: 0
                    };
                }

                return {
                    text: lines.join('\n'),
                    replacedCount: replacedCount
                };
            }
        };
    }]);
}());
