import InAppBrowser from 'react-native-inappbrowser-reborn';
import type { InAppBrowserOptions } from 'react-native-inappbrowser-reborn';
import {
  createUUID,
  generateCodeVerifier,
  generatePkceChallenge,
} from 'src/utils/uuid';

import type {
  CallbackState,
  ClientInitOptions,
  IKeycloakReactNativeClientConfig,
  KeycloakAdapter,
  KeycloakLoginOptions,
  KeycloakLogoutOptions,
  KeycloakRegisterOptions,
  KeycloakEndpoints,
  KeycloakProfile,
} from './types';
import {
  createAccountUrl,
  createLoginUrl,
  createLogoutUrl,
  setupOidcEndoints,
  createRegisterUrl,
  parseCallback,
  getRealmUrl,
} from './utils';

class Adapter implements KeycloakAdapter {
  private kcOptions: IKeycloakReactNativeClientConfig;

  private clientOptions: ClientInitOptions;

  private oidcConfig?: { [key: string]: any };

  private inAppBrowserOptions?: InAppBrowserOptions;

  private endpoints: KeycloakEndpoints;

  constructor(
    keycloakOptions: IKeycloakReactNativeClientConfig,
    clientOptions: ClientInitOptions,
    inAppBrowserOptions?: InAppBrowserOptions,
    oidcConfiguration?: { [key: string]: any }
  ) {
    this.kcOptions = keycloakOptions;
    this.clientOptions = clientOptions;
    this.inAppBrowserOptions = inAppBrowserOptions;
    this.oidcConfig = oidcConfiguration;

    this.endpoints = setupOidcEndoints({
      realm: this.kcOptions.realm,
      authServerUrl: this.kcOptions.url,
      oidcConfiguration: this.oidcConfig,
    });
  }

  public async login(options: KeycloakLoginOptions) {
    const [loginURL, callbackState] = createLoginUrl(
      this,
      this.endpoints,
      this.kcOptions,
      this.clientOptions,
      options
    );

    if (await InAppBrowser.isAvailable()) {
      // See for more details https://github.com/proyecto26/react-native-inappbrowser#authentication-flow-using-deep-linking
      const res = await InAppBrowser.openAuth(
        loginURL,
        options.redirectUri,
        this.inAppBrowserOptions
      );
      if (res.type === 'success' && res.url) {
        parseCallback({
          url: res.url,
          oauthState: callbackState,
          clientOptions: this.clientOptions,
        });
      }

      throw new Error('Authentication flow failed');
    } else {
      throw new Error('InAppBrowser not available');
      // TODO: maybe!
      //   Linking.openURL(loginURL);
    }
  }

  public async logout(options: KeycloakLogoutOptions) {
    const endpoint = this.endpoints.logout();
    const redirectUri = this.redirectUri(options.redirectUri);
    const logoutUrl = createLogoutUrl({ endpoint, redirectUri });

    const data = new FormData();
    data.append('client_id', this.kcOptions.clientId);
    data.append('refresh_token', refreshToken);

    await fetch(logoutUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: data,
    });
  }

  public async register(options: KeycloakRegisterOptions) {
    const state = createUUID();
    const nonce = createUUID();
    const redirectUri = this.redirectUri(options.redirectUri, undefined);
    const endpoint = this.endpoints.register();

    let codeVerifier;
    let pkceChallenge;
    if (this.clientOptions.pkceMethod) {
      codeVerifier = generateCodeVerifier(96);
      pkceChallenge = generatePkceChallenge(
        this.clientOptions.pkceMethod,
        codeVerifier
      );
    }

    const callbackState: CallbackState = {
      state,
      nonce,
      pkceCodeVerifier: codeVerifier,
      prompt: this.clientOptions?.prompt ?? undefined,
      redirectUri: redirectUri ? encodeURIComponent(redirectUri) : undefined,
    };

    const registerUrl = createRegisterUrl({
      action: 'register',
      endpoint,
      scope: this.clientOptions.scope,
      clientId: this.kcOptions.clientId,
      state,
      responseMode: this.clientOptions.responseMode,
      responseType: this.clientOptions.responseType,
      nonce,
      prompt: this.clientOptions.prompt,
      maxAge: this.clientOptions.maxAge,
      loginHint: this.clientOptions.loginHint,
      idpHint: this.clientOptions.idpHint,
      locale: this.clientOptions.locale,
      pkceChallenge,
      pkceMethod: this.clientOptions.pkceMethod,
      redirectUri,
    });

    if (await InAppBrowser.isAvailable()) {
      // See for more details https://github.com/proyecto26/react-native-inappbrowser#authentication-flow-using-deep-linking
      const res = await InAppBrowser.openAuth(
        registerUrl,
        redirectUri,
        this.inAppBrowserOptions
      );

      // TODO: Handle res!
      if (res.type === 'success' && res.url) {
        parseCallback({
          url: res.url,
          oauthState: callbackState,
          clientOptions: this.clientOptions,
        });
      }

      throw new Error('Authentication flow failed');
    } else {
      throw new Error('Error. InAppBrowser not available');
      // TODO: maybe!
      //   Linking.openURL(loginURL);
    }
  }

  public async accountManagement() {
    const redirectUri = this.redirectUri(options);
    const accountUrl = createAccountUrl({
      clientConfig: this.kcOptions,
      redirectUri,
    });

    if (typeof accountUrl !== 'undefined') {
      await InAppBrowser.open(accountUrl, this.inAppBrowserOptions);
    } else {
      throw 'Not supported by the OIDC server';
    }
  }

  public redirectUri(options?: { redirectUri?: string }): string {
    if (options && options.redirectUri) {
      return options.redirectUri;
    } else if (this.kcOptions.redirectUri) {
      return this.kcOptions.redirectUri;
    }
    return ''; // TODO: Get main DeepLink redirect for app
  }

  public async loadUserProfile(token: string): Promise<KeycloakProfile> {
    const { realm, url } = this.kcOptions;
    const profileUrl = getRealmUrl(realm, url) + '/account';

    try {
      const response = await fetch(profileUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const responseText = await response.text();

      return JSON.parse(responseText);
    } catch (error) {
      throw error;
    }
  }
}

export default Adapter;
