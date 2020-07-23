import type { IKeycloakReactNativeClientConfig } from './types';

class Adapter {
  private options: IKeycloakReactNativeClientConfig;

  constructor(keycloakOptions: IKeycloakReactNativeClientConfig) {
    this.options = keycloakOptions;
  }

  public login() {
    // @TODO: Use https://www.npmjs.com/package/react-native-inappbrowser-reborn
  }

  public logout({ refreshToken, accessToken }) {
    const data = new URLSearchParams();
    data.append('client_id', this.options.clientId);
    data.append('refresh_token', refreshToken);

    return fetch(
      `${this.options.url}/realms/${this.options.realm}/protocol/openid-connect/logout`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: data,
      }
    );
  }

  public register() {}

  public accountManagement() {}

  public redirectURI() {}
}

export default Adapter;
