# Xframey
Xframey is an extension in beta that allows iframes to be inserted into a web page. It sets the `X-Frame-Options` header to `SAME ORIGIN` and `Content-Security-Policy` headers to `'self'`, overriding any potential `DENY` values set by the server.

This is useful for extensions that wish to allow websites to frame themselves (like Infy Scroll), and is a relatively safer alternative as compared to allowing cross-origins.

Important: Xframey is still a work in progress. You may wish to instead use another app or extension from your web store in the mean time.
