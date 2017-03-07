![Appium HbbTV Driver](/docs/assets/appium-hbbtv-driver.png)

Appium HbbTV Driver
===================

[![Build Status](https://travis-ci.com/christian-bromann/appium-hbbtv-driver.svg?token=px5tFzamGvYgujeyYVEp&branch=master)](https://travis-ci.com/christian-bromann/appium-hbbtv-driver)
[![Dependency Status](https://www.versioneye.com/user/projects/58b987e62ff6830042beedd8/badge.svg?style=flat-square)](https://www.versioneye.com/user/projects/58b987e62ff6830042beedd8)

***

The Appium HbbTV Driver is a test automation tool for running automated tests on SmartTVs with
integrated HbbTV functionality. It is part of the [Appium](https://github.com/appium/appium)
mobile test automation tool chain.

# Requirements

To run the Appium HbbTV Driver you need the following hardware components:

- A SmartTV that supports HbbTV >= 1.2
- A Raspberry Pi (preferably v3) with Raspbian installed
- An ethernet cabel to connect the SmartTV with the Raspberry Pi
- A working internet connection the Raspberry Pi can connect to via its wireless component

# Hardware Setup

In order to allow the Raspberry Pi to interfere network packages from the TV you need to setup the TV in a way that it gets the internet connection from the Raspberry Pi. The Appium HbbTV Driver will take care of forwarding the packages back and forth. Make sure the Pi has access to the internet. Connect the TV via ethernet cable to the Raspberry Pi. Then either use the wireless component of the Pi to connect to the internet or connect another ethernet adapter via USB. The basic setup can look like:

![Appium HbbTV Driver](/docs/assets/connection.png)

# Installation

First install all (un)necessary Ubuntu packages that might be needed on the Raspberry Pi:

```sh
$ apt-get update
$ apt-get upgrade
$ apt-get install -y curl wget vim openssh-client libxml2 git python2.7 python2.7-dev python-pip build-essential libssl-dev git dnsmasq
```

Add HbbTV Mime-Type to `/etc/mime.types` by adding:

```
application/vnd.hbbtv.xhtml+xml                 hbbtv
```

at the end to the file. Also you need to enable IP-Forwarding by uncommenting:

```
net.ipv4.ip_forward=1
```

in `/etc/sysctl.conf`. Next install Node.js `v7.4.0` using [NVM](https://github.com/creationix/nvm):

```sh
$ curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.29.0/install.sh | bash
$ source $NVM_DIR/nvm.sh
$ nvm install 7.4.0
$ nvm alias default 7.4.0
$ nvm use default
```

Download the Appium HbbTV Driver and install its dependencies. Make sure you can access the repository by setting up an access key and publishing it on GitLab.

```sh
$ cd /home/pi/
$ git clone git@gitlab.fokus.fraunhofer.de:christian.bromann/appium-hbbtv-driver.git
$ cd appium-hbbtv-driver
$ npm install
```

Last but not least start the server with:

```sh
$ npm start
```

You should see all log messages in stdout as well as the TV should now start to show HbbTV apps of the channel you are on.

# Development

To sync files between your dev environment and the Raspberry Pi install [realsync](http://en.dklab.ru/lib/dklab_realsync/) on your machine. Then make sure you have the same NodeJS version running like on the Pi (`v7.4.0`). Next clone the repository and install all NPM dependencies. After you installed realsync open a separate terminal and call it:

```sh
# usage on mac
/opt/dklab_realsync/realsync
```

It will run you through a configuration wizard. After setting host and user for SSH access properly it will try to connect to the Raspberry Pi. This usually fails because the connection timeout is too short. Kill the process and adapt the configs from `/config/realsync`. After rerunning the realsync command it should be able to connect.

In order to autocompile all NodeJS files and build service bundles run the following command in another terminal window:

```sh
$ npm run dev
```

Last but not least run the server on the Raspberry Pi in dev mode by executing:

```sh
# on the Raspberry Pi
$ npm run start:dev
```

If you now change a file realsync automatically uploads it to the Raspberry Pi where the server detects the file change and restarts automatically. Also changes to the service bundles get uploaded. All you need to do to update the service bundle is to switch the channel so the TV refetches the HbbTV app with the update injected service script.

# Troubleshooting

## Detect IP address of Raspberry Pi

If your Raspberry Pi connects to the Internet via its wireless module you sometimes don't know which IP address it got assigned by the router. To get the address just ping the PI using the local address:

```sh
$ ping raspberrypi.local
PING raspberrypi.local (192.168.1.7): 56 data bytes
64 bytes from 192.168.1.7: icmp_seq=0 ttl=64 time=14.639 ms
64 bytes from 192.168.1.7: icmp_seq=1 ttl=64 time=12.252 ms
...
```

# More Documentation

- [Concepts](/docs/concepts.md)
- [Network Setup](/docs/network.md)
- [Proxy Configuration](/docs/configuration.md)
