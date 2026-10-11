import "./index.css";

import { createSeamlessAuth } from "@seamless-auth/vue";
import { createApp } from "vue";

import App from "./App.vue";
import ConfigurationError from "./components/ConfigurationError.vue";
import { getApiUrl, MISSING_API_URL_MESSAGE } from "./lib/runtimeConfig";
import { router } from "./router";

const apiHost = getApiUrl();

if (apiHost) {
  createApp(App).use(router).use(createSeamlessAuth({ apiHost })).mount("#app");
} else {
  createApp(ConfigurationError, { message: MISSING_API_URL_MESSAGE }).mount(
    "#app",
  );
}
