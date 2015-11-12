/**
 * Created by seanmcgary on 11/11/15.
 */
'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var jsdom = require('jsdom');
var jQuery = require('jquery');

jsdom.defaultDocumentFeatures = {
	FetchExternalResources: false,
	ProcessExternalResources: false
};


let feedMimes = [
	'application/atom+xml',
	'application/rss+xml'
];

let locateFeedUrl = function($){
	let rssFeed = null;

	$('head > link[rel="alternate"]').each(function(){
		if(!rssFeed){
			let $this = $(this);
			let mime = (_.trim($this.attr('type')) || '').toLowerCase();

			if(_.contains(feedMimes, mime)){
				let feed = _.trim($this.attr('href'));
				if(feed.charAt(0) == '/'){
					feed = [baseLink.replace(/\/$/, ''), feed.replace(/^\//, '')].join('/');
				}
				rssFeed = feed;
			}
		}
	});
	return rssFeed;
};

exports.findFeedAtUrl = function(url){
	let urlParts = (url || '').split(/^https?:\/\//i);
	if(urlParts.length < 2 || (urlParts[1]).split('.').length < 2){
		return Promise.reject(new Error('invalid url provided'));
	}

	return new Promise(function(resolve, reject){
		jsdom.env(url, function(err, window){
			if(err){
				return reject(err);
			}

			var $ = jQuery(window);

			var feedUrl = locateFeedUrl($);

			return resolve(feedUrl);
		});
	});
};