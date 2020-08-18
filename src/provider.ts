import { createAuthProvider } from '@react-keycloak/core';

import { reactNativeKeycloakContext } from './context';

export const ReactNativeKeycloakProvider = createAuthProvider(
  reactNativeKeycloakContext
);
