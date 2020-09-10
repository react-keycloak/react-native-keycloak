![React Native Keycloak](/art/rn-keycloak.png?raw=true 'React Native Keycloak Logo')

# React Native Keycloak <!-- omit in toc -->

> React Native component for [Keycloak](https://www.keycloak.org/)

[![NPM (scoped)](https://img.shields.io/npm/v/@react-keycloak/native?label=npm%20%7C%20native)](https://www.npmjs.com/package/@react-keycloak/native)

[![License](https://img.shields.io/github/license/react-keycloak/react-native-keycloak.svg)](https://github.com/react-keycloak/react-native-keycloak/blob/master/LICENSE)
[![Github Issues](https://img.shields.io/github/issues/react-keycloak/react-native-keycloak.svg)](https://github.com/react-keycloak/react-native-keycloak/issues)

[![Gitter](https://img.shields.io/gitter/room/react-keycloak/community)](https://gitter.im/react-keycloak/community)

---

## Table of Contents <!-- omit in toc -->

- [Install](#install)
  - [Setup Deep links (iOS)](#setup-deep-links-ios)
  - [Setup Deep links (Android)](#setup-deep-links-android)
- [Getting Started](#getting-started)
  - [Setup RNKeycloak instance](#setup-rnkeycloak-instance)
  - [Setup ReactNativeKeycloakProvider](#setup-reactnativekeycloakprovider)
  - [Hook Usage](#hook-usage)
  - [External Usage (Advanced)](#external-usage-advanced)
- [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)

---

## Install

```sh
yarn add @react-keycloak/native
yarn add react-native-inappbrowser-reborn
```

or

```sh
npm install @react-keycloak/native
npm install react-native-inappbrowser-reborn --save
```

You have to link `react-native-inappbrowser-reborn`.
For more information about how to link it go to [Official repo on github](https://github.com/proyecto26/react-native-inappbrowser)

### Setup Deep links (iOS)

To navigate back from webview to you app, you have to configure deep linking.

![image](https://user-images.githubusercontent.com/3645225/92749944-e3215080-f386-11ea-8ba7-7f0adf33a6e5.png)

And in `AppDelegate.m`, add these lines:

```
#import <React/RCTLinkingManager.h>

......
......

// Deep linking
- (BOOL)application:(UIApplication *)application
   openURL:(NSURL *)url
   options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [RCTLinkingManager application:application openURL:url options:options];
}
```

N.B.: replace `myapp` with the name of your app

### Setup Deep links (Android)

To configure the external linking in Android, you can create a new intent in the manifest.

The easiest way to do this is with the `uri-scheme` package: `npx uri-scheme add myapp --android`

If you want to add it manually, open up `YourApp/android/app/src/main/AndroidManifest.xml`, and make the following adjustments:

1. Set `launchMode` of `MainActivity` to `singleTask` in order to receive intent on existing `MainActivity` (this is the default on all new projects, so you may not need to actually change anything!). It is useful if you want to perform navigation using deep link you have been registered - [details](http://developer.android.com/training/app-indexing/deep-linking.html#adding-filters)
2. Add the new intent-filter inside the MainActivity entry with a VIEW type action:

```
<activity
    android:name=".MainActivity"
    android:launchMode="singleTask">
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="myapp" />
    </intent-filter>
</activity>
```

N.B.: replace `myapp` with the name of your app

## Getting Started

### Setup RNKeycloak instance

Create a `keycloak.ts` file in the `src` folder of your project (where `App.ts` is located) with the following content

```ts
import { RNKeycloak } from '@react-keycloak/native';

// Setup Keycloak instance as needed
// Pass initialization options as required
const keycloak = new RNKeycloak({
  url: 'http://keycloak-server/auth',
  realm: 'kc-realm',
  clientId: 'web',
});

export default keycloak;
```

### Setup ReactNativeKeycloakProvider

Wrap your App inside `KeycloakProvider` and pass the `keycloak` instance as prop

```tsx
import { ReactNativeKeycloakProvider } from '@react-keycloak/native';

import keycloak from './keycloak';

// Wrap everything inside ReactNativeKeycloakProvider
const App = () => (
  <ReactNativeKeycloakProvider
    authClient={keycloak}
    initOptions={{
      redirectUri: 'myapp://Homepage',
      // if you need to customize "react-native-inappbrowser-reborn" View you can use the following attribute
      inAppBrowserOptions: {
        // For iOS check: https://github.com/proyecto26/react-native-inappbrowser#ios-options
        // For Android check: https://github.com/proyecto26/react-native-inappbrowser#android-options
      },
    }}
  >
    <Login />
  </ReactNativeKeycloakProvider>
);

export default App;
```

**N.B.** If your using other providers (such as `react-redux`) it is recommended to place them inside `ReactNativeKeycloakProvider`.

`ReactNativeKeycloakProvider` automatically invokes `keycloak.init()` method when needed and supports the following props:

- `initConfig`, contains the object to be passed to `keycloak.init()` method, by default the following is used

      {
        onLoad: 'check-sso',
      }

  for more options see [Keycloak docs](https://www.keycloak.org/docs/latest/securing_apps/index.html#init-options).

- `LoadingComponent`, a component to be displayed while `keycloak` is being initialized, if not provided child components will be rendered immediately. Defaults to `null`

- `isLoadingCheck`, an optional loading check function to customize LoadingComponent display condition. Return `true` to display LoadingComponent, `false` to hide it.

  Can be implemented as follow

  ```ts
  (keycloak) => !keycloak.authenticated;
  ```

- `onEvent`, an handler function that receives events launched by `keycloak`, defaults to `null`.

  It can be implemented as follow

  ```ts
  (event, error) => {
    console.log('onKeycloakEvent', event, error);
  };
  ```

  Published events are:

  - `onReady`
  - `onInitError`
  - `onAuthSuccess`
  - `onAuthError`
  - `onAuthRefreshSuccess`
  - `onAuthRefreshError`
  - `onTokenExpired`
  - `onAuthLogout`

- `onTokens`, an handler function that receives `keycloak` tokens as an object every time they change, defaults to `null`.

  Keycloak tokens are returned as follow

  ```json
  {
    "idToken": string,
    "refreshToken": string,
    "token": string
  }
  ```

### Hook Usage

When a component requires access to `Keycloak`, you can use the `useKeycloak` Hook.

```tsx
import { useKeycloak } from '@react-keycloak/native';

export default () => {
  // Using array destructuring
  const [keycloak, initialized] = useKeycloak();
  // or Object destructuring
  const { keycloak, initialized } = useKeycloak();

  // Here you can access all of keycloak methods and variables.
  // See https://www.keycloak.org/docs/latest/securing_apps/index.html#javascript-adapter-reference

  return (
    <View>
      <Text>
        {`User is ${!keycloak.authenticated ? 'NOT ' : ''}authenticated`}
      </Text>

      {!!keycloak.authenticated && (
        <Button onPress={() => keycloak.logout()} title="Logout" />
      )}
    </View>
  );
};
```

### External Usage (Advanced)

If you need to access `keycloak` instance from non-`React` files (such as `sagas`, `utils`, `providers` ...), you can import the instance directly from the `keycloak.ts` file.

The instance will be initialized by `react-keycloak` but you'll need to be carefull when using the instance and avoid setting/overriding any props, you can however freely access the exposed methods (such as `refreshToken`, `login`, etc...).

## Examples

See inside `example` folder for a demo app showcasing the main features.

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
