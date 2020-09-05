import { createAuthContext } from '@react-keycloak/core';

import type RNKeycloakInstance from './keycloak/client';

export const reactNativeKeycloakContext = createAuthContext<
  RNKeycloakInstance
>();

export const reactNativeKeycloakContextConsumer =
  reactNativeKeycloakContext.Consumer;
