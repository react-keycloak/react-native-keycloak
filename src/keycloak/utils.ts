import type {
  KeycloakPkceMethod,
  IKeycloakReactNativeClientConfig,
} from './types';

// TODO: Before createLoginUrl()
// const state = createUUID();
// const nonce = createUUID();
// const redirectUri = adapter.redirectUri(options);

// const endpoint = options?.action === 'register') ? options.endpoints.register() ? options.endpoints.authorize();

// const codeVerifier = generateCodeVerifier(96);
// const pkceChallenge = generatePkceChallenge(options.pkceMethod, codeVerifier);
// const callbackState = {
//   state: state,
//   nonce: nonce,
//   prompt: options?.prompt ?? undefined,
//   redirectUri: encodeURIComponent(redirectUri),
// };

interface ICreateLoginUrlOptions {
  action: string;

  endpoint: string;

  scope?: string;

  clientId: string;

  redirectUri: string;

  state: string;

  responseMode: string;

  responseType: string;

  nonce?: string;

  prompt?: string;

  maxAge?: string;

  loginHint?: string;

  idpHint?: string;

  locale?: string;

  pkceChallenge?: string;

  pkceMethod?: KeycloakPkceMethod;
}

interface ICreateLogoutUrlOptions {
  endpoint: string;

  redirectUri: string;
}

interface ICreateAccountUrlOptions {
  clientConfig: IKeycloakReactNativeClientConfig;
  redirectUri: string;
}

export function createLoginUrl(options: ICreateLoginUrlOptions): string {
  const baseUrl = options.endpoint;

  let scope;
  if (options?.scope) {
    if (options.scope.indexOf('openid') !== -1) {
      scope = options.scope;
    } else {
      scope = 'openid ' + options.scope;
    }
  } else {
    scope = 'openid';
  }

  let url =
    baseUrl +
    '?client_id=' +
    encodeURIComponent(options.clientId) +
    '&redirect_uri=' +
    encodeURIComponent(options.redirectUri) +
    '&state=' +
    encodeURIComponent(options.state) +
    '&response_mode=' +
    encodeURIComponent(options.responseMode) +
    '&response_type=' +
    encodeURIComponent(options.responseType) +
    '&scope=' +
    encodeURIComponent(scope);

  if (options?.nonce) {
    url = url + '&nonce=' + encodeURIComponent(options?.nonce);
  }

  if (options?.prompt) {
    url += '&prompt=' + encodeURIComponent(options.prompt);
  }

  if (options?.maxAge) {
    url += '&max_age=' + encodeURIComponent(options.maxAge);
  }

  if (options?.loginHint) {
    url += '&login_hint=' + encodeURIComponent(options.loginHint);
  }

  if (options?.idpHint) {
    url += '&kc_idp_hint=' + encodeURIComponent(options.idpHint);
  }

  if (options?.action && options?.action !== 'register') {
    url += '&kc_action=' + encodeURIComponent(options.action);
  }

  if (options?.locale) {
    url += '&ui_locales=' + encodeURIComponent(options.locale);
  }

  if (options?.pkceMethod && options?.pkceChallenge) {
    url += '&code_challenge=' + options.pkceChallenge;
    url += '&code_challenge_method=' + options.pkceMethod;
  }

  return url;
}

export function createLogoutUrl(options: ICreateLogoutUrlOptions) {
  return `${options.endpoint}?redirect_uri=${encodeURIComponent(
    options.redirectUri
  )}`;
}

export function createRegisterUrl(options: ICreateLoginUrlOptions) {
  return createLoginUrl({
    ...options,
    action: 'register',
  });
}

export function createAccountUrl({
  clientConfig,
  redirectUri,
}: ICreateAccountUrlOptions) {
  const realm = getRealmUrl(clientConfig.realm, clientConfig?.url);

  if (typeof realm === 'undefined') {
    return undefined;
  }

  return `${realm}/account?referrer=${encodeURIComponent(
    clientConfig.clientId
  )}&referrer_uri=${encodeURIComponent(redirectUri)}`;
}

function getRealmUrl(realm: string, authServerUrl?: string) {
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
  realm: string;
  authServerUrl?: string;
  oidcConfiguration?: { [key: string]: any };
}) {
  if (!oidcConfiguration) {
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
      return oidcConfiguration.authorization_endpoint;
    },
    token: function () {
      return oidcConfiguration.token_endpoint;
    },
    logout: function () {
      if (!oidcConfiguration.end_session_endpoint) {
        throw 'Not supported by the OIDC server';
      }
      return oidcConfiguration.end_session_endpoint;
    },
    register: function () {
      throw 'Redirection to "Register user" page not supported in standard OIDC mode';
    },
    userinfo: function () {
      if (!oidcConfiguration.userinfo_endpoint) {
        throw 'Not supported by the OIDC server';
      }
      return oidcConfiguration.userinfo_endpoint;
    },
  };
}
