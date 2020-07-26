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

  redirectUri?: string;
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

export type CallbackState = {
  state: string;

  nonce: string;

  pkceCodeVerifier?: string;

  prompt?: string;

  redirectUri?: string;
};

export type ClientOptions = {
  action: string;

  scope?: string;

  responseMode: string;

  responseType: string;

  nonce?: string;

  prompt?: string;

  maxAge?: string;

  loginHint?: string;

  idpHint?: string;

  locale?: string;

  pkceChallenge?: string;

  pkceMethod?: KeycloakPkceMethod;

  redirectUri?: string;
};
