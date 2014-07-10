module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		clean: {
			inference: [ 'build' ]
		},

		jshint: {
			inference: {
				options: { jshintrc: '.jshintrc' },
				src: [
					'inference.js'
				]
			}
		},

		concat: {
			options: {
				//banner: grunt.file.read('src/banner.txt'),
				stripBanners: true
			},

			inference: {
				src: [
					'node_modules/j5g3.jsdoc-parser/jsdoc-parser.js',
					'inference.js'
				],
				dest: 'build/inference.js'
			},
		},

		uglify: {
			inference: {
				compress: true,
				files: {
					'build/inference.js': 'build/inference.min.js'
				}
			}
		},

		watch: {
			inference: {
				files: '<%= jshint.inference.src %>',
				tasks: [ 'default' ]
			}
		}

	});

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');

	grunt.registerTask('default', [ 'jshint', 'concat' ]);
	grunt.registerTask('minify', [ 'default', 'clean', 'uglify' ]);
};
