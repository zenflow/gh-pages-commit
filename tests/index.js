var uuid = require('uuid');
var fs = require('fs');
var path = require('path');
var ghPagesCommit = require('../lib');
var fs_extra = require('fs-extra');

var html_in = fs.readFileSync(path.join(__dirname, 'src/index.html'), 'utf8');
var html_out = html_in.replace(/~uuid~/, uuid.v1());
fs_extra.emptyDirSync(path.join(__dirname, 'build'));
fs.writeFileSync(path.join(__dirname, 'build/index.html'), html_out);
fs_extra.copySync(path.join(__dirname, 'src', 'images'), path.join(__dirname, 'build', 'images'));

ghPagesCommit('tests/build', {
	basedir: path.join(__dirname, '..'),
	verbose: true
}, function(error){
	if (error){throw error;}
	console.log('Success!');
});