// Mobile app entry point - React Native version
import { AppRegistry } from 'react-native';
import MobileApp from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => MobileApp);