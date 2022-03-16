import { KeycloakClient } from '@react-keycloak/keycloak-ts';

import RNAdapter from './adapter';
import type { RNKeycloakInitOptions } from './types';

class KeycloakReactNativeClient extends KeycloakClient {
  public async init(initOptions: RNKeycloakInitOptions): Promise<boolean> {
    return super.init({
      adapter: RNAdapter,
      ...initOptions,
    });
  }
}

export default KeycloakReactNativeClient;
