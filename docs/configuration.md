Proxy Configuration
===================

The HbbTV proxy allows some configuration to modify its behavior. The configuration page can be on [`http://raspberrypi.local:8080/settings`](http://raspberrypi.local:8080/settings).

## Autoload

The autoload setup allows you to automatically load an HbbTV app no matter on which channel you are on. If the proxy is able to connect to the TV it will send a command to it to switch the HbbTV application. On the config page enter the url to your desired HbbTV application and apply some key words to whitelist the behavior. The proxy checks if one of the comma separated key words can be found in the requested URI (independent whether it is an URL to an HbbTV app or an image).

For example if you want to autoload the Fraunhofer Fokus Launcher App put this into the URL field:

```
http://193.174.152.29/ce/launcher-fokus/landing.html
```

And whitelist requests with the following keywords:

```
fraunhofer,fokus
```

This will ensure that the launcher app doesn't restart when a sub page is requested.
