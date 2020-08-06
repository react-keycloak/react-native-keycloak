import type {
  KeycloakClient,
  KeycloakInitOptions,
} from '@react-keycloak/core/lib/types';

import Adapter from './adapter';

import type {
  IKeycloakReactNativeClientConfig,
  KeycloakError,
  KeycloakFlow,
  KeycloakLoginOptions,
  KeycloakLogoutOptions,
  KeycloakProfile,
  KeycloakRegisterOptions,
  KeycloakResourceAccess,
  KeycloakResponseMode,
  KeycloakResponseType,
  KeycloakRoles,
  KeycloakTokenParsed,
} from './types';

import { validateInitOptions, decodeToken } from './utils';

class KeycloakReactNativeClient implements KeycloakClient {
  timeLocal = new Date().getTime();

  private clientConfig: IKeycloakReactNativeClientConfig;

  /**
   * Is true if the user is authenticated, false otherwise.
   */
  public authenticated?: boolean;

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
  private loginRequired?: boolean;

  /**
   * @private Undocumented.
   */
  private authServerUrl?: string;

  /**
   * @private Undocumented.
   */
  private realm?: string;

  /**
   * @private Undocumented.
   */
  private clientId?: string;

  /**
   * @private Undocumented.
   */
  private clientSecret?: string;

  /**
   * @private Undocumented.
   */
  private redirectUri?: string;

  /**
   * @private Undocumented.
   */
  private sessionId?: string;

  /**
   * @private Undocumented.
   */
  private profile?: KeycloakProfile;

  /**
   * @private Undocumented.
   */
  private userInfo?: {}; // KeycloakUserInfo;

  /**
   * @private Undocumented.
   */
  private enableLogging?: boolean;

  /**
   * @private Undocumented.
   */
  private tokenTimeoutHandle?: NodeJS.Timeout | null;

  private adapter: Adapter | undefined;

  private logInfo = this.createLogger(console.info);

  private logWarn = this.createLogger(console.warn);

  constructor(clientConfig: IKeycloakReactNativeClientConfig) {
    this.clientConfig = clientConfig;
  }
  /**
   * Called to initialize the adapter.
   * @param initOptions Initialization options.
   * @returns A promise to set functions to be invoked on success or error.
   */
  public async init(initOptions: KeycloakInitOptions): Promise<boolean> {
    this.authenticated = false;

    this.adapter = new Adapter(
      this.clientConfig,
      validateInitOptions(initOptions)
    );

    // TODO - Port this:
    // var initPromise = createPromise();
    // initPromise.promise.then(function() {
    //     kc.onReady && kc.onReady(kc.authenticated);
    //     promise.setSuccess(kc.authenticated);
    // }).catch(function(errorData) {
    //     promise.setError(errorData);
    // });

    let initPromise;
    switch (initOptions.onLoad) {
      // case 'check-sso':
      //     if (loginIframe.enable) {
      //         setupCheckLoginIframe().then(function() {
      //             checkLoginIframe().then(function (unchanged) {
      //                 if (!unchanged) {
      //                     kc.silentCheckSsoRedirectUri ? checkSsoSilently() : doLogin(false);
      //                 } else {
      //                     initPromise.setSuccess();
      //                 }
      //             }).catch(function () {
      //                 initPromise.setError();
      //             });
      //         });
      //     } else {
      //         kc.silentCheckSsoRedirectUri ? checkSsoSilently() : doLogin(false);
      //     }
      //     break;

      case 'login-required':
        initPromise = this.doLogin(initOptions, true);
        break;

      default:
        throw 'Invalid value for onLoad';
    }

    return initPromise.then(() => {
      this.onReady && this.onReady(this.authenticated);
      return this.authenticated;
    });
  }

  /**
   * Redirects to login form.
   * @param options Login options.
   */
  public async login(options?: KeycloakLoginOptions): Promise<void> {
    return this.adapter!.login(options);
  }

  /**
   * Redirects to logout.
   * @param options Logout options.
   */
  public async logout(options?: KeycloakLogoutOptions): Promise<void> {}

  /**
   * Redirects to registration form.
   * @param options The options used for the registration.
   */
  public async register(options?: KeycloakRegisterOptions): Promise<void> {}

  /**
   * Redirects to the Account Management Console.
   */
  public async accountManagement(): Promise<void> {}

  /**
   * Returns the URL to login form.
   * @param options Supports same options as Keycloak#login.
   */
  public createLoginUrl(options?: KeycloakLoginOptions): string {}

  /**
   * Returns the URL to logout the user.
   * @param options Logout options.
   */
  public createLogoutUrl(options?: KeycloakLogoutOptions): string {}

  /**
   * Returns the URL to registration page.
   * @param options The options used for creating the registration URL.
   */
  public createRegisterUrl(options?: KeycloakRegisterOptions): string {}

  /**
   * Returns the URL to the Account Management Console.
   */
  public createAccountUrl(): string {}

