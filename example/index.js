/**
 * Created by seanmcgary on 11/11/15.
 */
var RSSDiscover = require('../');
var util = require('util');

var URL = 'http://venturebeat.com';
RSSDiscover.findFeedAtUrl(URL)
.then(RSSDiscover.crawlFeed)
.then(function(feed){

	console.log(util.inspect(feed, true, 8, true));
})
.catch(function(err){
	console.log(err);
	console.log(err.stack);
});