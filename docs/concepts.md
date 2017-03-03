Concepts
========

# Objective and Scope

The goal of this project is to implement a platform that not only helps developer to build HbbTV applications but also provides an automation driver that allows to run automation scripts written in any computer language on arbitrary TVs, that support the HbbTV standard. It will be based on the well known W3C WebDriver protocol that provides the technological infrastructure for todays desktop and mobile test automation. A testbed will provide developers a framework that can be used when connected to the Fraunhofer network or even commercialised as a product for other broadcast companies.


# Automation Driver

An HbbTV application is displayed on the TV using a proprietary browser that displays the website with a transparent background. The browser itself runs on the SmartTV and has to interfaces to the outside world. Therefor the only chance to establish any connection to the outside is via some script that is running on the TV.<br>
The TV exchanges data via its network interfaces: either WLAN or ethernet. Once connected to the internet the HbbTV script can request any URI possible. There is no limitation by the protocol or TV. The HbbTV standard comes with support for WebSockets that allows to create a stateful connection to any arbitrary server. This can be used to gain access to the runtime process on the TV.

## Connecting to SmartTV

To build the WebSocket connection to the TV there has to be a script that establish that connection from the TV. That script can be either part of the HbbTV application or be somehow injected into the page automatically. The first solution would require additional work from the developer who has to inject it depending on the environment as it is not desired to have such test scripts in production. To keep the whole automation process self contained and somehow blackboxed the Appium HbbTV Driver injects the script by acting as a proxy. To make this work the driver needs to be the gateway to the internet for the TV. This can be achieved in multiple ways. A practical solution is to add another computer in front of the TV. This can be easily managed by a Raspberry Pi. By linking the TV to the Raspberry via ethernet and connecting the Raspberry to the internet you get a self contained computation unit that can forward and tweak http packages in order to inject or modify any packages coming from or to the TV.

### Component Setup

![Component Setup](/docs/assets/setup.png)

## Proxy

The job of the proxy is it to catch all HTTP packages that comes from the TV, forward them to the destination and modify the response before sending it back to the TV. In general the proxy is only interested in packages that contain an HbbTV application. All other requests for assets or streams are untouched and forwarded right away. The job of the proxy is it to inject the script so that it can establish a WebSocket connection to the HbbTV application and therefor to the browser context of the TV. It also is responsible for injecting the actual scripts that use the connection to provide a certain service like automating the page via the Webdriver protocol or debugging the app using the dev tools.

## Inject scripts

The proxy only injects scripts if certain indices are given that the request is actually to fetch an HbbTV application. There is no interest in modifying any assets or 3rd party files. The app should be run smoothly as if no proxy would be in between. Therefor all scripts get injected in a way that they don't modify or disturb the functionality of the HbbTV application.

## WebSocket connections

The first script that gets injected by the proxy is a simple JavaScript snippet that connects to a [Socket.io](http://socket.io/) server that was created by the proxy itself. This allows to have a stateful and full duplex communication channel between the app an the Appium HbbTV Driver.

## Services

Integrated into the proxy are services that make use of the connection between server and TV. For the scope of this thesis there will be two services being implemented: a webdriver and a debugger service. A service can be seen as a self contained script that gets injected into the website and serves a certain purpose.

### Webdriver Service

The Webdriver services allows to run Selenium commands on the TV. It has implemented a subset of the [Webdriver spec](https://www.w3.org/TR/webdriver/#element-send-keys) and acts as driver for all commands. Therefor it can be seen as the executor for a Selenium command whether it is fetching an element or emulating a remote control event. It is used by the Appium automation driver which sends certain socket requests based on the Selenium command that is executed.

### Debugger Service

To enable remote debugging of the HbbTV app the Debugger Service reimplements all events and methods of the [Chrome Remote Debugging Protocol](https://chromedevtools.github.io/debugger-protocol-viewer/tot/). It starts a Socket server (on port 9222) itself and forwards the methods (coming from the dev tools or a different client) to the frontend (the TV). Since some remote debugging domains needs access to package informations the service also registers itself as middleware to the proxy.


# HbbTV vs. Native Context

There can be two perspectives on how to simulate user interactions on the TV. One possibility is to use the interfaces the TV provides which are accessible via the network and used by 3rd party applications (e.g. mobile screen sharing apps). Depending on the manufacturer these interfaces allow certain functionality independent on what is executed on the TV. For example it is possible to simulate remote control actions no matter if the is watching TV or using an internal application (e.g. settings app). I call this perspective a native context since it allows access over native functions of the TV.<br>
The other way to control things is by injecting scripts to certain packages, mostly HbbTV applications or native apps, that get requested from the TV. By establishing a connection to whatever is executing the web app allows to get in depth access to it. However the access is limited to the context the app is running in. An HbbTV application can't change a channel nor switch off the TV but allows to get information about elements that are being displayed in the app.<br>
The Appium HbbTV Driver will support both contexts whereby the focus is on automating in the HbbTV context. Even though the native context provides a lot of access to the device, it will take a lot of effort to figure out what is supported by the manufacturer since this is usually not documented. Also every manufacturer provides their own interfaces which are usually different, sometimes even between models of the same manufacturer.
