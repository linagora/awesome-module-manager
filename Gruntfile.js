'use strict';

var path = require('path');

var fixtures = path.normalize(__dirname + '/test/fixtures');

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      files: ['Gruntfile.js', 'lib/**/*.js', 'test/**/*.js'],
      options: {
        jshintrc: '.jshintrc',
        reporterOutput: ''
      }
    },
    gjslint: {
      options: {
        flags: [
          '--disable 0110 --nojsdoc'
        ],
        reporter: {
          name: 'console'
        }
      },
      all: {
        src: '<%= jshint.files %>'
      }
    },
    fixjstyle: {
      options: {
        flags: [
          '--disable 0110'
        ],
        reporter: {
          name: 'console'
        }
      },
      all: {
        src: '<%= jshint.files %>'
      }
    },
    mochacli: {
      options: {
        reporter: 'spec',
        env: {
          NODE_PATH: fixtures
        }
      },
      all: ['test/*.js', 'test/loaders/*.js']
    },
    release: {
      options: {
        tagName: 'v<%= version %>'
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-gjslint');
  grunt.loadNpmTasks('grunt-mocha-cli');
  grunt.loadNpmTasks('grunt-release');

  grunt.registerTask('linters', ['jshint', 'gjslint']);
  grunt.registerTask('mocha', ['mochacli']);
  grunt.registerTask('test', ['mochacli', 'linters']);
  grunt.registerTask('fixjsstyle', ['fixjsstyle']);
};
