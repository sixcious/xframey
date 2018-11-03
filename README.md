# xframe-same-origin
An extension that sets X-Frame-Options headers to "SAME ORIGIN", overriding any potential "DENY" values set by the server.
This is useful for other extensions that need this behavior like Infy Scroll, and it should be relatively safe as compared to allowing cross-origins.