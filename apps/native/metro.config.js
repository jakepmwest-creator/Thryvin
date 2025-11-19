const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Simplified config - only watch this project's files
// Removed monorepo support to reduce file watchers
config.watchFolders = [projectRoot];

// Resolve packages from local node_modules only
config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [
    path.resolve(projectRoot, 'node_modules'),
  ],
  // Fix Metro package exports issue with Expo SDK 54
  // This resolves ERR_PACKAGE_PATH_NOT_EXPORTED errors
  unstable_enablePackageExports: false,
};

module.exports = config;
