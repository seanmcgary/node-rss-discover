/**
 * Created by seanmcgary on 12/23/15.
 */
'use strict';

module.exports = {
	rssDiscovery: {
		feedUrl: 'http://rss.someone.com/feed.rss'
	},
	atomDiscovery: {
		feedUrl: 'http://atom.someone.com/feed.atom'
	},
	rssUrlDiscovery: {
		pageUrl: 'http://rss.someone.com',
		feedUrl: 'http://rss.someone.com/feed.rss'
	},
	atomUrlDiscovery: {
		pageUrl: 'http://atom.someone.com',
		feedUrl: 'http://atom.someone.com/feed.atom'
	},
	feeds: {
		rss: {
			url: 'http://rss.someone.com/feed.rss',
			data: [
				{
					id: undefined,
					link: 'http://seanmcgary.com/posts/deploying-nodejs-applications-with-systemd',
					title: 'Deploying Node.JS applications with systemd',
					description: 'some test content',
					content: 'some test content',
					published: new Date('Wed Dec 09 2015 13:03:52 GMT-0500 (EST)'),
					updatedAt: new Date('Wed Dec 09 2015 13:03:52 GMT-0500 (EST)'),
					authorName: '',
					categories: []
				}
			]
		},
		atom: {
			url: 'http://atom.someone.com/feed.atom',
			data: [
				{
					id: 'tag:blog.someone.com,2013:Post/926362',
					link: 'http://blog.someone.com/some-url',
					title: 'Atom title',
					description: 'Atom test content',
					content: 'Atom test content',
					published: new Date('Mon Nov 02 2015 16:26:17 GMT-0500 (EST)'),
					updatedAt: new Date('Sat Dec 19 2015 10:03:25 GMT-0500 (EST)'),
					authorName: 'Atom author',
					categories: []
				}
			]
		}
	}
};