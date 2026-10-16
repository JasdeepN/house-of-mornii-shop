// Preload script: set CHOKIDAR_USEPOLLING before chokidar initializes.
// On WSL/Windows-mounted filesystems, fs.watch throws EISDIR when watching
// the project root directory. Setting this env var forces chokidar to use
// polling instead of native fs.watch, avoiding the crash.
process.env.CHOKIDAR_USEPOLLING = process.env.CHOKIDAR_USEPOLLING ?? 'true'
