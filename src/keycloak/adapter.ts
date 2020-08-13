import InAppBrowser from 'react-native-inappbrowser-reborn';
import type { InAppBrowserOptions } from 'react-native-inappbrowser-reborn';

import type {
  CallbackStorage,
  KeycloakAdapter,
  KeycloakInstance,
  KeycloakLoginOptions,
  KeycloakLogoutOptions,
  KeycloakRegisterOptions,
  KeycloakProfile,
} from './types';

import { getRealmUrl } from './utils';

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

        // TODO: WIP implement processCallback inside Client
        return processCallback(oauth);
      }

      throw new Error('Authentication flow failed');
    } else {
      throw new Error('InAppBrowser not available');
      // TODO: maybe!
      //   Linking.openURL(loginURL);
    }
  }

  public async logout(options?: KeycloakLogoutOptions): Promise<void> {
    const endpoint = this.endpoints.logout();
    const redirectUri = this.redirectUri(options);
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

  public async register(options?: KeycloakRegisterOptions) {
    // const [registerURL, callbackState] = createLoginUrl(
    //   this,
    //   this.endpoints,
    //   this.kcOptions,
    //   this.clientOptions,
    //   options
    // );
    // if (!options.redirectUri) {
    //   throw new Error('redirectUri not specified');
    // }
    // if (await InAppBrowser.isAvailable()) {
    //   // See for more details https://github.com/proyecto26/react-native-inappbrowser#authentication-flow-using-deep-linking
    //   const res = await InAppBrowser.openAuth(
    //     registerURL,
    //     options.redirectUri,
    //     this.inAppBrowserOptions
    //   );
    //   // TODO: Handle res!
    //   if (res.type === 'success' && res.url) {
    //     parseCallback({
    //       url: res.url,
    //       oauthState: callbackState,
    //       clientOptions: this.clientOptions,
    //     });
    //   }
    //   throw new Error('Authentication flow failed');
    // } else {
    //   throw new Error('Error. InAppBrowser not available');
    //   // TODO: maybe!
    //   //   Linking.openURL(loginURL);
    // }
  }

  public async accountManagement() {
    if (!this.kcOptions.redirectUri) {
      throw new Error('redirectUri not specified');
    }

    const accountUrl = createAccountUrl({
      clientConfig: this.kcOptions,
      redirectUri: this.kcOptions.redirectUri,
    });

    if (typeof accountUrl !== 'undefined') {
      await InAppBrowser.open(accountUrl, this.inAppBrowserOptions);
    } else {
      throw 'Not supported by the OIDC server';
    }
  }

  public redirectUri(
    options?: { redirectUri?: string },
    _encodeHash: boolean = true
  ): string {
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
