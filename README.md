# x-frame-same-origin
An extension that sets X-Frame-Options headers to "SAME ORIGIN" and Content-Security-Policy headers to 'self', overriding any potential "DENY" values set by the server.
This is useful for extensions that wish to allow websites to frame themselves (like Infy Scroll), and is a relatively safer alternative as compared to allowing cross-origins.
