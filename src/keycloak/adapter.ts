import InAppBrowser from 'react-native-inappbrowser-reborn';
import type { InAppBrowserOptions } from 'react-native-inappbrowser-reborn';
import {
  createUUID,
  generateCodeVerifier,
  generatePkceChallenge,
} from 'src/utils/uuid';

import type {
  CallbackState,
  ClientOptions,
  IKeycloakReactNativeClientConfig,
} from './types';
import {
  createAccountUrl,
  createLoginUrl,
  createLogoutUrl,
  setupOidcEndoints,
  createRegisterUrl,
  parseCallback,
} from './utils';

class Adapter {
  private kcOptions: IKeycloakReactNativeClientConfig;

  private clientOptions: ClientOptions;

  private oidcConfig?: { [key: string]: any };

  private inAppBrowserOptions?: InAppBrowserOptions;

  private endpoints: { [key: string]: () => string };

  constructor(
    keycloakOptions: IKeycloakReactNativeClientConfig,
    clientOptions: ClientOptions,
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

  public async login() {
    const state = createUUID();
    const nonce = createUUID();
    const redirectUri = this.redirectURI(this.clientOptions, this.kcOptions);
    const endpoint = this.endpoints.authorize();

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

    const loginURL = createLoginUrl({
      action: 'authorize',
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
        loginURL,
        redirectUri,
        this.inAppBrowserOptions
      );
      if (res.type === 'success' && res.url) {
        return parseCallback({
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

  public logout({
    refreshToken,
    accessToken,
  }: {
    accessToken: string;
    refreshToken: string;
  }) {
    const endpoint = this.endpoints.logout();
    const redirectUri = this.redirectURI(this.clientOptions, this.kcOptions);
    const logoutUrl = createLogoutUrl({ endpoint, redirectUri });

    const data = new FormData();
    data.append('client_id', this.kcOptions.clientId);
    data.append('refresh_token', refreshToken);

    return fetch(logoutUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: data,
    });
  }

  public async register() {
    const state = createUUID();
    const nonce = createUUID();
    const redirectUri = this.redirectURI(this.clientOptions, this.kcOptions);
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
        return parseCallback({
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

  public accountManagement() {
    const redirectUri = this.redirectURI(this.clientOptions, this.kcOptions);
    const accountUrl = createAccountUrl({
      clientConfig: this.kcOptions,
      redirectUri,
    });

    if (typeof accountUrl !== 'undefined') {
      InAppBrowser.open(accountUrl, this.inAppBrowserOptions);
    } else {
      throw 'Not supported by the OIDC server';
    }
  }

  public redirectURI(
    options: ClientOptions,
    kcOptions: IKeycloakReactNativeClientConfig
  ): string {
    if (options && options.redirectUri) {
      return options.redirectUri;
    } else if (kcOptions.redirectUri) {
      return kcOptions.redirectUri;
    }
    return ''; // TODO: Get main DeepLink redirect for app
  }
}

export default Adapter;
