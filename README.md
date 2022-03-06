# Xframey
An extension that sets X-Frame-Options headers to "SAME ORIGIN" and Content-Security-Policy headers to 'self', overriding any potential "DENY" values set by the server.
This is useful for extensions that wish to allow websites to frame themselves (like Infy Scroll), and is a relatively safer alternative as compared to allowing cross-origins.

Important: This hasn't been updated in several years and is a current work in progress.
