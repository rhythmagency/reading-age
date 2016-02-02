module.exports = function(grunt) {

    // Initialize Grunt tasks.
    grunt.initConfig({
        "pkg": grunt.file.readJSON('package.json'),
		uglify: {
			options: {
				// the banner is inserted at the top of the output
				banner: ''
			},
			dist: {
				files: {
					'files/umbraco/lib/tinymce/plugins/rhythmReadingAge/plugin.min.js': [ 'files/umbraco/lib/tinymce/plugins/rhythmReadingAge/plugin.js' ]
				}
			}
		},
		umbracoPackage: {
            main: {
                src: "./files",
                dest: "../dist",
                options: {
                    name: "ReadingAge",
                    version: "0.3.0",
                    url: "https://github.com/rhythmagency/reading-age",
                    license: "MIT License",
                    licenseUrl: "http://opensource.org/licenses/MIT",
                    author: "Rhythm Agency",
                    authorUrl: "http://rhythmagency.com/",
                    readme: grunt.file.read("templates/inputs/readme.txt"),
                    manifest: "templates/package.template.xml"
                }
            }
        }
    });

    // Load NPM tasks.
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-umbraco-package");

    // Register Grunt tasks.
    grunt.registerTask("default",
        // The "default" task is for general development of ReadingAge.
        [ "uglify:dist", "umbracoPackage:main" ]);

};