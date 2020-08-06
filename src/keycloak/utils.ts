import jwtDecode from 'jwt-decode';
import type {
  CallbackStorage,
  ClientInitOptions,
  KeycloakFlow,
  KeycloakResponseMode,
  KeycloakResponseType,
  IKeycloakReactNativeClientConfig,
  KeycloakLoginOptions,
  KeycloakAdapter,
  KeycloakEndpoints,
  CallbackState,
} from './types';
import { extractQuerystringParameters } from 'src/utils/url';
import {
  generateCodeVerifier,
  generatePkceChallenge,
  createUUID,
} from 'src/utils/uuid';

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

interface ICreateLogoutUrlOptions {
  endpoint: string;

  redirectUri: string;
}

interface ICreateAccountUrlOptions {
  clientConfig: IKeycloakReactNativeClientConfig;
  redirectUri: string;
}

export function createLoginUrl(
  adapter: KeycloakAdapter,
  endpoints: KeycloakEndpoints,
  kcOptions: IKeycloakReactNativeClientConfig,
  initOptions: ClientInitOptions,
  options: KeycloakLoginOptions
): [string, CallbackState] {
  const state = createUUID();
  const nonce = createUUID();
  const redirectUri = adapter.redirectUri(options);

  let codeVerifier;
  let pkceChallenge;
  if (initOptions.pkceMethod) {
    codeVerifier = generateCodeVerifier(96);
    pkceChallenge = generatePkceChallenge(initOptions.pkceMethod, codeVerifier);
  }

  const callbackState: CallbackState = {
    state,
    nonce,
    pkceCodeVerifier: codeVerifier,
    prompt: options?.prompt ?? undefined,
    redirectUri: redirectUri ? encodeURIComponent(redirectUri) : undefined,
  };

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

  const baseUrl =
    options && options.action === 'register'
      ? endpoints.register()
      : endpoints.authorize();

  const params = new URLSearchParams();
  params.set('client_id', kcOptions.clientId);
  params.set('redirect_uri', redirectUri);
  params.set('state', state);
  params.set('response_mode', initOptions.responseMode);
  params.set('response_type', initOptions.responseType);
  params.set('scope', scope);

  if (initOptions?.nonce) {
    params.set(nonce, initOptions.nonce);
  }

  if (options?.prompt) {
    params.set('prompt', options.prompt);
  }

  if (options?.maxAge) {
    params.set('max_age', `${options.maxAge}`);
  }

  if (options?.loginHint) {
    params.set('login_hint', options.loginHint);
  }

  if (options?.idpHint) {
    params.set('kc_idp_hint', options.idpHint);
  }

  if (options?.action && options?.action !== 'register') {
    params.set('kc_action', options.action);
  }

  if (options?.locale) {
    params.set('ui_locales', options.locale);
  }

  if (initOptions?.pkceMethod && !!pkceChallenge) {
    params.set('code_challenge', pkceChallenge);
    params.set('code_challenge_method', initOptions.pkceMethod);
  }

  return [`${baseUrl}?${params.toString()}`, callbackState];
}

export function createLogoutUrl(options: ICreateLogoutUrlOptions) {
  return `${options.endpoint}?redirect_uri=${encodeURIComponent(
    options.redirectUri
  )}`;
}

