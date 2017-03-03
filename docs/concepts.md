Concepts
========

# Objective and Scope

The goal of this project is to implement a platform that not only helps developer to build HbbTV applications but also provides an automation driver that allows to run automation scripts
written in any computer language on arbitrary TVs, that support the HbbTV standard. It will be
based on the well known W3C WebDriver protocol that provides the technological infrastructure
for todays desktop and mobile test automation. A testbed will provide developers a framework
that can be used when connected to the Fraunhofer network or even commercialised as a product
for other broadcast companies.


# Automation Driver

An HbbTV application is displayed on the TV using a proprietary browser that displays the website
with a transparent background. The browser itself runs on the SmartTV and has to interfaces to the
outside world. Therefor the only chance to establish any connection to the outside is via
some script that is running on the TV.<br>
The TV exchanges data via its network interfaces: either WLAN or ethernet. Once connected to the
internet the HbbTV script can request any URI possible. There is no limitation by the protocol or
TV. The HbbTV standard comes with support for WebSockets that allows to create a stateful connection
to any arbitrary server. This can be used to gain access to the runtime process on the TV.

## Raspberry Pi

## Proxy

## Inject scripts

## WebSocket connection

## Webdriver


# HbbTV vs. Native Context
