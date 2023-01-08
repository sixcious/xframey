# Xframey
Xframey is an extension in beta that allows iframes to be inserted into a web page. It sets the `X-Frame-Options` header to `SAME ORIGIN` and `Content-Security-Policy` headers to `'self'`, overriding any potential `DENY` values set by the server.

This is useful for extensions that wish to allow websites to frame themselves (like Infy Scroll), and is a relatively safer alternative as compared to allowing cross-origins.

Important: Xframey is still a work in progress. You may wish to instead use another app or extension from your web store in the mean time.

## Installation
Installing from GitHub is super simple. First, [download the zip](https://github.com/sixcious/xframey/archive/refs/heads/main.zip) and unzip it. Then:

#### Chrome and Edge
1. [Follow these instructions](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked) to enable Developer Mode and load an Unpacked Extension

#### Firefox
1. [Follow these instructions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension#installing) to load a Temporary Add-on

**Finally**: When prompted for the location, select the `src/base` folder (Firefox: select `manifest.json`) and it will install.

**Important**: There is no version update path for the GitHub build.
