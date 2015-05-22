var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var find = require('lodash.find');
var forEach = require('lodash.forEach');

var CLEAN_COPY_MSG = 'nothing to commit, working directory clean';

var ghPagesCommit = function(dir, options, cb){
	cb = typeof options=='function' ? options : (cb==undefined ? function(){} : cb);
	options = options || {};
	var basedir = options.basedir || process.cwd();
	var add = path.relative(process.cwd(), path.join(basedir, dir));
	getGitIgnore(function(error, gitignore){
		if (error){return cb(error);}
		getGitStatus(function(error, status){
			if (error){return cb(error);}
			var previous_branch = status.current_branch;
			// switch branch if necessary
			if (previous_branch!='gh-pages'){
				exec('git checkout gh-pages', next);
			} else {
				next(null);
			}
			function next(error){
				if (error){return cb(error);}
				// copy files from dir to basedir
				exec('cp -r "'+path.join(basedir, dir)+'" "'+basedir+'/"', function(error){
					if (error){return cb(error);}
					// commit all files
					exec('git add '+add+' && git commit -m "automatic commit"', function(error){
						if (error){return cb(error);}
						// switch back to previous branch if necessary
						if (previous_branch!='gh-pages'){
							exec('git checkout '+previous_branch, cb);
						} else {
							cb(null);
						}
					});
				});
			}
		});
	});

	function logLines(lines){
		if (!options.verbose){return;}
		forEach(typeof lines=='string' ? lines.split('\n') : lines, function (line){
			console.log('gh-pages-commit: '+line);
		});
	}
	function getGitIgnore(cb){
		fs.readFile(path.join(basedir, '.gitignore'), 'utf8', function(error, gitignore){
			if (error){
				logLines('Didn\'t find a .gitignore to include. Ignoring only "'+add+'".');
				cb(null, add);
			} else {
				logLines('Found .gitignore in current branch. Including in "gh-pages" branch.');
				cb(null, gitignore);
			}
		})
	}
	function exec(cmd, cb){
		logLines('> '+cmd);
		child_process.exec(cmd, function(error, stdout, stderr){
			logLines(stdout);
			if (error){
				logLines(stderr);
				cb(error);
			} else {
				cb(null, stdout);
			}
		});
	}
	function getGitStatus(cb){
		exec('git status', function(error, status_str) {
			if (error) {return cb(error);}
			var status_lines = status_str.split('\n');
			var match = status_lines[0].match(/^On branch (.*)$/);
			if (!match) {
				return cb(new Error('Could not determine current branch'));
			}
			if (!find(status_lines, function (line) {return line == CLEAN_COPY_MSG;})){
				return cb(new Error('Working copy must be clean'));
			}
			cb(null, {
				current_branch: match[1]
			});
		});
	}
};


module.exports = ghPagesCommit;