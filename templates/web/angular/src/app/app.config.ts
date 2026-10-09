import { provideHttpClient, withInterceptors } from "@angular/common/http";
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from "@angular/core";
import { provideRouter } from "@angular/router";
import {
  provideSeamlessAuth,
  seamlessAuthInterceptor,
} from "@seamless-auth/angular";

import { routes } from "./app.routes";
import { getApiUrl } from "./runtime-config";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // Without an API origin the root component shows the configuration error
    // instead of any page.
    provideSeamlessAuth(() => ({ apiHost: getApiUrl() ?? "" })),
    // Sends the session cookies with HttpClient calls to the API, and nowhere else.
    provideHttpClient(withInterceptors([seamlessAuthInterceptor])),
  ],
};
