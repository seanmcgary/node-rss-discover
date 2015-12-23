/**
 * Created by seanmcgary on 11/11/15.
 */
'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var jsdom = require('jsdom');
var jQuery = require('jquery');
let Request = require('http-wrap');

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
				if(feed.charAt(0) == '/' && baseLink){
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

	return Request({
		url: url,
		method: 'GET'
	})
	.then((data) => {
		return findFeedInPageContent(data.data, url);
	});
};

let findFeedInPageContent = exports.findFeedInPageContent = function(pageContent, baseUrl){

	return new Promise(function(resolve, reject){
		jsdom.env(pageContent, function(err, window){
			if(err){
				return reject(err);
			}

			var $ = jQuery(window);

			var feedUrl = locateFeedUrl($, baseUrl);

			return resolve(feedUrl);
		});
	});
};

let fetchFeed = function(url){
	return Request({
		url: url,
		method: 'GET'
	})
	.then((data) => {
		return data.data;
	});
};

let parseRssFeed = function(feed){
	return new Promise(function(resolve, reject){
		var parsedFeed;
		try {
			parsedFeed = _.chain(feed.channel)
			.map((channel) => {
				return _.chain(channel.item)
				.map((item) => {

					return _.mapValues(item, (val, key) => {

						if (_.isArray(val)) {
							if(_.isString(_.first(val))){
								val = _.first(val);
							} else {
								// handle the case for an array of strings/objects
								val = _.map(val, (v) => {
									if(v._){
										return v._;
									} else if(v.$){
										return v.$;
									}
									return v;
								});
							}
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
			return _.get(item, 'guid') || null;
		},
		link: function(item){
			return _.get(item, 'link') || '';
		},
		title: function(item){
			return _.get(item, 'title') || '';
		},
		description: function(item){
			return _.get(item, 'description') || '';
		},
		content: function(item){
			if(_.get(item, 'content')){
				return item.content;
			} else if(_.get(item, 'content:encoded')){
				return item['content:encoded'];
			} else {
				return _.get(item, 'description') || '';
			}
		},
		published: function(item){
			return _.get(item, 'pubDate') || null;
		},
		updatedAt: function(item){
			return _.get(item, 'pubDate') || null;
		},
		authorName: function(item){
			return _.get(item, 'author') || '';
		},
		categories: function(item){
			return _.get(item, 'category') || [];
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
			return _.get(item, 'id') || null;
		},
		link: function(item){
			return _.get(item, 'link.href') || '';
		},
		title: function(item){
			return _.get(item, 'title') || '';
		},
		description: function(item){
			return _.get(item, 'summary') || '';
		},
		content: function(item){
			return _.get(item, 'content') || '';
		},
		published: function(item){
			return _.get(item, 'published') || null;
		},
		updatedAt: function(item){
			return _.get(item, 'updated') || null;
		},
		authorName: function(item){
			return _.get(item, 'author.name') || '';
		},
		categories: function(item){
			return [];
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



exports.crawlFeed = function(url){
	return fetchFeed(url)
	.then(parseFeed);
};