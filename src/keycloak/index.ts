import type {
  KeycloakClient,
  KeycloakInitOptions,
} from '@react-keycloak/core/lib/types';
import { encode } from '../utils/base64';
import { extractQuerystringParameters } from '../utils/url';
import type {
  KeycloakFlow,
  KeycloakResponseMode,
  CallbackStorage,
  IKeycloakReactNativeClientConfig,
} from './types';

class KeycloakReactNativeClient implements KeycloakClient {
  private authServerUrl?: string;

  private realm: string;

  private clientId: string;

  private flow?: KeycloakFlow;

  private responseMode?: KeycloakResponseMode;

  private authenticated: boolean = false;

  private callbackStorage: CallbackStorage = {};

  constructor({ clientId, realm, url }: IKeycloakReactNativeClientConfig) {
    this.clientId = clientId;
    this.realm = realm;
    this.authServerUrl = url;
  }

  public async init(initOptions: KeycloakInitOptions): Promise<boolean> {
    this.authenticated = false;
    this.callbackStorage = {};

    return Promise.reject();
  }

  public async updateToken(minValidity: number): Promise<boolean> {
    return Promise.reject();
  }

  private decodeToken(str: string): string {
    str = str.split('.')[1];

    str = str.replace('/-/g', '+');
    str = str.replace('/_/g', '/');
    switch (str.length % 4) {
      case 0:
        break;
      case 2:
        str += '==';
        break;
      case 3:
        str += '=';
        break;
      default:
        throw 'Invalid token';
    }

    str = decodeURIComponent(escape(encode(str)));

    str = JSON.parse(str);
    return str;
  }

  private parseCallback(url: string): object {
    var oauth = this.parseCallbackUrl(url);
    if (!oauth) {
      return;
    }

    var oauthState = callbackStorage.get(oauth.state);

    if (oauthState) {
      oauth.valid = true;
      oauth.redirectUri = oauthState.redirectUri;
      oauth.storedNonce = oauthState.nonce;
      oauth.prompt = oauthState.prompt;
      oauth.pkceCodeVerifier = oauthState.pkceCodeVerifier;
    }

    return oauth;
  }

  private parseCallbackUrl(url: string) {
    let supportedParams: string[] = [];
    switch (this.flow) {
      case 'standard':
        supportedParams = [
          'code',
          'state',
          'session_state',
          'kc_action_status',
        ];
        break;

      case 'implicit':
        supportedParams = [
          'access_token',
          'token_type',
          'id_token',
          'state',
          'session_state',
          'expires_in',
          'kc_action_status',
        ];
        break;

      case 'hybrid':
        supportedParams = [
          'access_token',
          'id_token',
          'code',
          'state',
          'session_state',
          'kc_action_status',
        ];
        break;
    }

    supportedParams.push('error');
    supportedParams.push('error_description');
    supportedParams.push('error_uri');

    var queryIndex = url.indexOf('?');
    var fragmentIndex = url.indexOf('#');

    var newUrl;
    var parsed;

    if (this.responseMode === 'query' && queryIndex !== -1) {
      newUrl = url.substring(0, queryIndex);
      parsed = this.parseCallbackParams(
        url.substring(
          queryIndex + 1,
          fragmentIndex !== -1 ? fragmentIndex : url.length
        ),
        supportedParams
      );
      if (parsed.paramsString !== '') {
        newUrl += '?' + parsed.paramsString;
      }
      if (fragmentIndex !== -1) {
        newUrl += url.substring(fragmentIndex);
      }
    } else if (this.responseMode === 'fragment' && fragmentIndex !== -1) {
      newUrl = url.substring(0, fragmentIndex);
      parsed = this.parseCallbackParams(
        url.substring(fragmentIndex + 1),
        supportedParams
      );
      if (parsed.paramsString !== '') {
        newUrl += '#' + parsed.paramsString;
      }
    }

    if (parsed && parsed.oauthParams) {
      if (this.flow === 'standard' || this.flow === 'hybrid') {
        if (
          (parsed.oauthParams.code || parsed.oauthParams.error) &&
          parsed.oauthParams.state
        ) {
          parsed.oauthParams.newUrl = newUrl;
          return parsed.oauthParams;
        }
      } else if (this.flow === 'implicit') {
        if (
          (parsed.oauthParams.access_token || parsed.oauthParams.error) &&
          parsed.oauthParams.state
        ) {
          parsed.oauthParams.newUrl = newUrl;
          return parsed.oauthParams;
        }
      }
    }
  }

  private parseCallbackParams(paramsString: string, supportedParams: string[]) {
    const params = extractQuerystringParameters(paramsString);
    const [otherParams, oAuthParams] = Object.keys(params).reduce(
      ([oParams, oauthParams], key) => {
        if (supportedParams.includes(key)) {
          oauthParams.set(key, params[key]);
        } else {
          oParams.add(`${key}=${params[key]}`);
        }
        return [oParams, oauthParams];
      },
      [new Set<string>(), new Map<string, any>()]
    );

    return {
      paramsString: Array.from(otherParams.values()).join('&'),
      oauthParams: Object.fromEntries(oAuthParams.entries()),
    };
  }
}

export default KeycloakReactNativeClient;
