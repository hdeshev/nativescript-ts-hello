var path = require("path");

module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-shell');

    grunt.initConfig({
        ts: {
            build: {
                src: [
                    'src/**/*.ts',
                ],
                dest: 'app',
                options: {
                    fast: "never",
                    module: "commonjs",
                    target: "es5",
                    sourceMap: true,
                    removeComments: false,
                    compiler: "node_modules/typescript/bin/tsc",
                    noEmitOnError: true
                },
            },
        },
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
        shell: {
            emulate: {
                //change to your AVD name below
                command: "tns emulate android --avd nexus4-x64"
            }
        }
    });

    grunt.registerTask("removeAppDir", function() {
        grunt.file.delete("app");
    });

    grunt.registerTask("app", [
        "copy:appFiles",
        "ts:build",
    ]);

    grunt.registerTask("app-full", [
        "clean",
        "app",
    ]);

    grunt.registerTask("run-android", ["app", "shell:emulate"])

    grunt.registerTask("clean", ["removeAppDir"]);
}
