const gulp = require('gulp');
const babel = require('babelify');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const browserSync = require('browser-sync');
const reload = browserSync.reload;
const notify = require('gulp-notify');
const sass = require('gulp-sass');
const plumber = require('gulp-plumber');
const pug = require('pug');
const gulpPug = require('gulp-pug');
const fs = require('fs');
const yaml = require('yaml');

const Vimeo = require('./tasks/vimeo');
const swiftTOConf2019Album = 6225806;
const communityContentAlbum = 6288370;

const sourceRoot = './Public_src/';
const publicRoot = './Public/';
const videoFolder = publicRoot + 'video/';

const siteConfigFile = fs.readFileSync('./site-config.yml', 'utf8')
const siteConfig = yaml.parse(siteConfigFile)

const headlinesFile = fs.readFileSync('./data/headlines.yml', 'utf8')
siteConfig.headlines = yaml.parse(headlinesFile)

gulp.task('fetchVimeoVideos', () => {

	if (siteConfig.conferenceVideos != undefined) {
		console.log("vimeo videos already fetched");
		return
	}

	const vimeo = new Vimeo();
	return vimeo.getWebsiteVideoDataFromAlbum(swiftTOConf2019Album)
		.then((videos) => {
			siteConfig.conferenceVideos = videos
			return vimeo.getWebsiteVideoDataFromAlbum(communityContentAlbum);
		}).then((videos) => {
			siteConfig.communityVideos = videos
		});
});

gulp.task('copyFonts', () => {
	return gulp.src(sourceRoot + 'fonts/**/**')
		.pipe(gulp.dest(publicRoot + 'fonts'))
});

gulp.task('copyImages', () => {
	return gulp.src(sourceRoot + 'images/**/**')
		.pipe(gulp.dest(publicRoot + 'images'))
});

gulp.task('copyCommon', () => {
	return gulp.src(sourceRoot + 'common/**/**')
		.pipe(gulp.dest(publicRoot + 'common'))
});

gulp.task('copyPluginFrameworks', () => {
	return gulp.src(sourceRoot + 'plugin-frameworks/**/**')
		.pipe(gulp.dest(publicRoot + 'plugin-frameworks'))
});

gulp.task('copyJSLibs', () => {
	return gulp.src([sourceRoot + 'js/**.js', '!' + sourceRoot + 'js/main.js'])
		.pipe(gulp.dest(publicRoot + 'js'))
});

const writeVideosPages = () => {
	if (!fs.existsSync(videoFolder)) {
		console.log("creating video folder");
		fs.mkdirSync(videoFolder);
	} else {
		console.log("video folder exists");
	}
	let allVideos = siteConfig.conferenceVideos.concat(siteConfig.communityVideos);
	allVideos.forEach((video) => {
		const html = pug.renderFile(`${sourceRoot}views/_video.pug`, video);
		const filename = `${videoFolder}${video.id}.html`
		fs.writeFileSync(filename, html);
	});
	fs.writeFileSync(`${publicRoot}videoCache.json`, JSON.stringify(allVideos, null, 2));
};

gulp.task('html', ['fetchVimeoVideos'], () => {
	writeVideosPages();
	return gulp.src(sourceRoot + '/views/**.pug')
		.pipe(plumber())
		.pipe(gulpPug({
			data: siteConfig
		}))
		.pipe(gulp.dest(publicRoot))
});

gulp.task('styles', () => {
	return gulp.src([
		sourceRoot + 'scss/bootstrap/bootstrap.scss',
		sourceRoot + 'scss/bootstrap/animate.scss',
		sourceRoot + 'scss/style.scss'
	])
	.pipe(sass().on('error', sass.logError))
	.pipe(gulp.dest(publicRoot + 'css'))
});

gulp.task('js', () => {
	return browserify(sourceRoot + 'js/main.js', {debug: true})
		.transform('babelify', {
			sourceMaps: true,
			presets: ['env','react']
		})
		.bundle()
		.on('error',notify.onError({
			message: "Error: <%= error.message %>",
			title: 'Error in JS 💀'
		}))
		.pipe(source('main.js'))
		.pipe(buffer())
		.pipe(gulp.dest(publicRoot + 'js'))
		.pipe(reload({stream:true}));
});

gulp.task('bs', () => {
	return browserSync.init({
		server: {
			baseDir: publicRoot
		}
	});
});

gulp.task('default', ['bs', 'build'], () => {
	gulp.watch(sourceRoot + 'views/**.pug', ['html']);
	gulp.watch(sourceRoot + 'js/**/*.js', ['js']);
	gulp.watch(sourceRoot + 'scss/**/*.scss', ['styles']);
	gulp.watch(publicRoot + 'css/style.css', reload);
	gulp.watch(publicRoot + '*.html', reload);
});

gulp.task('copyStatic', ['copyFonts', 'copyImages', 'copyCommon', 'copyPluginFrameworks', 'copyJSLibs']);
gulp.task('build', ['html', 'js', 'styles', 'copyStatic']);