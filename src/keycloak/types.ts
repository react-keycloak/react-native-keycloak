import type { InAppBrowserOptions } from 'react-native-inappbrowser-reborn';

export interface OIDCProviderConfig {
  [key: string]: unknown;
}

export interface KeycloakConfig {
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
  /**
   * OIDC-specific configuration parameters
   */
  oidcProvider?: string | OIDCProviderConfig;
}

export type KeycloakOnLoad = 'login-required';

export type KeycloakResponseMode = 'query' | 'fragment';

export type KeycloakResponseType =
  | 'code'
  | 'id_token token'
  | 'code id_token token';

export type KeycloakFlow = 'standard' | 'implicit' | 'hybrid';

export type KeycloakPkceMethod = 'S256';

export type CallbackState = {
  state: string;

  nonce: string;

  pkceCodeVerifier?: string;

  prompt?: string;

  redirectUri?: string;

  /**
   * @private Internal use only
   */
  expires?: number;
};

export interface CallbackStorage {
  get: (state: CallbackState) => CallbackState | undefined;

  add: (state: CallbackState) => void;
}

export interface IKeycloakReactNativeClientConfig extends KeycloakConfig {
  inAppBrowserOptions?: InAppBrowserOptions;
}

export interface KeycloakInitOptions {
  /**
   * Adds a [cryptographic nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce)
   * to verify that the authentication response matches the request.
   * @default true
   */
  useNonce?: boolean;

  /**
   *
   * Allow usage of different types of adapters or a custom adapter to make Keycloak work in different environments.
   *
   * The following options are supported:
   * - `default` - Use default APIs that are available in browsers.
   * - `cordova` - Use a WebView in Cordova.
   * - `cordova-native` - Use Cordova native APIs, this is recommended over `cordova`.
   *
   * It's also possible to pass in a custom adapter for the environment you are running Keycloak in. In order to do so extend the `KeycloakAdapter` interface and implement the methods that are defined there.
   *
   * For example:
   *
   * ```ts
   * import Keycloak, { KeycloakAdapter } from 'keycloak-js';
   *
   * // Implement the 'KeycloakAdapter' interface so that all required methods are guaranteed to be present.
   * const MyCustomAdapter: KeycloakAdapter = {
   * 	login(options) {
   * 		// Write your own implementation here.
   * 	}
   *
   * 	// The other methods go here...
   * };
   *
   * const keycloak = new Keycloak();
   *
   * keycloak.init({
   * 	adapter: MyCustomAdapter,
   * });
   * ```
   */
  adapter?: 'default' | 'cordova' | 'cordova-native' | KeycloakAdapter;

  /**
   * Specifies an action to do on load.
   */
  onLoad?: KeycloakOnLoad;

  /**
   * Set an initial value for the token.
   */
  token?: string;

  /**
   * Set an initial value for the refresh token.
   */
  refreshToken?: string;

  /**
   * Set an initial value for the id token (only together with `token` or
   * `refreshToken`).
   */
  idToken?: string;

  /**
   * Set an initial value for skew between local time and Keycloak server in
   * seconds (only together with `token` or `refreshToken`).
   */
  timeSkew?: number;

  /**
   * Set to enable/disable monitoring login state.
   * @default true
   */
  checkLoginIframe?: boolean;

  /**
   * Set the interval to check login state (in seconds).
   * @default 5
   */
  checkLoginIframeInterval?: number;

  /**
   * Set the OpenID Connect response mode to send to Keycloak upon login.
   * @default fragment After successful authentication Keycloak will redirect
   *                   to JavaScript application with OpenID Connect parameters
   *                   added in URL fragment. This is generally safer and
   *                   recommended over query.
   */
  responseMode?: KeycloakResponseMode;

  /**
   * Specifies a default uri to redirect to after login or logout.
   * This is currently supported for adapter 'cordova-native' and 'default'
   */
  redirectUri?: string;

  /**
   * Specifies an uri to redirect to after silent check-sso.
   * Silent check-sso will only happen, when this redirect uri is given and
   * the specified uri is available whithin the application.
   */
  silentCheckSsoRedirectUri?: string;

