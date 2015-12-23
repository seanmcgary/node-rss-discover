/**
 * Created by seanmcgary on 12/23/15.
 */
'use strict';

let fs = require('fs');
let path = require('path');

module.exports = {
	rss: fs.readFileSync(path.resolve(__dirname + '/rss.xml')).toString(),
	atom: fs.readFileSync(path.resolve(__dirname + '/atom.xml')).toString(),
	rssDiscovery: fs.readFileSync(path.resolve(__dirname + '/rssDiscovery.html')).toString(),
	atomDiscovery: fs.readFileSync(path.resolve(__dirname + '/atomDiscovery.html')).toString()
};