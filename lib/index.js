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
	var gitignore, status;

	function logLines(lines){
		if (!options.verbose){return;}
		forEach(typeof lines=='string' ? lines.split('\n') : lines, function (line){
			console.log('gh-pages-commit: '+line);
		});
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

	async_series([
		function getGitIgnore(cb){
			fs.readFile(path.join(basedir, '.gitignore'), 'utf8', function(error, _gitignore){
				if (error){
					logLines('Didn\'t find a .gitignore to include. Ignoring only "'+dir+'".');
					gitignore = dir;
				} else {
					logLines('Found .gitignore in current branch. Including in "gh-pages" branch.');
					gitignore = _gitignore;
				}
				cb(null);
			})
		},
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
				status = {
					current_branch: match[1]
				};
				cb(null);
			});
		},
		function checkoutGhPages(cb){
			if (status.current_branch!='gh-pages'){
				exec('git checkout --orphan gh-pages', function(error){
					if (error){
						exec('git checkout gh-pages', cb);
					} else {
						exec('git rm -rf "'+getPathForGit(path.relative(process.cwd(), basedir))+'"', cb);
					}
				});
			} else {
				cb(null);
			}
		},
		function saveGitIgnore(cb){
			fs.writeFile(path.join(basedir, '.gitignore'), gitignore, cb);
		},
		function copyFiles(cb){
			fs.readdir(path.join(basedir, dir), function (error, files) {
				if (error){return cb(error);}
				async_each(files, function(file, cb){
					exec('cp -r "'+path.join(basedir, dir, file)+'" "'+path.join(basedir)+'"', cb);
				}, cb);
			});
		},
		function commitFiles(cb){
			exec('git add "'+getPathForGit(path.relative(process.cwd(), basedir) || '.')+'/" && git commit -m "automatic commit (zenflow rules)"', cb);
		},
		function checkoutPreviousBranch(cb){
			if (status.current_branch!='gh-pages'){
				exec('git checkout '+status.current_branch, cb);
			} else {
				cb(null);
			}
		}
	], cb);
};

function async_series(tasks, cb){
	tick(0);
	function tick(i){
		if (i < tasks.length){
			tasks[i](function(error){
				if (error){
					cb(error);
				} else {
					tick(i+1);
				}
			});
		} else {
			cb(null);
		}
	}
}
function async_each(array, iterator, cb){
	var count = 0;
	for (var i = 0; i < array.length; i++){
		iterator(array[i], task_cb);
	}
	function task_cb(error){
		if (error){
			cb(error);
		} else if (++count == array.length){
			cb(null);
		}
	}
}
function getPathForGit(path){
	return path.split('\\').join('/');
}
module.exports = ghPagesCommit;