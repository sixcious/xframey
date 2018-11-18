/**
 * X-Frame Same Origin
 * @file background.js
 * @author Roy Six
 * @license LGPL-3.0
 */

var Background = (() => {

  /**
   * The chrome.webRequest.onHeadersReceived listener that is added if scroll TODO is enabled.
   * Fired when HTTP response headers of a request have been received.
   * Changes the HTTP Header X-Frame-Options value to SAME-ORIGIN to allow the use of embedded iframes on the page.
   * This is needed if a website sends a X-Frame-Options with a value of DENY or ALLOW-FROM.
   * X-Frame-Options: DENY, SAMEORIGIN, ALLOW-FROM https://example.com
   *
   * @param details object containing details of the headers received
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
   * @private
   */
  function webRequestOnHeadersReceivedListener(details) {
    console.log("webRequestOnHeadersReceivedListener() - the chrome.webRequest.onHeadersReceived listener is on!");
    return {
      responseHeaders: details.responseHeaders.map(header => {
        console.log("webRequestOnHeadersReceivedListener() - header:" + header.name + "=" + header.value);
        const headerName = header.name.toLowerCase(),
              headerValue = header.value.toLowerCase();
        if (headerName === "x-frame-options") {
          header.value = "SAMEORIGIN";
          console.log("webRequestOnHeadersReceivedListener() - changed:" + header.name + "=" + header.value);
        } else if (headerName === "content-security-policy") {
          // todo check frame-src and frame-ancestors and frame... who knows...
          if (headerValue.includes("frame-ancestors")) {
            header.value = header.value.replace("frame-ancestors 'none'", "frame-ancestors 'self'");
            console.log("webRequestOnHeadersReceivedListener() - changed:" + header.name + "=" + header.value);
          }
          if (headerValue.includes("frame-src")) {
            // TODO
            console.log("webRequestOnHeadersReceivedListener() - changed:" + header.name + "=" + header.value);
          }
        }
        return header;
      })
    };
  }

  // Background Listeners
  chrome.webRequest.onHeadersReceived.addListener(webRequestOnHeadersReceivedListener, { urls: ["<all_urls>"], types: ["main_frame", "sub_frame"]}, ["blocking", "responseHeaders"]);

})();