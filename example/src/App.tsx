import * as React from 'react';
import { StyleSheet, View, Text } from 'react-native';

import { RNKeycloak, ReactNativeKeycloakProvider } from 'react-native-keycloak';

const keycloak = new RNKeycloak({
  url: 'http://keycloak-server/auth',
  realm: 'kc-realm',
  clientId: 'web',
});

export default function App() {
  return (
    <ReactNativeKeycloakProvider
      authClient={keycloak}
      initOptions={{
        onLoad: 'login-required',
      }}
    >
      <View style={styles.container}>
        <Text>Welcome!</Text>
      </View>
    </ReactNativeKeycloakProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
