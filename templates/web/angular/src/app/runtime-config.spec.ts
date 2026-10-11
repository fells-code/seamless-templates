import { getApiUrl } from "./runtime-config";

afterEach(() => {
  delete window.__SEAMLESS_CONFIG__;
});

describe("getApiUrl", () => {
  it("reads the origin config.js sets", () => {
    window.__SEAMLESS_CONFIG__ = { API_URL: " http://localhost:3000/ " };
    expect(getApiUrl()).toBe("http://localhost:3000/");
  });

  it("is null when config.js leaves it empty or is missing", () => {
    window.__SEAMLESS_CONFIG__ = { API_URL: "" };
    expect(getApiUrl()).toBeNull();
    delete window.__SEAMLESS_CONFIG__;
    expect(getApiUrl()).toBeNull();
  });
});
