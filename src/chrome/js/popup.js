/**
 * URL Incrementer
 * @file popup.js
 * @author Roy Six
 * @license LGPL-3.0
 */

var Popup = (() => {

  // The DOM elements cache
  const DOM = {};

  // The _ temporary instance and real instance caches, storage caches, backgroundPage and downloadPreview cache, and timeouts object
  let instance = {},
      items = {},
      backgroundPage = {};

  /**
   * Initializes the Popup window. This script is set to defer so the DOM is guaranteed to be parsed by this point.
   *
   * @private
   */
  async function init() {
    const ids = document.querySelectorAll("[id]"),
          i18ns = document.querySelectorAll("[data-i18n]");
    // Cache DOM elements
    for (const element of ids) {
      DOM["#" + element.id] = element;
    }
    // Set i18n (internationalization) text from messages.json
    for (const element of i18ns) {
      element[element.dataset.i18n] = chrome.i18n.getMessage(element.id.replace(/-/g, '_').replace(/\*.*/, ''));
    }
    // Add Event Listeners to the DOM elements
    DOM["#mode-radios"].addEventListener("change", function(event) {
      chrome.storage.local.set({
        "mode": event.target.value
      });
    });
    DOM["#headers-checkboxes"].addEventListener("change", function(event) {
      chrome.storage.local.set({"headers":
        [DOM["#x-frame-options-input"].checked ? DOM["#x-frame-options-input"].value : "",
         DOM["#content-security-policy-input"].checked ? DOM["#content-security-policy-input"].value : ""].filter(Boolean)
      });
      DOM["#policies"].className = DOM["#content-security-policy-input"].checked ? "display-block" : "display-none";
    });
    DOM["#policies-checkboxes"].addEventListener("change", function(event) {
      chrome.storage.local.set({"policies":
        [DOM["#base-uri-input"].checked ? DOM["#base-uri-input"].value : "",
         DOM["#child-src-input"].checked ? DOM["#child-src-input"].value : ""].filter(Boolean)
      });
    });
    // Initialize popup content (1-time only)
    const tabs = await Promisify.getTabs();
    items = await Promisify.getItems();
    backgroundPage = await Promisify.getBackgroundPage();
    // Firefox: Background Page is null in Private Window
    if (!backgroundPage) {
      DOM["#messages"].className = DOM["#private-window-unsupported"].className = "display-block";
      return;
    }
    instance = backgroundPage.Background.getInstance(tabs[0].id);

    // Set values
    DOM["#instance"].textContent = JSON.stringify(instance);
    DOM["#mode-same-origin-input"].checked = items.mode === "same-origin";
    DOM["#mode-cross-origin-input"].checked = items.mode === "cross-origin";
    DOM["#mode-no-action-input"].checked = items.mode === "no-action";
    DOM["#x-frame-options-input"].checked = items.headers.includes("x-frame-options");
    DOM["#content-security-policy-input"].checked = items.headers.includes("content-security-policy");
    DOM["#policies"].className = items.headers.includes("content-security-policy") ? "display-block" : "display-none";
    DOM["#base-uri-input"].checked = items.policies.includes("base-uri");
    DOM["#child-src-input"].checked = items.policies.includes("child-src");
  }

  // Initialize Popup
  init();

})();