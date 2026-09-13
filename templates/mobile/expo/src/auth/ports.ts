import * as Passkeys from "react-native-passkeys";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import {
  createNativePasskeyPort,
  createSecureStoreTokenStorage,
  createWebBrowserOAuthRedirect,
  type NativeAuthPorts,
} from "@seamless-auth/react-native";

// Built once, at module scope: the provider keys its session on these
// identities, so a fresh object per render would sign the user out on every
// paint.
export const authPorts: NativeAuthPorts = {
  passkeys: createNativePasskeyPort(Passkeys),
  tokenStorage: createSecureStoreTokenStorage(SecureStore),
  oauthRedirect: createWebBrowserOAuthRedirect(WebBrowser),
};
