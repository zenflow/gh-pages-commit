module.exports = {
	series: function (tasks, cb){
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
	},
	each: function (array, iterator, cb){
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
};