  /**
   * Specifies whether the silent check-sso should fallback to "non-silent"
   * check-sso when 3rd party cookies are blocked by the browser. Defaults
   * to true.
   */
  silentCheckSsoFallback?: boolean;

  /**
   * Set the OpenID Connect flow.
   * @default standard
   */
  flow?: KeycloakFlow;

  /**
   * Configures the Proof Key for Code Exchange (PKCE) method to use.
   * The currently allowed method is 'S256'.
   * If not configured, PKCE will not be used.
   */
  pkceMethod?: KeycloakPkceMethod;

  /**
   * Enables logging messages from Keycloak to the console.
   * @default false
   */
  enableLogging?: boolean;
}

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

export interface KeycloakJSON {
  realm?: string;
  resource?: string;
}

export interface OAuthResponse {
  valid: boolean;

  code?: string;

  error?: string;

  prompt?: string;

  kc_action_status?: 'success' | 'cancelled' | 'error';

  error_description?: string;

  access_token?: string;

  id_token?: string;

  pkceCodeVerifier?: string;

  redirectUri?: string;

  refresh_token?: string;

  storedNonce?: string;
}

/**
 * A client for the Keycloak authentication server.
 * @see {@link https://keycloak.gitbooks.io/securing-client-applications-guide/content/topics/oidc/javascript-adapter.html|Keycloak JS adapter documentation}
 */
export interface KeycloakInstance {
  /**
   * Is true if the user is authenticated, false otherwise.
   */
  authenticated?: boolean;

  /**
   * The user id.
   */
  subject?: string;

  /**
   * Response mode passed in init (default value is `'fragment'`).
   */
  responseMode?: KeycloakResponseMode;

  /**
   * Response type sent to Keycloak with login requests. This is determined
   * based on the flow value used during initialization, but can be overridden
   * by setting this value.
   */
  responseType?: KeycloakResponseType;

  /**
   * Flow passed in init.
   */
  flow?: KeycloakFlow;

  /**
   * The realm roles associated with the token.
   */
  realmAccess?: KeycloakRoles;

  /**
   * The resource roles associated with the token.
   */
  resourceAccess?: KeycloakResourceAccess;

  /**
   * The base64 encoded token that can be sent in the Authorization header in
   * requests to services.
   */
  token?: string;

  /**
   * The parsed token as a JavaScript object.
   */
  tokenParsed?: KeycloakTokenParsed;

  /**
   * The base64 encoded refresh token that can be used to retrieve a new token.
   */
  refreshToken?: string;

  /**
   * The parsed refresh token as a JavaScript object.
   */
  refreshTokenParsed?: KeycloakTokenParsed;

  /**
   * The base64 encoded ID token.
   */
  idToken?: string;

  /**
   * The parsed id token as a JavaScript object.
   */
  idTokenParsed?: KeycloakTokenParsed;

  /**
   * The estimated time difference between the browser time and the Keycloak
   * server in seconds. This value is just an estimation, but is accurate
   * enough when determining if a token is expired or not.
   */
  timeSkew?: number;

  /**
   * @private Undocumented.
   */
  loginRequired?: boolean;

  /**
   * @private Undocumented.
   */
  authServerUrl?: string;

  /**
   * @private Undocumented.
   */
  realm?: string;

  /**
   * @private Undocumented.
   */
  clientId?: string;

  /**
   * @private Undocumented.
   */
  clientSecret?: string;

  /**
   * @private Undocumented.
   */
  redirectUri?: string;

  /**
   * @private Undocumented.
   */
  sessionId?: string;

  /**
   * @private Undocumented.
   */
  profile?: KeycloakProfile;

  /**
   * @private Undocumented.
   */
  userInfo?: {}; // KeycloakUserInfo;

  /**
   * @private Undocumented.
   */
  endpoints?: KeycloakEndpoints;

  /**
   * Called when the adapter is initialized.
   */
  onReady?(authenticated?: boolean): void;

  /**
   * Called when a user is successfully authenticated.
   */
  onAuthSuccess?(): void;

