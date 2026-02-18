import 'react-native-gesture-handler';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Polyfill legacy AsyncStorage for older PouchDB adapters
const RN = require('react-native');
try {
    Object.defineProperty(RN, 'AsyncStorage', {
        get: () => AsyncStorage,
        configurable: true,
        enumerable: true
    });
} catch (e) {
    // Already defined or non-configurable, which is fine since we define it on global too
}
if (typeof global !== 'undefined') {
    global.AsyncStorage = AsyncStorage;
}

// Polyfill global.crypto for PouchDB / uuid
if (!global.crypto) {
    global.crypto = {};
}
if (!global.crypto.getRandomValues) {
    global.crypto.getRandomValues = (array) => {
        return Crypto.getRandomValues(array);
    };
}

// Polyfill Buffer
if (typeof global.Buffer === 'undefined') {
    global.Buffer = require('buffer').Buffer;
}

// Minimal process polyfill - do not require('process')
if (typeof global.process === 'undefined') {
    global.process = {};
}
if (!global.process.nextTick) {
    global.process.nextTick = setImmediate;
}
if (!global.process.env) {
    global.process.env = {};
}

// REGISTER ROOT
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
