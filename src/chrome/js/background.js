/**
 * X-Frame CSP Buster
 * @file background.js
 * @author Roy Six
 * @license LGPL-3.0
 */

var Background = (() => {

  // The storage default values. Note: Storage.set can only set top-level JSON objects, avoid using nested JSON objects (instead, prefix keys that should be grouped together with a label e.g. "auto")
  const STORAGE_DEFAULT_VALUES = {
    "mode":     "same-origin",
    "headers":  ["x-frame-options", "content-security-policy"],
    "policies": ["base-uri", "child-src", "connect-src", "default-src", "font-src", "form-action", "frame_ancestors", "frame-src", "img-src", "media-src", "object-src", "plugin-types", "report-uri", "sandbox", "script-src", "style-src"]
  },

  // The individual tab instances in Background memory. Note: We never save instances in storage
  instances = new Map();

  // The storage items cache in Background memory.
  let items = {};

  /**
   * Gets the instance.
   *
   * @param tabId the tab id to lookup this instance by
   * @returns instance the tab's instance
   * @public
   */
  function getInstance(tabId) {
    return instances.get(tabId);
  }

  /**
   * TODO
   *
   * @param items_
   */
  function setItems(items_) {
    items = items_;
  }

  /**
   * Listen for installation changes and do storage/extension initialization work.
   *
   * @param details the installation details
   * @private
   */
  async function installedListener(details) {
    // Install: Open Options Page
    if (details.reason === "install") {
      console.log("installedListener() - details.reason=" + details.reason);
      chrome.storage.local.set(STORAGE_DEFAULT_VALUES);
    }
    await startupListener();
  }

  /**
   * The extension's background startup listener that is run the first time the extension starts.
   * For example, when Chrome is started, when the extension is installed or updated, or when the
   * extension is re-enabled after being disabled.
   *
   * @private
   */
  async function startupListener() {
    console.log("startupListener()");
    items = await Promisify.getItems();
    // // Ensure the chosen toolbar icon is set. Firefox Android: chrome.browserAction.setIcon() not supported
    // if (chrome.browserAction.setIcon && items && ["dark", "light", "confetti", "urli"].includes(items.iconColor)) {
    //   console.log("startupListener() - setting browserAction icon to " + items.iconColor);
    //   chrome.browserAction.setIcon({
    //     path : {
    //       "16": "/img/16-" + items.iconColor + ".png",
    //       "24": "/img/24-" + items.iconColor + ".png",
    //       "32": "/img/32-" + items.iconColor + ".png"
    //     }
    //   });
    // }
    // Firefox: Set badge text color to white always instead of using default color-contrasting introduced in FF 63
    if (typeof browser !== "undefined" && browser.browserAction && browser.browserAction.setBadgeTextColor) {
      browser.browserAction.setBadgeTextColor({color: "white"});
    }
  }

  /**
   * A chrome.webRequest.onHeadersReceived listener that is fired when HTTP response headers of a request have been received.
   * Changes the HTTP Header X-Frame-Options value to SAME-ORIGIN to allow the use of embedded iframes on the page.
   *
   * This is needed if a website sends a X-Frame-Options with a value of DENY or ALLOW-FROM.
   *
   * X-Frame-Options:
   * DENY, SAMEORIGIN, ALLOW-FROM https://example.com
   *
   * Content-Security-Policy:
   * default-src, script-src, style-src, img-src, connect-src, font-src, object-src, media-src, frame-src, child-src,
   * sandbox, report-uri, form-action, frame-ancestors, plugin-types
   *
   * @param details object containing details of the headers received
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
   * @see https://content-security-policy.com
   * @private
   */
  function webRequestOnHeadersReceivedListener(details) {
    console.log("webRequestOnHeadersReceivedListener() - the chrome.webRequest.onHeadersReceived listener is on!");
    const instance = {};
    return {
      responseHeaders: details.responseHeaders.map(header => {
        console.log("webRequestOnHeadersReceivedListener() - header:" + header.name + "=" + header.value);
        const headerName = header.name.toLowerCase();
        // XFRAME: ALLOW-FROM not supported in Chrome, only in Firefox 18+ and may not take multiple URLs (unsure)
        if (headerName === "x-frame-options") {
          header.value = header.value.replace(/DENY/i, "SAMEORIGIN");
          console.log("webRequestOnHeadersReceivedListener() - changed:" + header.name + "=" + header.value);
        } else if (headerName === "content-security-policy") {
          const policies = header.value.split(/;\s*/);
          header.value = "";
          for (const policy of policies) {
            const values = policy.split(/\s+/);
            const directive = values[0].trim().toLowerCase();
            console.log("directive=" + directive);
            if (directive.endsWith("-src") || directive === "frame-ancestors" || directive === "form-action") {
              let self = false;
              for (let i = 1; i < values.length; i++) {
                const value = values[i].trim().toLowerCase();
                console.log("value=" + value);
                if (value === "'self'") {
                  self = true;
                } else if (value === "'none'") {
                  values[i] = '';
                }
              }
              if (!self) {
                values.push("'self'");
              }
            }
            // Note: filter(Boolean) removes empty values e.g. if we replaced 'none' with ''
            header.value += values.filter(Boolean).join(" ") + "; ";
          }
          console.log("header.value=");
          console.log(header.value);

          console.log("webRequestOnHeadersReceivedListener() - changed:" + header.name + "=" + header.value);
        }
        return header;
      })
    };
  }

  // Background Listeners
  chrome.runtime.onInstalled.addListener(installedListener);
  chrome.runtime.onStartup.addListener(startupListener);
  chrome.webRequest.onHeadersReceived.addListener(webRequestOnHeadersReceivedListener, { urls: ["<all_urls>"], types: ["main_frame", "sub_frame"]}, ["blocking", "responseHeaders"]);

  // Return Public Functions
  return {
    getInstance: getInstance,
    setItems: setItems
  };

})();