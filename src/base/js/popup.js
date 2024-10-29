/**
 * Xframey
 * @copyright (c) 2020 Roy Six
 * @license https://github.com/sixcious/xframey/blob/main/LICENSE
 */

var Popup = (() => {

  // The DOM elements cache
  const DOM = {};

  // The _ temporary instance and real instance caches, storage caches, backgroundPage and downloadPreview cache, and timeouts object
  let instance;
  let items;
  let tabs;

  /**
   * Initializes the Popup window. This script is set to defer so the DOM is guaranteed to be parsed by this point.
   *
   * @private
   */
  async function init() {
    // If we don't have chrome, display an error message. Note: Firefox allows Private Window Installation, which is primarily the reason why we need this check (though less so in the Popup)
    if (typeof chrome === "undefined") {
      console.log("init() - error: chrome is undefined");
      document.getElementById("messages").className = "display-flex";
      document.getElementById("popup-error-reason").textContent = "The chrome object is undefined! This indicates a severe error as chrome is the base object in the Extension API.";
      return;
    }
    const ids = document.querySelectorAll("[id]");
    const i18ns = document.querySelectorAll("[data-i18n]");
    const tooltips = document.querySelectorAll("[aria-label][aria-describedby='tooltip']");
    // Cache DOM elements
    for (const element of ids) {
      DOM["#" + element.id] = element;
    }
    // Set i18n (internationalization) text from messages.json
    for (const element of i18ns) {
      element[element.dataset.i18n] = chrome.i18n.getMessage((element.dataset.id ? element.dataset.id : element.id).replace(/-/g, '_').replace(/\*.*/, ''));
    }
    // Set Tooltip text from messages.json
    for (const element of tooltips) {
      element.setAttribute("aria-label", chrome.i18n.getMessage(element.getAttribute("aria-label").replace(/-/g, '_').replace(/\*.*/, '')));
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
    tabs = await Promisify.tabsQuery();
    items = await Promisify.storageGet();
    console.log("items=");
    console.log(items);
    // instance = items.instances[tabs[0].id];
    instance = items.instances?.find(instance => instance.tabId === tabs[0].id);
    console.log("instance=");
    console.log(instance);
    // backgroundPage = await Promisify.getBackgroundPage();
    // // Firefox: Background Page is null in Private Window
    // if (!backgroundPage) {
    //   DOM["#messages"].className = DOM["#private-window-unsupported"].className = "display-block";
    //   return;
    // }
    // instance = backgroundPage.Background.getInstance(tabs[0].id);

    // Set values
    DOM["#mode-same-origin-input"].checked = items.mode === "same-origin";
    DOM["#mode-cross-origin-input"].checked = items.mode === "cross-origin";
    DOM["#mode-no-action-input"].checked = items.mode === "no-action";
    DOM["#x-frame-options-input"].checked = items.headers?.includes("x-frame-options");
    DOM["#content-security-policy-input"].checked = items.headers.includes("content-security-policy");
    DOM["#policies"].className = items.headers?.includes("content-security-policy") ? "display-block" : "display-none";
    DOM["#base-uri-input"].checked = items.policies?.includes("base-uri");
    DOM["#child-src-input"].checked = items.policies?.includes("child-src");

    //DOM["#instance"].textContent = JSON.stringify(instance);


    const headers = instance?.headers;
    const tbody = DOM["#headers-tbody"];
    const template = DOM["#headers-tr-template"];
    const trs = [];
    console.log("instance.headers=");
    console.log(headers);
    if (headers && headers.length > 0) {
      for (const header of headers) {
        const tr = template.content.children[0].cloneNode(true);
        tr.children[0].textContent = header.name;
        tr.children[1].textContent = header.value;
        tr.children[2].textContent = header.changed + (header.changed ? " - " + header.oldValue : "");
        trs.push(tr);
      }
      // Remove all existing rows in case the user resets the options to re-populate them
      // Note: Node.replaceChildren() is only supported since Chrome 86+, otherwise need to do tbody.deleteRow() and tbody.appendChild(tr) @see https://stackoverflow.com/a/65413839
      tbody.replaceChildren(...trs);
      MDC.tables.get("headers-data-table").layout();
    }

  }

  // Initialize Popup
  init();

})();
