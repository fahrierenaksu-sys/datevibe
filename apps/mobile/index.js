import { registerRootComponent } from 'expo';
import App from './App';

if (typeof globalThis.DOMException === 'undefined') {
  globalThis.DOMException = class DOMException extends Error {
    constructor(message = '', name = 'Error') {
      super(message);
      this.name = name;
    }
  };
}

const { registerGlobals } = require('@livekit/react-native');

registerGlobals();
registerRootComponent(App);
