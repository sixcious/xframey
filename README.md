# Xframey
Xframey is an extension in beta that allows iframes to be inserted into a web page. It sets the `X-Frame-Options` header to `SAME ORIGIN` and `Content-Security-Policy` headers to `'self'`, overriding any potential `DENY` values set by the server.

This is useful for extensions that wish to allow websites to frame themselves (like [Infy Scroll](https://github.com/sixcious/infy-scroll)), and is a relatively safer alternative as compared to allowing cross-origins.

## Installation
Installing from GitHub is super simple. First, [download the zip](https://github.com/sixcious/xframey/archive/refs/heads/main.zip) and unzip it. Then:

#### Chrome and Edge
- [Follow these instructions](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked) to enable Developer Mode and load an Unpacked Extension

#### Firefox
- [Follow these instructions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension#installing) to load a Temporary Add-on

**Finally**: When prompted for the location, select the `src/base` folder (Firefox: select `manifest.json`) and it will install.

**Important**: There is no version update path for the GitHub build.

## Alternatives
If you're not able to install Xframey locally from GitHub, you may wish to instead use another app or extension from your web store in the mean time. I can't recommend anything officially, but here are a couple examples:
- Chrome and Edge: [Framer](https://chrome.google.com/webstore/detail/framer-make-iframes-possi/adohambhfalbpaenaclmhhjhilmakmoo)
- Firefox: [Ignore X-Frame-Options Header](https://addons.mozilla.org/firefox/addon/ignore-x-frame-options-header/)