  /**
   * Called if there was an error during authentication.
   */
  onAuthError?(errorData: KeycloakError): void;

  /**
   * Called when the token is refreshed.
   */
  onAuthRefreshSuccess?(): void;

  /**
   * Called if there was an error while trying to refresh the token.
   */
  onAuthRefreshError?(): void;

  /**
   * Called if the user is logged out (will only be called if the session
   * status iframe is enabled, or in Cordova mode).
   */
  onAuthLogout?(): void;

  /**
   * Called when the access token is expired. If a refresh token is available
   * the token can be refreshed with Keycloak#updateToken, or in cases where
   * it's not (ie. with implicit flow) you can redirect to login screen to
   * obtain a new access token.
   */
  onTokenExpired?(): void;

  /**
   * Called when a AIA has been requested by the application.
   */
  onActionUpdate?(status: 'success' | 'cancelled' | 'error'): void;

  /**
   * Called to initialize the adapter.
   * @param initOptions Initialization options.
   * @returns A promise to set functions to be invoked on success or error.
   */
  init(initOptions: KeycloakInitOptions): Promise<boolean>;

  /**
   * Redirects to login form.
   * @param options Login options.
   */
  login(options?: KeycloakLoginOptions): Promise<void>;

  /**
   * Redirects to logout.
   * @param options Logout options.
   */
  logout(options?: KeycloakLogoutOptions): Promise<void>;

  /**
   * Redirects to registration form.
   * @param options The options used for the registration.
   */
  register(options?: KeycloakRegisterOptions): Promise<void>;

  /**
   * Redirects to the Account Management Console.
   */
  accountManagement(): Promise<void>;

  /**
   * Returns the URL to login form.
   * @param options Supports same options as Keycloak#login.
   */
  createLoginUrl(options?: KeycloakLoginOptions): string;

  /**
   * Returns the URL to logout the user.
   * @param options Logout options.
   */
  createLogoutUrl(options?: KeycloakLogoutOptions): string;

  /**
   * Returns the URL to registration page.
   * @param options The options used for creating the registration URL.
   */
  createRegisterUrl(options?: KeycloakRegisterOptions): string;

  /**
   * Returns the URL to the Account Management Console.
   */
  createAccountUrl(): string;

  /**
   * Returns true if the token has less than `minValidity` seconds left before
   * it expires.
   * @param minValidity If not specified, `0` is used.
   */
  isTokenExpired(minValidity?: number): boolean;

  /**
   * If the token expires within `minValidity` seconds, the token is refreshed.
   * If the session status iframe is enabled, the session status is also
   * checked.
   * @returns A promise to set functions that can be invoked if the token is
   *          still valid, or if the token is no longer valid.
   * @example
   * ```js
   * keycloak.updateToken(5).success(function(refreshed) {
   *   if (refreshed) {
   *     alert('Token was successfully refreshed');
   *   } else {
   *     alert('Token is still valid');
   *   }
   * }).error(function() {
   *   alert('Failed to refresh the token, or the session has expired');
   * });
   */
  updateToken(minValidity: number): Promise<boolean>;

  /**
   * Clears authentication state, including tokens. This can be useful if
   * the application has detected the session was expired, for example if
   * updating token fails. Invoking this results in Keycloak#onAuthLogout
   * callback listener being invoked.
   */
  clearToken(): void;

  /**
   * Returns true if the token has the given realm role.
   * @param role A realm role name.
   */
  hasRealmRole(role: string): boolean;

  /**
   * Returns true if the token has the given role for the resource.
   * @param role A role name.
   * @param resource If not specified, `clientId` is used.
   */
  hasResourceRole(role: string, resource?: string): boolean;

  /**
   * Loads the user's profile.
   * @returns A promise to set functions to be invoked on success or error.
   */
  loadUserProfile(): Promise<KeycloakProfile>;

  /**
   * @private Undocumented.
   */
  loadUserInfo(): Promise<{}>;

  /**
   * @private Undocumented.
   */
  processCallback(oauth: OAuthResponse): Promise<void>;

  /**
   * @private Undocumented.
   */
  parseCallback(url: string): OAuthResponse;
}
