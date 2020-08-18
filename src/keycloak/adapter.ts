import InAppBrowser from 'react-native-inappbrowser-reborn';
import type { InAppBrowserOptions } from 'react-native-inappbrowser-reborn';

import type {
  KeycloakAdapter,
  KeycloakInstance,
  KeycloakLoginOptions,
  KeycloakLogoutOptions,
  KeycloakRegisterOptions,
} from './types';

class Adapter implements KeycloakAdapter {
  constructor(
    private kcClient: KeycloakInstance,
    private inAppBrowserOptions?: InAppBrowserOptions
  ) {}

  /**
   * Start login process
   *
   * @param {KeycloakLoginOptions} options Login options
   */
  public async login(options?: KeycloakLoginOptions): Promise<void> {
    var loginUrl = this.kcClient.createLoginUrl(options);

    if (await InAppBrowser.isAvailable()) {
      // See for more details https://github.com/proyecto26/react-native-inappbrowser#authentication-flow-using-deep-linking
      const res = await InAppBrowser.openAuth(
        loginUrl,
        this.kcClient.redirectUri!,
        this.inAppBrowserOptions
      );

      if (res.type === 'success' && res.url) {
        const oauth = this.kcClient.parseCallback(res.url);
        return this.kcClient.processCallback(oauth);
      }

      throw new Error('Authentication flow failed');
    } else {
      throw new Error('InAppBrowser not available');
      // TODO: maybe!
      //   Linking.openURL(loginURL);
    }
  }

  public async logout(options?: KeycloakLogoutOptions): Promise<void> {
    const logoutUrl = this.kcClient.createLogoutUrl(options);

    const data = new FormData();
    data.append('client_id', this.kcClient.clientId);
    data.append('refresh_token', this.kcClient.refreshToken);

    await fetch(logoutUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.kcClient.token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: data,
    });

    this.kcClient.clearToken();
  }

  public async register(options?: KeycloakRegisterOptions) {
    const registerUrl = this.kcClient.createRegisterUrl(options);

    if (await InAppBrowser.isAvailable()) {
      // See for more details https://github.com/proyecto26/react-native-inappbrowser#authentication-flow-using-deep-linking
      const res = await InAppBrowser.openAuth(
        registerUrl,
        this.kcClient.redirectUri!,
        this.inAppBrowserOptions
      );

      if (res.type === 'success' && res.url) {
        const oauth = this.kcClient.parseCallback(res.url);
        return this.kcClient.processCallback(oauth);
      }

      throw new Error('Registration flow failed');
    } else {
      throw new Error('InAppBrowser not available');
      // TODO: maybe!
      //   Linking.openURL(loginURL);
    }
  }

  public async accountManagement() {
    const accountUrl = this.kcClient.createAccountUrl();

    if (typeof accountUrl !== 'undefined') {
      await InAppBrowser.open(accountUrl, this.inAppBrowserOptions);
    } else {
      throw 'Not supported by the OIDC server';
    }
  }

  public redirectUri(options?: { redirectUri?: string }): string {
    if (options && options.redirectUri) {
      return options.redirectUri;
    }

    if (this.kcClient.redirectUri) {
      return this.kcClient.redirectUri;
    }

    return ''; // TODO: Retrieve app deeplink
  }
}

export default Adapter;
