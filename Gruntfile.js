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
					'node_modules/esprima/esprima.js',
					'inference-jsdoc.js',
					'inference.js'
				],
				dest: 'build/inference.js'
			},
		},

		uglify: {
			inference: {
				compress: true,
				files: {
					'build/inference.min.js': 'build/inference.js'
				}
			}
		},

		watch: {
			inference: {
				files: '<%= jshint.inference.src %>',
				tasks: [ 'default', 'karma' ]
			},

			tests: {
				files: 'test/standalone.js',
				tasks: [ 'karma' ]
			}
		},

		karma: {

			options: {

				frameworks: [ 'qunit' ],
				browsers: [ 'PhantomJS' ],
				reporters: [ 'progress', 'coverage' ],
				singleRun: true,
				coverageReporter: {
					subdir: 'report',
					type: 'lcov'
				}
			},

			client: {
				plugins: [
					'karma-qunit', 'karma-coverage', 'karma-phantomjs-launcher'
				],
				files: [
					{ src: [
						'inference-jsdoc.js',
						'node_modules/esprima/esprima.js',
						'inference.js'
					]},
					{ src: 'test/index.html' },
					{ src: 'test/standalone.js' }
				],
				preprocessors: {
					'inference-jsdoc.js': [ 'coverage' ],
					'inference.js': [ 'coverage' ]
				}
			}
		},

	});

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-karma');

	grunt.registerTask('default', [ 'clean', 'jshint', 'concat' ]);
	grunt.registerTask('minify', [ 'default', 'uglify' ]);
};
