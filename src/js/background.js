/**
 * Xframey
 * @copyright (c) 2020 Roy Six
 * @license https://github.com/sixcious/xframey/blob/main/LICENSE
 */

/**
 * Background handles all extension-specific background tasks, such as installation and update events, listeners, and
 * supporting chrome.* apis that are only available in the background (such as commands or setting the toolbar icon).
 *
 * Since the extension is designed to primarily be a content script based extension, and because this extension does not
 * have a persistent background, there is little logic contained here, and there is no "state" (objects in memory).
 *
 * @see MV2 Example https://stackoverflow.com/questions/67915399/as-of-chrome-90-cant-modify-response-header-for-x-frame-options
 * @see MV3 Example https://stackoverflow.com/questions/15532791/getting-around-x-frame-options-deny-in-a-chrome-extension/69177790#69177790
 */
const Background = (() => {

  /**
   * Variables
   *
   * @param ID_CHROME  the chrome extension id (used to help determine what browser this is)
   * @param ID_EDGE    the edge extension id (used to help determine what browser this is)
   * @param ID_FIREFOX the firefox extension id (used to help determine what browser this is)
   */
  const ID_CHROME = "";
  const ID_EDGE = "";
  const ID_FIREFOX = "xframey@webextensions";

  let items= {};

  /**
   * Gets the storage default values (SDV) of the extension.
   *
   * Note: Storage.set can only set top-level JSON objects, avoid using nested JSON objects.
   * Instead, prefix keys that should be grouped together with a label e.g. "auto"
   *
   * @returns {*} the storage default values object
   * @private
   */
  function getStorageDefaultValues() {
    console.log("getStorageDefaultValues()");
    return {
      "installVersion": chrome.runtime.getManifest().version, "installDate": new Date().toJSON(), "browserName": getBrowserName(), "firstRun": true, "on": true,
      "toolbarIcon": getPreferredColor(), "buttonSize": 50, "interfaceTheme": false, "interfaceMessages": true, "dynamicSettings": true,
      "mode": "same-origin",
      "headers": ["x-frame-options", "content-security-policy"],
      "instances": []
    };
  }

  /**
   * Gets this browser's name by examining this extension's ID or by inspecting the navigator.userAgent object.
   *
   * @returns {string} the browser's name in all lowercase letters: "chrome", "edge", "firefox"
   * @private
   */
  function getBrowserName() {
    const chromeName = "chrome";
    const edgeName = "edge";
    const firefoxName = "firefox";
    // chrome.runtime.id
    const ID = typeof chrome !== "undefined" && chrome && chrome.runtime && chrome.runtime.id ? chrome.runtime.id : "";
    let browserName = ID === ID_CHROME ? chromeName : ID === ID_EDGE ? edgeName : ID === ID_FIREFOX ? firefoxName : "";
    let method = "chrome.runtime.id:" + ID;
    // navigator.userAgent
    if (!browserName) {
      const UA = typeof navigator !== "undefined" && navigator && navigator.userAgent ? navigator.userAgent : "";
      browserName = UA.includes("Firefox/") ? firefoxName : UA.includes("Edg/") ? edgeName : chromeName;
      method = "navigator.userAgent:" + UA;
    }
    console.log("getBrowserName() - browserName=" + browserName + ", method=" + method);
    return browserName;
  }

  /**
   * Gets the user's preferred icon color. Note this is actually the opposite of what prefers-color-scheme returns.
   * If the preferred color scheme is dark, this returns light and vice versa.
   *
   * @returns {string} the preferred icon color, either "dark" or "light"
   * @private
   */
  function getPreferredColor() {
    let color = "dark";
    if (typeof window !== "undefined" && window.matchMedia) {
      color = window.matchMedia("(prefers-color-scheme: dark)").matches ? "light" : "dark";
    }
    console.log("getPreferredColor() - color=" +  color);
    return color;
  }


  /**
   * Listen for installation changes and do storage/extension initialization work.
   *
   * @param details the installation details
   * @private
   */
  async function installedListener(details) {
    console.log("installedListener() - details=" + JSON.stringify(details));
    const SDV = getStorageDefaultValues();
    // Install:
    if (details.reason === "install") {
      console.log("installedListener() - installing ...");
      await Promisify.storageClear();
      await Promisify.storageSet(SDV);
      // chrome.runtime.openOptionsPage();
    }
    // // Update:
    // else if (details.reason === "update") {
    // }
    startupListener();
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
    items = await Promisify.storageGet();
    // Ensure the chosen toolbar icon is set. Firefox Android: chrome.action.setIcon() not supported
    if (chrome.action.setIcon && items && ["dark", "light"].includes(items.toolbarIcon)) {
      console.log("startupListener() - setting action icon to " + items.toolbarIcon);
      chrome.action.setIcon({
        path : {
          "16": "/img/icon-" + items.toolbarIcon + ".png",
          "24": "/img/icon-" + items.toolbarIcon + ".png",
          "32": "/img/icon-" + items.toolbarIcon + ".png"
        }
      });
    }
    // Firefox: Set badge text color to white always instead of using default color-contrasting introduced in FF 63
    if (typeof browser !== "undefined" && browser.action && browser.action.setBadgeTextColor) {
      browser.action.setBadgeTextColor({color: "white"});
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
   * Important: This function CANNOT be async or it will fail to work.
   *
   * @param details object containing details of the headers received
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
   * @see https://content-security-policy.com
   * @private
   */
  function webRequestOnHeadersReceivedListener(details) {
    console.log("webRequestOnHeadersReceivedListener() - the chrome.webRequest.onHeadersReceived listener is on!");
    const mode = items && items.mode ? items.mode : "OFF";
    const records = [];
    const headers = details.responseHeaders;
    for (let header of headers) {
      console.log("webRequestOnHeadersReceivedListener() - pre:" + header.name + "=" + header.value);
      const headerName = header.name.toLowerCase();
      const headerValue = header.value;
      if (headerName === "x-frame-options") {
        header.value = xFrameOptions(header, mode);
      } else if (headerName === "content-security-policy") {
        header.value = contentSecurityPolicy(header, mode);
      }
      const record = {};
      record.name = header.name;
      record.value = header.value;
      record.changed = header.value !== headerValue;
      if (record.changed) {
        record.oldValue = headerValue;
      }
      records.push(record);
      console.log("webRequestOnHeadersReceivedListener() - pos:" + header.name + "=" + header.value);
    }
    // Sort by
    records.sort((a, b) => a.name > b.name ? 1 : -1);
    // const tabs = await Promisify.tabsQuery();
    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
      const instances = items.instances.filter(instance => instance.tabId !== tabs[0].id);
      const instance = {};
      instance.tabId = tabs[0].id;
      instance.headers = records;
      instances.push(instance);
      console.log("instances=");
      console.log(instances);
      Promisify.storageSet({"instances": instances});
    });
    return { responseHeaders: headers };
  }

  // XFRAME: ALLOW-FROM not supported in Chrome, only in Firefox 18+ and may not take multiple URLs (unsure)
  function xFrameOptions(header, mode) {
    console.log("xframeOptions() - header.name=" + header.name + ", mode=" + mode);
    if (mode === "same-origin") {
      header.value = header.value.replace(/DENY/i, "SAMEORIGIN");
    } else if (mode === "cross-origin") {
      header.value = "";
    }
    return header.value;
  }

  //https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy
  function contentSecurityPolicy(header, mode) {
    console.log("contentSecurityPolicy() - header.name=" + header.name + ", header.value=" + header.value + ", mode=" + mode);
    // Note: I Totally missed "frame-ancestors" pre 2022; that was why it was failing on Xframey Problem URLs!
    const directives = ["base-uri", "child-src", "connect-src", "default-src", "font-src", "form-action", "frame-ancestors", "frame_ancestors", "frame-src", "img-src", "media-src", "object-src", "plugin-types", "report-uri", "sandbox", "script-src", "style-src"];
    const policies = header.value.split(/;\s*/);
    header.value = "";
    for (const policy of policies) {
      const values = policy.split(/\s+/);
      const directive = values[0].trim().toLowerCase();
      console.log("contentSecurityPolicy() - directive=" + directive);
      if (directives.includes(directive)) {
        let self = false;
        for (let i = 1; i < values.length; i++) {
          const value = values[i].trim().toLowerCase();
          console.log("contentSecurityPolicy() - value=" + value);
          if (value === "'self'") {
            console.log("got a self");
            self = true;
          } else if (value === "'none'") {
            console.log("got a none");
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
    console.log("contentSecurityPolicy() - after changes, header.value=" + header.value);
    return header.value;
  }

  // Background Listeners
  chrome.runtime.onInstalled.addListener(installedListener);
  chrome.runtime.onStartup.addListener(startupListener);


  // MV2 Version Code:
  // chrome.webRequest.onHeadersReceived.addListener(webRequestOnHeadersReceivedListener, { urls: ["<all_urls>"], types: ["main_frame", "sub_frame"]}, ["blocking", "responseHeaders", "extraHeaders"]);
  chrome.webRequest.onHeadersReceived.addListener(webRequestOnHeadersReceivedListener, { urls: ["<all_urls>"] }, ["blocking", "responseHeaders", "extraHeaders"]);

  //MV3 Version Code:
  // const rule = {
  //   id: 1,
  //   priority: 1,
  //   action: { type: "modifyHeaders", responseHeaders: [
  //     { header: "X-FRAME-OPTIONS", operation: "set", value: "SAME-ORIGIN" },
  //     // { header: "CONTENT-SECURITY-POLICY", operation: "remove" }
  //     ] },
  //   condition: { resourceTypes: ["sub_frame"] }
  // };
  // chrome.declarativeNetRequest.updateDynamicRules({
  //   removeRuleIds: [rule.id],
  //   addRules: [rule]
  // });

  // MV3 / MV2 convenience code
  if (!chrome.action) {
    chrome.action = chrome.browserAction;
  }

})();