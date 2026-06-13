import './src/polyfills'; // ← must be first
import { registerRootComponent } from 'expo';
import App from './src/navigation/AppNavigator';

registerRootComponent(App);

