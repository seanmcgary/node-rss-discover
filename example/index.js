/**
 * Created by seanmcgary on 11/11/15.
 */
var RSSDiscover = require('../');

var URL = 'https://www.reddit.com/r/technology';
RSSDiscover.findFeedAtUrl(URL)
.then(function(feedUrl){
	console.log(feedUrl);
})
.catch(function(err){
	console.log(err);
	console.log(err.stack);
});