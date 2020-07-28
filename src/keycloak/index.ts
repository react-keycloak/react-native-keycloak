import type {
  KeycloakClient,
  KeycloakInitOptions,
} from '@react-keycloak/core/lib/types';

import Adapter from './adapter';

import type { IKeycloakReactNativeClientConfig } from './types';

import { validateInitOptions } from './utils';

class KeycloakReactNativeClient implements KeycloakClient {
  private clientConfig: IKeycloakReactNativeClientConfig;

  private authenticated: boolean = false;

  private adapter: Adapter | undefined;

  constructor(clientConfig: IKeycloakReactNativeClientConfig) {
    this.clientConfig = clientConfig;
  }

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

  public async login(options: KeycloakInitOptions) {
    return this.adapter!.login(options);
  }

  public async updateToken(minValidity: number): Promise<boolean> {
    return Promise.reject();
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
}

export default KeycloakReactNativeClient;
