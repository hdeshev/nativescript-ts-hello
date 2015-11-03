var grunt = require('grunt');
var path = require('path');

grunt.initConfig({
    copy: {
        appFiles: {
            expand: true,
            cwd: 'src',
            src: [
                '**/*',
                '!**/*.ts',
                '!typings/**/*.ts',
            ],
            dest: 'app'
        },
    },
});

// load grunt modules from own node_modules folder hack
// https://github.com/gruntjs/grunt/issues/696
var cwd = process.cwd();
process.chdir(path.join(__dirname, '../..'));
grunt.loadNpmTasks('grunt-contrib-copy');
process.chdir(cwd);

// hack to avoid loading a Gruntfile
grunt.task.init = function () { };

grunt.tasks(['copy:appFiles']);
