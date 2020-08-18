import { createAuthContext } from '@react-keycloak/core';

import type { KeycloakInstance } from './keycloak/types';

export const reactNativeKeycloakContext = createAuthContext<KeycloakInstance>();

export const reactNativeKeycloakContextConsumer =
  reactNativeKeycloakContext.Consumer;
