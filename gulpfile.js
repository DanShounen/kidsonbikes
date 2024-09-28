const gulp = require('gulp');
const prefix = require('gulp-autoprefixer');
const sass = require('gulp-sass')(require('sass'));
const zip = require('gulp-zip');
const fs = require('fs');

/* ----------------------------------------- */
/*  Export Tasks
/* ----------------------------------------- */

// Compile SCSS and watch for changes
exports.default = gulp.series(
  compileScss,
  watchUpdates
);

// Build system (compile SCSS, update system.json, zip files)
exports.build = gulp.series(
  compileScss,
  ensureOutputDirExists,
  zipRelease
);

// Compile SCSS files and create the package zip
exports.compile = gulp.series(
  compileScss,
  zipRelease
);

/* ----------------------------------------- */
/*  Compile SCSS to CSS
/* ----------------------------------------- */

// Error handler for SCSS compilation
function handleError(err) {
  console.log(err.toString());
  this.emit('end');
}

const SYSTEM_SCSS = ["scss/**/*.scss"];
function compileScss() {
  let options = {
    outputStyle: 'expanded' 
  };
  return gulp.src(SYSTEM_SCSS)
    .pipe(sass(options).on('error', handleError))
    .pipe(prefix({
      cascade: false
    }))
    .pipe(gulp.dest("./css"));
}

/* ----------------------------------------- */
/*  Watch SCSS Files for Changes
/* ----------------------------------------- */
function watchUpdates() {
  gulp.watch(SYSTEM_SCSS, compileScss);
}

/* ----------------------------------------- */
/*  Package the System into a Zip File
/* ----------------------------------------- */
function zipRelease() {
  return gulp.src([
    './**/*',
    '!./node_modules/**',
    '!./.git/**',
    '!./.gitignore',
    '!./gulpfile.js',
    '!./package-lock.json',
    '!./package.json',
    '!./scss/**/*',
    '!./README.md',
    '!./*.zip'
  ], { base: '.' })
  .pipe(zip('kidsonbikes.zip')) 
  .pipe(gulp.dest('.'));
}

/* ----------------------------------------- */
/*  Ensure Output Directory Exists
/* ----------------------------------------- */
function ensureOutputDirExists() {
  const outputDir = './packs';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  return Promise.resolve();
}

/* ----------------------------------------- */
/*  Update system.json           
/* ----------------------------------------- */
function updateSystemJson(done) {
  const manifestPath = 'system.json';
  const manifest = JSON.parse(fs.readFileSync(manifestPath));

 
  manifest.download = "https://github.com/DanShounen/kidsonbikes/archive/main.zip";

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Updated system.json with new download URL.`);
  done();
}
