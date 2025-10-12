const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Monorepo support: watch parent directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

config.watchFolders = [workspaceRoot];

// Resolve packages from workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Add shared package to extra node modules
config.resolver.extraNodeModules = {
  '@thryvin/shared': path.resolve(workspaceRoot, 'packages/shared/src'),
};

module.exports = config;
