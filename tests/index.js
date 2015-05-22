var uuid = require('uuid');
var fs = require('fs');
var path = require('path');
var ghPagesCommit = require('../lib');

var html_in = fs.readFileSync(path.join(__dirname, 'src/index.html'), 'utf8');
var html_out = html_in.replace(/~uuid~/, uuid.v1());
fs.writeFileSync(path.join(__dirname, 'build/index.html'), html_out);

ghPagesCommit('tests/build', {
	basedir: path.join(__dirname, '..'),
	verbose: true
}, function(error){
	if (error){throw error;}
	console.log('done');
});