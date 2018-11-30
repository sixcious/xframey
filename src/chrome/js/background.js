/**
 * X-Frame Same Origin
 * @file background.js
 * @author Roy Six
 * @license LGPL-3.0
 */

var Background = (() => {

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
    return {
      responseHeaders: details.responseHeaders.map(header => {
        console.log("webRequestOnHeadersReceivedListener() - header:" + header.name + "=" + header.value);
        const headerName = header.name.toLowerCase();
        // XFRAME: ALLOW-FROM not supported in Chrome, only in Firefox 18+ and may not take multiple URLs (unsure)
        if (headerName === "x-frame-options") {
          //header.value = header.value.replace(/DENY/i, "SAMEORIGIN");
          header.value = "SAMEORIGIN";
          console.log("webRequestOnHeadersReceivedListener() - changed:" + header.name + "=" + header.value);
          // const values = header.value.split(/\s*/);
          // header.value = "";
          // let self = false;
          // for (let value of values) {
          //   const valuee = value.trim().toUpperCase();
          //   if (valuee === "DENY") {
          //     value = "";
          //   } else if (valuee === "SAMEORIGIN") {
          //     self = true;
          //   }
          // }
          // if (!self) {
          //   values.push("SAMEORIGIN");
          // }
          // header.value = values.filter(Boolean).join(" ");
        } else if (headerName === "content-security-policy") {
          const csps = header.value.split(/;\s*/);
          header.value = "";
          for (const csp of csps) {
            const values = csp.split(/\s+/);
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
  chrome.webRequest.onHeadersReceived.addListener(webRequestOnHeadersReceivedListener, { urls: ["<all_urls>"], types: ["main_frame", "sub_frame"]}, ["blocking", "responseHeaders"]);

})();