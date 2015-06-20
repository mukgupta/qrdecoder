module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			task: {
				src: ["src/grid.js",
					  "src/version.js",
					  "src/detector.js",
					  "src/formatinf.js",
					  "src/errorlevel.js",
					  "src/bitmat.js",
					  "src/datablock.js",
					  "src/bmparser.js",
					  "src/datamask.js",
					  "src/rsdecoder.js",
					  "src/gf256poly.js",
					  "src/gf256.js",
					  "src/decoder.js",
					  "src/qrcode.js",
					  "src/findpat.js",
					  "src/alignpat.js",
					  "src/databr.js"],
				dest: 'dist/qrdecode.js',
			},
			options: {
				'separator': grunt.util.linefeed,
				'banner': '',
				'footer': '',
				'stripBanners': false,
				'process': false,
				'sourceMap': false,
				'sourceMapName': undefined,
				'sourceMapStyle': 'embed'
			}
		},
		uglify: {
			task: {
				src: ['dist/qrdecode.js'], 
				dest: 'dist/qrdecode.min.js'
			},
			options: {
				'mangle': {},
				'compress': {},
				'beautify': false,
				'expression': false,
				'report': 'min',
				'sourceMap': false,
				'sourceMapName': undefined,
				'sourceMapIn': undefined,
				'sourceMapIncludeSources': false,
				'enclose': undefined,
				'wrap': undefined,
				'exportAll': false,
				'preserveComments': undefined,
				'banner': '',
				'footer': ''
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	grunt.registerTask('default', ['concat', 'uglify']);
};