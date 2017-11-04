module.exports = function(grunt){

  grunt.initConfig({
    clean: ['build', 'public/build'],
    concurrent: {
      dev: [
        'supervisor',
        'uglify',
        'watch'
      ],
      options: {
        logConcurrentOutput: true
      }
    },
    concat: {
      scripts: {
        src: ['public/javascripts/*.js'],
        dest: 'build/js/scripts.js',
      },
      threegraph: {
        src: ['public/threeGraph/**/*.js'],
        dest: 'build/js/threeGraph.js',
      },
      css: {
        src: ['public/**/*.css'],
        dest: 'build/css/styles.css',
      },
    },
    watch: {
      js: {
        files: ['public/**/*.js'],
        tasks: ['concat:js'],
      },
      css: {
        files: ['public/**/*.css'],
        tasks: ['concat:css'],
      },
    },
    supervisor: {
      target: {
        script: "main.js"
      },
    },
    uglify: {
      options: {
        mangle: false
      },
      target: {
        files: {
          'public/build/js/scripts.min.js': ['build/js/scripts.js'],
          'public/build/js/threeGraph.min.js': ['build/js/threeGraph.js']
        }
      }
    },
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-supervisor');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.registerTask('default', ['clean', 'concat', 'concurrent']);

};
