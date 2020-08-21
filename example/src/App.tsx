import * as React from 'react';

import {
  RNKeycloak,
  ReactNativeKeycloakProvider,
} from '@react-keycloak/native';
import Login from './Login';

const keycloak = new RNKeycloak({
  url: 'http://keycloak-server/auth',
  realm: 'kc-realm',
  clientId: 'web',
});

export default function App() {
  return (
    <ReactNativeKeycloakProvider
      authClient={keycloak}
      initOptions={{ redirectUri: 'myapp://Homepage' }}
    >
      <Login />
    </ReactNativeKeycloakProvider>
  );
}
