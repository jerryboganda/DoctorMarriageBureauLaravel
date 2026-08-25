import * as ReactNativeWeb from 'react-native-web';

export * from 'react-native-web';
export default ReactNativeWeb;

export const TurboModuleRegistry = {
    get: () => null,
    getEnforcing: () => ({}),
};
