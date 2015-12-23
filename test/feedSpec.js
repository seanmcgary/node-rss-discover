/**
 * Created by seanmcgary on 12/23/15.
 */
'use strict';

let _ = require('lodash');
let Promise = require('bluebird');
let assert = require('assert');
let nock = require('nock');

let fixtures = require('./fixtures');
let data = require('./data');

let RSS = require('../')

describe('rss feed parsing', () => {

	before((done) => {
		// http pages
		nock(fixtures.rssUrlDiscovery.pageUrl)
		.get('/')
		.reply(200, data.rssDiscovery);

		nock(fixtures.atomUrlDiscovery.pageUrl)
		.get('/')
		.reply(200, data.atomDiscovery);

		// feed content
		nock(fixtures.rssUrlDiscovery.pageUrl)
		.get('/feed.rss')
		.reply(200, data.rss);

		nock(fixtures.atomUrlDiscovery.pageUrl)
		.get('/feed.atom')
		.reply(200, data.atom);
		done();
	});

	describe('feed discovery', () => {



		it('should find an rss feed from a given url', (done) => {
			RSS.findFeedAtUrl(fixtures.rssUrlDiscovery.pageUrl)
			.then((feedUrl) => {
				assert.equal(feedUrl, fixtures.rssUrlDiscovery.feedUrl);
				done();
			});
		});

		it('should find an atom feed from a given url', (done) => {
			RSS.findFeedAtUrl(fixtures.atomUrlDiscovery.pageUrl)
			.then((feedUrl) => {
				assert.equal(feedUrl, fixtures.atomUrlDiscovery.feedUrl);
				done();
			});
		});

		it('should find an rss feed from string content', (done) => {
			RSS.findFeedInPageContent(data.rssDiscovery)
			.then((feedUrl) => {
				assert.equal(feedUrl, fixtures.rssDiscovery.feedUrl);
				done();
			});
		});

		it('should find an atom feed from string content', (done) => {
			RSS.findFeedInPageContent(data.atomDiscovery)
			.then((feedUrl) => {
				assert.equal(feedUrl, fixtures.atomDiscovery.feedUrl);
				done();
			});
		});
	});

	describe('feed parsing', () => {

		it('should parse the rss feed', (done) => {
			RSS.crawlFeed(fixtures.feeds.rss.url)
			.then((posts) => {
				console.log(posts);
				assert.deepEqual(posts, fixtures.feeds.rss.data);
				done();
			});
		});

		it('should parse the atom feed', (done) => {
			RSS.crawlFeed(fixtures.feeds.atom.url)
			.then((posts) => {
				console.log(posts);
				assert.deepEqual(posts, fixtures.feeds.atom.data);
				done();
			});
		});
	});



});