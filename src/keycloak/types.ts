export interface IKeycloakReactNativeClientConfig {
  /**
   * URL to the Keycloak server, for example: http://keycloak-server/auth
   */
  url?: string;
  /**
   * Name of the realm, for example: 'myrealm'
   */
  realm: string;
  /**
   * Client identifier, example: 'myapp'
   */
  clientId: string;
}

export type KeycloakOnLoad = 'login-required' | 'check-sso';
export type KeycloakResponseMode = 'query' | 'fragment';
export type KeycloakResponseType =
  | 'code'
  | 'id_token token'
  | 'code id_token token';
export type KeycloakFlow = 'standard' | 'implicit' | 'hybrid';
export type KeycloakPkceMethod = 'S256';

export type CallbackStorage = {};
