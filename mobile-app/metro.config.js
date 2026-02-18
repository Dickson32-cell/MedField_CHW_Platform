const path = require('path');
const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Polyfills and Shims for Hermes / PouchDB
config.resolver.extraNodeModules = {
    stream: path.resolve(__dirname, 'node_modules/stream-browserify'),
    buffer: path.resolve(__dirname, 'node_modules/buffer'),
    events: path.resolve(__dirname, 'node_modules/events'),
    util: path.resolve(__dirname, 'node_modules/util'),
    path: path.resolve(__dirname, 'node_modules/path-browserify'),
    'blob-to-buffer': path.resolve(__dirname, 'node_modules/blob-to-buffer'),
    'pouchdb-core': path.resolve(__dirname, 'node_modules/pouchdb-core'),
    'pouchdb-adapter-asyncstorage': path.resolve(__dirname, 'node_modules/pouchdb-adapter-asyncstorage'),
    'pouchdb-adapter-http': path.resolve(__dirname, 'node_modules/pouchdb-adapter-http'),
    'pouchdb-utils': path.resolve(__dirname, 'node_modules/pouchdb-utils'),
    'pouchdb-collate': path.resolve(__dirname, 'node_modules/pouchdb-collate'),
    'pouchdb-errors': path.resolve(__dirname, 'node_modules/pouchdb-errors'),
    'pouchdb-selector-core': path.resolve(__dirname, 'node_modules/pouchdb-selector-core'),
    'pouchdb-find': path.resolve(__dirname, 'node_modules/pouchdb-find'),
    'pouchdb-replication': path.resolve(__dirname, 'node_modules/pouchdb-replication'),
};

config.resolver.nodeModulesPaths = [
    path.resolve(__dirname, 'node_modules'),
];

module.exports = config;
