import type {
  CallbackState,
  CallbackStorage,
} from '@react-keycloak/keycloak-ts';

class LocalStorage implements CallbackStorage {
  private storage = new Map<string, CallbackState>();

  get(state?: string) {
    if (!state) {
      return;
    }

    const key = `kc-callback-${state}`;
    let value;
    if (this.storage.has(key)) {
      value = this.storage.get(key);
    }

    this.clearExpired();
    return value;
  }

  add(state: CallbackState): void {
    this.clearExpired();

    const key = `kc-callback-${state.state}`;
    this.storage.set(key, {
      ...state,
      expires: new Date().getTime() + 60 * 60 * 1000,
    });
  }

  private clearExpired(): void {
    const time = new Date().getTime();

    Array.from(this.storage.entries())
      .filter(
        ([key, state]) =>
          key.startsWith('kc-callback-') &&
          (!state.expires || state.expires < time)
      )
      .map(([key]) => key)
      .forEach((keyToRemove) => {
        this.storage.delete(keyToRemove);
      });
  }
}

export default LocalStorage;
