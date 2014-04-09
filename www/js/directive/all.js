
'use strict';

/* C4P Directives */

var directiveModule = angular.module('c4p.directives', ['c4p.filters', 'ui.bootstrap'
        , 'a4p.bootstrap.carousel', 'a4p.bootstrap.accordion'
        , 'c4p.input','c4p.ratings', 'c4p.viewer'])
    .config(function($compileProvider){
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel):/);
    });

// add a4p Sense to our directives
a4p.Sense.declareDirectives(directiveModule);
a4p.Resize.declareDirectives(directiveModule);

console.log('a4p.Sense.declareDirectives');