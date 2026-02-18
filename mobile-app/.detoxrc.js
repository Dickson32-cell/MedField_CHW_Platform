/** @type {Detox.DetoxConfig} */
module.exports = {
    testRunner: {
        args: {
            '$0': 'jest',
            config: 'e2e/jest.config.js'
        },
        jest: {
            setupTimeout: 120000
        }
    },
    apps: {
        'android.debug': {
            type: 'android.apk',
            binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
            build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
            reversePorts: [
                8081
            ]
        },
        'android.release': {
            type: 'android.apk',
            binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
            build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release'
        },
        'ios.debug': {
            type: 'ios.app',
            binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/MedField.app',
            build: 'xcodebuild -workspace ios/MedField.xcworkspace -scheme MedField -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build'
        },
        'ios.release': {
            type: 'ios.app',
            binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/MedField.app',
            build: 'xcodebuild -workspace ios/MedField.xcworkspace -scheme MedField -configuration Release -sdk iphonesimulator -derivedDataPath ios/build'
        }
    },
    devices: {
        simulator: {
            type: 'ios.simulator',
            device: {
                type: 'iPhone 15'
            }
        },
        emulator: {
            type: 'android.emulator',
            device: {
                avdName: 'Pixel_4_API_31'
            }
        }
    },
    configurations: {
        'ios.sim.debug': {
            device: 'simulator',
            app: 'ios.debug'
        },
        'ios.sim.release': {
            device: 'simulator',
            app: 'ios.release'
        },
        'android.emu.debug': {
            device: 'emulator',
            app: 'android.debug'
        },
        'android.emu.release': {
            device: 'emulator',
            app: 'android.release'
        }
    }
};
