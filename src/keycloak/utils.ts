import jwtDecode from 'jwt-decode';

import { extractQuerystringParameters } from 'src/utils/url';

import type {
  CallbackStorage,
  KeycloakConfig,
  KeycloakInitOptions,
  OIDCProviderConfig,
} from './types';

export function getRealmUrl(realm: string, authServerUrl?: string) {
  if (typeof authServerUrl === 'undefined') {
    return undefined;
  }

  if (authServerUrl.charAt(authServerUrl.length - 1) === '/') {
    return authServerUrl + 'realms/' + encodeURIComponent(realm);
  } else {
    return authServerUrl + '/realms/' + encodeURIComponent(realm);
  }
}

export function setupOidcEndoints({
  oidcConfiguration,
  realm,
  authServerUrl,
}: {
  realm?: string;
  authServerUrl?: string;
  oidcConfiguration?: OIDCProviderConfig;
}) {
  if (!oidcConfiguration) {
    if (!realm) {
      throw new Error('Missing realm');
    }

    return {
      authorize: function () {
        return (
          getRealmUrl(realm, authServerUrl) + '/protocol/openid-connect/auth'
        );
      },
      token: function () {
        return (
          getRealmUrl(realm, authServerUrl) + '/protocol/openid-connect/token'
        );
      },
      logout: function () {
        return (
          getRealmUrl(realm, authServerUrl) + '/protocol/openid-connect/logout'
        );
      },
      register: function () {
        return (
          getRealmUrl(realm, authServerUrl) +
          '/protocol/openid-connect/registrations'
        );
      },
      userinfo: function () {
        return (
          getRealmUrl(realm, authServerUrl) +
          '/protocol/openid-connect/userinfo'
        );
      },
    };
  }

  return {
    authorize: function () {
      return oidcConfiguration.authorization_endpoint as string;
    },
    token: function () {
      return oidcConfiguration.token_endpoint as string;
    },
    logout: function () {
      if (!oidcConfiguration.end_session_endpoint) {
        throw 'Not supported by the OIDC server';
      }
      return oidcConfiguration.end_session_endpoint as string;
    },
    register: function () {
      throw 'Redirection to "Register user" page not supported in standard OIDC mode';
    },
    userinfo: function () {
      if (!oidcConfiguration.userinfo_endpoint) {
        throw 'Not supported by the OIDC server';
      }
      return oidcConfiguration.userinfo_endpoint as string;
    },
  };
}

export function decodeToken<T = unknown>(str: string) {
  return jwtDecode<T>(str);
}

export interface ParseCallbackParams {
  callbackStorage: CallbackStorage;

  clientOptions: KeycloakInitOptions;

  url: string;
}

export function parseCallbackParams(
  paramsString: string,
  supportedParams: string[]
) {
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

export function isKeycloakConfig(
  config?: string | KeycloakConfig
): config is KeycloakConfig {
  return !!config && typeof config !== 'string';
}

export async function fetchJSON<T = JSON>(
  url: string,
  token?: string
): Promise<T> {
  const jsonRes = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
  });

  return await jsonRes.json();
}
