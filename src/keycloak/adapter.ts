import type {
  CallbackStorage,
  FetchTokenResponse,
  KeycloakAdapter,
  KeycloakConfig,
  KeycloakInstance,
  KeycloakJSON,
  KeycloakLoginOptions,
  KeycloakLogoutOptions,
  KeycloakProfile,
  KeycloakRegisterOptions,
  OIDCProviderConfig,
} from '@react-keycloak/keycloak-ts';
import InAppBrowser from 'react-native-inappbrowser-reborn';

import LocalStorage from './storage';
import type { RNKeycloakInitOptions } from './types';
import { fetchJSON } from './utils';

class RNAdapter implements KeycloakAdapter {
  private readonly client: Readonly<KeycloakInstance>;

  private readonly initOptions: Readonly<RNKeycloakInitOptions>;

  constructor(
    client: Readonly<KeycloakInstance>,
    _keycloakConfig: Readonly<KeycloakConfig>,
    initOptions: Readonly<RNKeycloakInitOptions>
  ) {
    this.client = client;
    this.initOptions = initOptions;
  }

  createCallbackStorage(): CallbackStorage {
    return new LocalStorage();
  }

  /**
   * Start login process
   *
   * @param {KeycloakLoginOptions} options Login options
   */
  async login(options?: KeycloakLoginOptions): Promise<void> {
    const loginUrl = this.client.createLoginUrl(options);

    if (await InAppBrowser.isAvailable()) {
      // See for more details https://github.com/proyecto26/react-native-inappbrowser#authentication-flow-using-deep-linking
      const res = await InAppBrowser.openAuth(
        loginUrl,
        this.client.redirectUri!,
        this.initOptions.inAppBrowserOptions
      );

      if (res.type === 'success' && res.url) {
        const oauth = this.client.parseCallback(res.url);
        return this.client.processCallback(oauth);
      }

      throw new Error('Authentication flow failed');
    } else {
      throw new Error('InAppBrowser not available');
      // TODO: maybe!
      //   Linking.openURL(loginURL);
    }
  }

  async logout(options?: KeycloakLogoutOptions): Promise<void> {
    const logoutUrl = this.client.createLogoutUrl(options);

    if (await InAppBrowser.isAvailable()) {
      // See for more details https://github.com/proyecto26/react-native-inappbrowser#authentication-flow-using-deep-linking
      const res = await InAppBrowser.openAuth(
        logoutUrl,
        this.client.redirectUri!,
        this.initOptions.inAppBrowserOptions
      );

      if (res.type === 'success') {
        return this.client.clearToken();
      }

      throw new Error('Logout flow failed');
    } else {
      throw new Error('InAppBrowser not available');
      // TODO: maybe!
      //   Linking.openURL(logoutUrl);
    }
  }

  async register(options?: KeycloakRegisterOptions) {
    const registerUrl = this.client.createRegisterUrl(options);

    if (await InAppBrowser.isAvailable()) {
      // See for more details https://github.com/proyecto26/react-native-inappbrowser#authentication-flow-using-deep-linking
      const res = await InAppBrowser.openAuth(
        registerUrl,
        this.client.redirectUri!,
        this.initOptions.inAppBrowserOptions
      );

      if (res.type === 'success' && res.url) {
        const oauth = this.client.parseCallback(res.url);
        return this.client.processCallback(oauth);
      }

      throw new Error('Registration flow failed');
    } else {
      throw new Error('InAppBrowser not available');
      // TODO: maybe!
      //   Linking.openURL(registerUrl);
    }
  }

  async accountManagement() {
    const accountUrl = this.client.createAccountUrl();

    if (typeof accountUrl !== 'undefined') {
      await InAppBrowser.open(accountUrl, this.initOptions.inAppBrowserOptions);
    } else {
      throw 'Not supported by the OIDC server';
    }
  }

  async fetchKeycloakConfigJSON(configUrl: string): Promise<KeycloakJSON> {
    return await fetchJSON<KeycloakJSON>(configUrl);
  }

  async fetchOIDCProviderConfigJSON(
    oidcProviderConfigUrl: string
  ): Promise<OIDCProviderConfig> {
    return await fetchJSON<OIDCProviderConfig>(oidcProviderConfigUrl);
  }

  async fetchTokens(
    tokenUrl: string,
    params: string
  ): Promise<FetchTokenResponse> {
    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    return (await tokenRes.json()) as FetchTokenResponse;
  }

  async refreshTokens(
    tokenUrl: string,
    params: string
  ): Promise<FetchTokenResponse> {
    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    return (await tokenRes.json()) as FetchTokenResponse;
  }

  async fetchUserProfile(
    profileUrl: string,
    token: string
  ): Promise<KeycloakProfile> {
    return await fetchJSON<KeycloakProfile>(profileUrl, token);
  }

  async fetchUserInfo(userInfoUrl: string, token: string): Promise<unknown> {
    return await fetchJSON<unknown>(userInfoUrl, token);
  }

  redirectUri(options?: { redirectUri?: string }): string {
    if (options && options.redirectUri) {
      return options.redirectUri;
    }

    if (this.client.redirectUri) {
      return this.client.redirectUri;
    }

    return ''; // TODO: Retrieve app deeplink
  }
}

export default RNAdapter;