export function createRegisterUrl(
  adapter: KeycloakAdapter,
  endpoints: KeycloakEndpoints,
  kcOptions: IKeycloakReactNativeClientConfig,
  initOptions: ClientInitOptions,
  options: KeycloakLoginOptions
) {
  return createLoginUrl(adapter, endpoints, kcOptions, initOptions, {
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

export function decodeToken<T = unknown>(str: string) {
  return jwtDecode<T>(str);
}

interface ParseCallbackParams {
  clientOptions: ClientInitOptions;

  oauthState: CallbackStorage;

  url: string;
}

export function parseCallback({
  clientOptions,
  oauthState,
  url,
}: ParseCallbackParams) {
  const oauthParsed = parseCallbackUrl(url, clientOptions);
  if (!oauthParsed) {
    return;
  }

  return {
    ...oauthParsed,
    valid: true,
    redirectUri: oauthState.redirectUri,
    storedNonce: oauthState.nonce,
    prompt: oauthState.prompt,
    pkceCodeVerifier: oauthState.pkceCodeVerifier,
  };
}

function parseCallbackUrl(url: string, clientOptions: ClientInitOptions) {
  let supportedParams: string[] = [];
  switch (clientOptions.flow) {
    case 'standard':
      supportedParams = ['code', 'state', 'session_state', 'kc_action_status'];
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

  const queryIndex = url.indexOf('?');
  const fragmentIndex = url.indexOf('#');

  let newUrl;
  let parsed;

  if (clientOptions.responseMode === 'query' && queryIndex !== -1) {
    newUrl = url.substring(0, queryIndex);
    parsed = parseCallbackParams(
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
  } else if (
    clientOptions.responseMode === 'fragment' &&
    fragmentIndex !== -1
  ) {
    newUrl = url.substring(0, fragmentIndex);
    parsed = parseCallbackParams(
      url.substring(fragmentIndex + 1),
      supportedParams
    );
    if (parsed.paramsString !== '') {
      newUrl += '#' + parsed.paramsString;
    }
  }

  if (parsed && parsed.oauthParams) {
    if (clientOptions.flow === 'standard' || clientOptions.flow === 'hybrid') {
      if (
        (parsed.oauthParams.code || parsed.oauthParams.error) &&
        parsed.oauthParams.state
      ) {
        parsed.oauthParams.newUrl = newUrl;
        return parsed.oauthParams;
      }
    } else if (clientOptions.flow === 'implicit') {
      if (
        (parsed.oauthParams.access_token || parsed.oauthParams.error) &&
        parsed.oauthParams.state
      ) {
        parsed.oauthParams.newUrl = newUrl;
        return parsed.oauthParams;
      }
    }
  }

  return {};
}

function parseCallbackParams(paramsString: string, supportedParams: string[]) {
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

export function validateInitOptions(initOptions?: any) {
  let normalizedOptions: {
    flow?: KeycloakFlow;
    responseMode?: KeycloakResponseMode;
    responseType?: KeycloakResponseType;
    [key: string]: unknown;
  } = {};

  if (initOptions) {
    if (typeof initOptions.useNonce !== 'undefined') {
      normalizedOptions.useNonce = initOptions.useNonce;
    }

    if (initOptions.onLoad === 'login-required') {
      normalizedOptions.loginRequired = true;
    }

    if (initOptions.responseMode) {
      if (
        initOptions.responseMode === 'query' ||
        initOptions.responseMode === 'fragment'
      ) {
        normalizedOptions.responseMode = initOptions.responseMode;
      } else {
        throw 'Invalid value for responseMode';
      }
    }

    if (initOptions.flow) {
      switch (initOptions.flow) {
        case 'standard':
          normalizedOptions.responseType = 'code';
          break;
        case 'implicit':
          normalizedOptions.responseType = 'id_token token';
          break;
        case 'hybrid':
          normalizedOptions.responseType = 'code id_token token';
          break;
        default:
          throw 'Invalid value for flow';
      }

      normalizedOptions.flow = initOptions.flow;
    }

    if (initOptions.timeSkew != null) {
      normalizedOptions.timeSkew = initOptions.timeSkew;
    }

    if (initOptions.redirectUri) {
      normalizedOptions.redirectUri = initOptions.redirectUri;
    }

    if (initOptions.silentCheckSsoRedirectUri) {
      normalizedOptions.silentCheckSsoRedirectUri =
        initOptions.silentCheckSsoRedirectUri;
    }

    if (typeof initOptions.silentCheckSsoFallback === 'boolean') {
      normalizedOptions.silentCheckSsoFallback =
        initOptions.silentCheckSsoFallback;
    } else {
      normalizedOptions.silentCheckSsoFallback = true;
    }

    if (initOptions.pkceMethod) {
      if (initOptions.pkceMethod !== 'S256') {
        throw 'Invalid value for pkceMethod';
      }
      normalizedOptions.pkceMethod = initOptions.pkceMethod;
    }

    if (typeof initOptions.enableLogging === 'boolean') {
      normalizedOptions.enableLogging = initOptions.enableLogging;
    } else {
      normalizedOptions.enableLogging = false;
    }
  }

  return {
    ...normalizedOptions,
    responseMode: normalizedOptions?.responseMode ?? 'fragment',
    responseType: normalizedOptions?.responseType ?? 'code',
    flow: !normalizedOptions.responseType ? 'standard' : normalizedOptions.flow,
  };
}
