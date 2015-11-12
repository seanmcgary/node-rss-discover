/**
 * Created by seanmcgary on 11/11/15.
 */
var RSSDiscover = require('../');
var util = require('util');

var URL = 'https://www.reddit.com/r/technology';
RSSDiscover.findFeedAtUrl(URL)
.then(RSSDiscover.crawlRssFeed)
.then(function(feed){
	console.log(util.inspect(feed, true, 8, true));
})
.catch(function(err){
	console.log(err);
	console.log(err.stack);
});