import type { KeycloakInitOptions } from '@react-keycloak/keycloak-ts';
import type { InAppBrowserOptions } from 'react-native-inappbrowser-reborn';

export interface RNKeycloakInitOptions extends KeycloakInitOptions {
  inAppBrowserOptions?: InAppBrowserOptions;
}
