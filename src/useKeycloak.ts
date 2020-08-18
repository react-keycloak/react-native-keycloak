import { useContext } from 'react';

import { reactNativeKeycloakContext } from './context';

export function useKeycloak() {
  const { initialized, authClient } = useContext(reactNativeKeycloakContext);
  return Object.assign([authClient, initialized], {
    initialized,
    keycloak: authClient,
  });
}
