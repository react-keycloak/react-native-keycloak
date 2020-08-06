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

export type CallbackStorage = {
  nonce?: string;

  pkceCodeVerifier?: string;

  prompt?: string;

  redirectUri?: string;

  state: string;
};

export type CallbackState = {
  state: string;

  nonce: string;

  pkceCodeVerifier?: string;

  prompt?: string;

  redirectUri?: string;
};

export type ClientInitOptions = {
  flow?: KeycloakFlow;

  scope?: string;

  responseType: KeycloakResponseType;

  nonce?: string;

  prompt?: string;

  maxAge?: string;

  loginHint?: string;

  idpHint?: string;

  locale?: string;

  pkceChallenge?: string;

  pkceMethod?: KeycloakPkceMethod;

  redirectUri?: string;

  responseMode: KeycloakResponseMode;
};

export interface KeycloakLoginOptions {
  /**
   * @private Undocumented.
   */
  scope?: string;

  /**
   * Specifies the uri to redirect to after login.
   */
  redirectUri?: string;

  /**
   * By default the login screen is displayed if the user is not logged into
   * Keycloak. To only authenticate to the application if the user is already
   * logged in and not display the login page if the user is not logged in, set
   * this option to `'none'`. To always require re-authentication and ignore
   * SSO, set this option to `'login'`.
   */
  prompt?: 'none' | 'login';

  /**
   * If value is `'register'` then user is redirected to registration page,
   * otherwise to login page.
   */
  action?: string;

  /**
   * Used just if user is already authenticated. Specifies maximum time since
   * the authentication of user happened. If user is already authenticated for
   * longer time than `'maxAge'`, the SSO is ignored and he will need to
   * authenticate again.
   */
  maxAge?: number;

  /**
   * Used to pre-fill the username/email field on the login form.
   */
  loginHint?: string;

  /**
   * Used to tell Keycloak which IDP the user wants to authenticate with.
   */
  idpHint?: string;

  /**
   * Sets the 'ui_locales' query param in compliance with section 3.1.2.1
   * of the OIDC 1.0 specification.
   */
  locale?: string;

  /**
   * Specifies arguments that are passed to the react-native-inappbrowser-reborn (if applicable).
   *
   * @see https://github.com/proyecto26/react-native-inappbrowser#ios-options
   * @see https://github.com/proyecto26/react-native-inappbrowser#android-options
   */
  inAppBrowserOptions?: { [optionName: string]: string };
}

export interface KeycloakLogoutOptions {
  /**
   * Specifies the uri to redirect to after logout.
   */
  redirectUri?: string;
}

export interface KeycloakRegisterOptions
  extends Omit<KeycloakLoginOptions, 'action'> {}

export interface KeycloakAdapter {
  login(options?: KeycloakLoginOptions): Promise<void>;

  logout(options?: KeycloakLogoutOptions): Promise<void>;

  register(options?: KeycloakRegisterOptions): Promise<void>;

  accountManagement(): Promise<void>;

  redirectUri(options?: { redirectUri?: string }, encodeHash?: boolean): string;
}

export interface KeycloakEndpoints {
  [key: string]: () => string;
}

export interface KeycloakProfile {
  id?: string;

  username?: string;

  email?: string;

  firstName?: string;

  lastName?: string;

  enabled?: boolean;

  emailVerified?: boolean;

  totp?: boolean;

  createdTimestamp?: number;
}

export interface KeycloakTokenParsed {
  exp?: number;

  iat?: number;

  nonce?: string;

  sub?: string;

  session_state?: string;

  realm_access?: KeycloakRoles;

  resource_access?: KeycloakResourceAccess;
}

export interface KeycloakResourceAccess {
  [key: string]: KeycloakRoles;
}

export interface KeycloakRoles {
  roles: string[];
}

export interface KeycloakError {
  error: string;
  error_description: string;
}

export interface KeycloakProfile {
  id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled?: boolean;
  emailVerified?: boolean;
  totp?: boolean;
  createdTimestamp?: number;
}
