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
   * This is needed if a website sends a X-Frame-Options with a value of DENY or ALLOW-FROM.
   * X-Frame-Options: DENY, SAMEORIGIN, ALLOW-FROM https://example.com
   * Content-Security-Policy: frame-ancestors 'none'; frame-src 'none';
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
        // TODO: Need to deal with ALLOW-FROM and CSP equivalent...
        const headerName = header.name.toLowerCase();
        if (headerName === "x-frame-options") {
          header.value = header.value.replace(/DENY/i, "SAMEORIGIN");
          console.log("webRequestOnHeadersReceivedListener() - changed:" + header.name + "=" + header.value);
        } else if (headerName === "content-security-policy") {
          header.value = header.value.replace(/frame-ancestors 'none'/i, "frame-ancestors 'self'");
          header.value = header.value.replace(/frame-src 'none'/i, "frame-src 'self'");
          console.log("webRequestOnHeadersReceivedListener() - changed:" + header.name + "=" + header.value);
        }
        return header;
      })
    };
  }

  // Background Listeners
  chrome.webRequest.onHeadersReceived.addListener(webRequestOnHeadersReceivedListener, { urls: ["<all_urls>"], types: ["main_frame", "sub_frame"]}, ["blocking", "responseHeaders"]);

})();