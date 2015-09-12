var path = require("path");

module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-shell');

    var androidAvd = grunt.option('avd') || "nexus"
    var genyDevice = grunt.option('geny') || "nexus"
    var iOSDevice = grunt.option('device') || "nexus"

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
            emulateAndroid: {
                command: "tns emulate android --avd \"" + androidAvd +"\""
            },
            emulateGeny: {
                command: "tns emulate android --geny \"" + genyDevice +"\""
            },

            emulateIOS: {
                command: "tns emulate ios --device \"" + iOSDevice +"\""
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

    grunt.registerTask("run-android", ["app", "shell:emulateAndroid"])
    grunt.registerTask("run-geny", ["app", "shell:emulateGeny"])
    grunt.registerTask("run-ios", ["app", "shell:emulateIOS"])

    grunt.registerTask("clean", ["removeAppDir"]);
}
