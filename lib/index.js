/**
 * Created by seanmcgary on 11/11/15.
 */
'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var jsdom = require('jsdom');
var jQuery = require('jquery');
var request = require('request');

var xml2js = Promise.promisifyAll(require('xml2js'));

jsdom.defaultDocumentFeatures = {
	FetchExternalResources: false,
	ProcessExternalResources: false
};


let feedMimes = [
	'application/atom+xml',
	'application/rss+xml'
];

let locateFeedUrl = function($, baseLink){
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

let findFeedAtUrl = exports.findFeedAtUrl = function(url){
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

			var feedUrl = locateFeedUrl($, url);

			return resolve(feedUrl);
		});
	});
};

let findFeedInPageContent = exports.findFeedInPageContent = function(pageContent){

	return new Promise(function(resolve, reject){
		jsdom.env(pageContent, function(err, window){
			if(err){
				return reject(err);
			}

			var $ = jQuery(window);

			var feedUrl = locateFeedUrl($, url);

			return resolve(feedUrl);
		});
	});
};

let fetchFeed = function(url){
	return new Promise(function(resolve, reject){
		request.get(url, function(err, message, response){
			if(err){
				return reject(err);
			}
			resolve(response);
		});
	});
};

let parseRssFeed = function(feed){

	return new Promise(function(resolve, reject){
		var parsedFeed;
		try {
			parsedFeed = _.chain(feed.channel)
			.map(function (channel) {
				return _.chain(channel.item)
				.map(function (item) {
					return _.mapValues(item, function (val, key) {
						if (_.isArray(val)) {
							val = _.first(val);
						}

						if(_.isPlainObject(val)){
							val = val._;
						}

						if (key == 'pubDate') {
							val = new Date(val);
						}
						return val;
					});
				})
				.value();
			})
			.flatten()
			.value();
		} catch(e){
			reject(e);
		}
		resolve(parsedFeed);
	})
	.then(normalizeRssFeed);
};

let normalizeRssFeed = function(feed){
	var schema = {
		id: function(item){
			return _.get(item, 'guid');
		},
		link: function(item){
			return _.get(item, 'link');
		},
		title: function(item){
			return _.get(item, 'title');
		},
		content: function(item){
			return _.get(item, 'description');
		},
		published: function(item){
			return _.get(item, 'pubDate');
		},
		updatedAt: function(item){
			return _.get(item, 'pubDate');
		},
		authorName: function(item){
			return _.get(item, 'author');
		}
	};

	return _.chain(feed)
	.map(function(item){
		return _.mapValues(schema, function(fn){
			return fn(item);
		});
	})
	.value();
};

var parseAtomProperty = function(val, key){
	if(_.isArray(val)){
		val = _.first(val);
	}

	if(_.isPlainObject(val)){
		if(val._){
			val = val._;
		} else if(val.$){
			val = val.$;
		}
	}

	if(_.isPlainObject(val)){
		val = _.mapValues(val, parseAtomProperty);
	}

	if(_.contains(['published', 'updated'], key)){
		val = new Date(val);
	}

	return val;
};

let normalizeAtomFeed = function(feed){
	var schema = {
		id: function(item){
			return _.get(item, 'id');
		},
		link: function(item){
			return _.get(item, 'link.href');
		},
		title: function(item){
			return _.get(item, 'title');
		},
		content: function(item){
			return _.get(item, 'content');
		},
		published: function(item){
			return _.get(item, 'published');
		},
		updatedAt: function(item){
			return _.get(item, 'updated');
		},
		authorName: function(item){
			return _.get(item, 'author.name');
		}
	};

	return _.chain(feed)
	.map(function(item){
		return _.mapValues(schema, function(fn){
			return fn(item);
		});
	})
	.value();
};

let parseAtomFeed = function(feed){
	return new Promise(function(resolve, reject){
		var parsedFeed;
		try {
			parsedFeed = _.chain(feed.entry)
			.map(function(entry) {

				return _.mapValues(entry, parseAtomProperty);
			})
			.flatten()
			.value();
		} catch(e){
			reject(e);
		}

		resolve(parsedFeed);
	})
	.then(normalizeAtomFeed);
};

let parseFeed = function(rssFeed){
	return xml2js.parseStringAsync(rssFeed)
	.then(function(feed){
		if(feed.rss){
			return parseRssFeed(feed.rss);
		} else if(feed.feed){
			return parseAtomFeed(feed.feed);
		}

		throw new Error('unable to identify feed type');
	});
};



exports.crawlRssFeed = function(url){
	return fetchFeed(url)
	.then(parseFeed);
};