  /**
   * Returns true if the token has less than `minValidity` seconds left before
   * it expires.
   * @param minValidity If not specified, `0` is used.
   */
  public isTokenExpired(minValidity?: number): boolean {
    if (!this.tokenParsed || (!this.refreshToken && this.flow !== 'implicit')) {
      throw 'Not authenticated';
    }

    if (this.timeSkew == null) {
      this.logInfo(
        '[KEYCLOAK] Unable to determine if token is expired as timeskew is not set'
      );
      return true;
    }

    let expiresIn =
      (this.tokenParsed?.exp ?? 0) -
      Math.ceil(new Date().getTime() / 1000) +
      this.timeSkew;

    if (minValidity) {
      if (isNaN(minValidity)) {
        throw 'Invalid minValidity';
      }

      expiresIn -= minValidity;
    }

    return expiresIn < 0;
  }

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
  public async updateToken(minValidity: number): Promise<boolean> {
    return Promise.reject();
  }

  /**
   * Clears authentication state, including tokens. This can be useful if
   * the application has detected the session was expired, for example if
   * updating token fails. Invoking this results in Keycloak#onAuthLogout
   * callback listener being invoked.
   */
  public clearToken(): void {
    if (this.token) {
      this.setToken(null, null, null);

      this.onAuthLogout && this.onAuthLogout();

      if (this.loginRequired) {
        this.login();
      }
    }
  }

  /**
   * Returns true if the token has the given realm role.
   * @param role A realm role name.
   */
  public hasRealmRole(role: string): boolean {
    return !!this.realmAccess && this.realmAccess.roles?.indexOf(role) >= 0;
  }

  /**
   * Returns true if the token has the given role for the resource.
   * @param role A role name.
   * @param resource If not specified, `clientId` is used.
   */
  public hasResourceRole(role: string, resource?: string): boolean {
    if (!this.resourceAccess) {
      return false;
    }

    const access = this.resourceAccess[resource || this.clientId || ''];
    return !!access && access.roles.indexOf(role) >= 0;
  }

  /**
   * Loads the user's profile.
   * @returns A promise to set functions to be invoked on success or error.
   */
  public async loadUserProfile(): Promise<KeycloakProfile> {
    const userProfile = await this.adapter!.loadUserProfile(this.token!);

    this.profile = userProfile;

    return this.profile!;
  }

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
   * @private Undocumented.
   */
  private loadUserInfo(): Promise<{}> {
    return Promise.reject('Not implemented');
  }

  private async doLogin(initOptions: KeycloakInitOptions, prompt?: boolean) {
    const options = {
      ...initOptions,
    };

    if (!prompt) {
      options.prompt = 'none';
    }

    return this.login(options);
  }

  private setToken(
    token: string | null,
    refreshToken: string | null,
    idToken: string | null,
    timeLocal?: number
  ) {
    if (this.tokenTimeoutHandle) {
      clearTimeout(this.tokenTimeoutHandle);
      this.tokenTimeoutHandle = null;
    }

    if (refreshToken) {
      this.refreshToken = refreshToken;
      this.refreshTokenParsed = decodeToken(refreshToken);
    } else {
      delete this.refreshToken;
      delete this.refreshTokenParsed;
    }

    if (idToken) {
      this.idToken = idToken;
      this.idTokenParsed = decodeToken(idToken);
    } else {
      delete this.idToken;
      delete this.idTokenParsed;
    }

    if (token) {
      this.token = token;
      this.tokenParsed = decodeToken(token);
      if (!this.tokenParsed) {
        throw new Error('Invalid tokenParsed');
      }

      this.sessionId = this.tokenParsed.session_state;
      this.authenticated = true;
      this.subject = this.tokenParsed.sub;
      this.realmAccess = this.tokenParsed.realm_access;
      this.resourceAccess = this.tokenParsed.resource_access;

      if (timeLocal) {
        this.timeSkew =
          Math.floor(timeLocal / 1000) - (this.tokenParsed.iat ?? 0);
      }

      if (this.timeSkew != null) {
        this.logInfo(
          `[KEYCLOAK] Estimated time difference between browser and server is ${this.timeSkew} seconds`
        );

        if (this.onTokenExpired) {
          const expiresIn =
            ((this.tokenParsed.exp ?? 0) -
              new Date().getTime() / 1000 +
              this.timeSkew) *
            1000;

          this.logInfo(
            `[KEYCLOAK] Token expires in ${Math.round(expiresIn / 1000)} s`
          );

          if (expiresIn <= 0) {
            this.onTokenExpired();
          } else {
            this.tokenTimeoutHandle = setTimeout(
              this.onTokenExpired,
              expiresIn
            );
          }
        }
      }
    } else {
      delete this.token;
      delete this.tokenParsed;
      delete this.subject;
      delete this.realmAccess;
      delete this.resourceAccess;

      this.authenticated = false;
    }
  }

  private createLogger(fn: (...optionalParams: any[]) => void): Function {
    return () => {
      if (this.enableLogging) {
        fn.apply(console, Array.prototype.slice.call(arguments));
      }
    };
  }
}

export default KeycloakReactNativeClient;
