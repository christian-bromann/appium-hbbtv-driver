Network Setup
=============

The Raspberry Pi has to act as middlemen between SmartTV and network. The following explains how to setup the Pi to connect properly without doing any additional setup. Per default the Raspberry comes with an integrated ethernet port. In order to allow the described setup an additional port is required and can be added by using an USB network adapter (e.g. a Renkforce Network adapter available at [Conrad](http://www.conrad.com/ce/en/product/1079700/Network-adapter-100-Mbits-Renkforce-USB-20-LAN-10100-Mbps)). With that connect your computer/router via ethernet cable to the integrated ethernet port and the SmartTV to the added network adapter. This will define the connection between the Raspberry Pi and your computer/router as `eth0` and between the SmartTV and the Pi as `eth1` interface.

Check if you have `dnsmsq` installed on the pi and install if not

```sh
$ which dnsmasq # not installed
$ sudo apt-get install dnsmasq
```

First let's setup the DHCP server to assign IPs for the SmartTV properly.

```sh
# make a backup from the default config
$ sudo cp /etc/dnsmasq.conf /etc/dnsmasq_backup.conf
```

Create an empty file of `/etc/dnsmasq.conf` and set the following:

```
interface=eth1
dhcp-range=192.168.0.2,192.168.0.254,255.255.255.0,12h
```

Next step is to define the network interfaces so that the TV can connect properly to the Raspberry Pi as well as the Pi to the computer/router. Again make sure to create a backup file before changing anything:

```sh
$ sudo cp /etc/network/interfaces /etc/network/interfaces_backup
```

Then create an empty file and add the following at the end to the file:

```
iface eth0 inet manual

auto eth1
iface eth1 inet static
  address 192.168.0.1
  netmask 255.255.255.0
```

The last step is to reboot the Raspberry Pi so it can adapt the network settings. It might be a good idea to also setup the wifi before doing any changes to the network so that you can still access the Pi when it can't connect via ethernet.

```sh
# reboot Pi
$ sudo reboot
```

After rebooting you should be able to connect from your network/computer over your local network. You will have to search for the IP address by executing:

```sh
$ ping raspberrypi.local
PING raspberrypi.local (192.168.1.X): 56 data bytes
64 bytes from 192.168.1.X: icmp_seq=0 ttl=64 time=0.633 ms
64 bytes from 192.168.1.X: icmp_seq=1 ttl=64 time=0.706 ms
...
```

Connect to the Pi via:

```sh
$ ssh pi@192.168.1.X
```

It will ask you for a password which is the standard password for Raspberry: `raspberry`. Once connected to the Raspberry Pi your network interfaces should look like the following:

```sh
pi@raspberrypi:~/appium-hbbtv-driver $ ifconfig
eth0      Link encap:Ethernet  HWaddr b8:27:eb:a3:4b:76
          inet addr:192.168.1.X  Bcast:192.168.2.255  Mask:255.255.255.0
          inet6 addr: fe80::ba27:ebff:fea3:4b76/64 Scope:Link
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:8767 errors:0 dropped:0 overruns:0 frame:0
          TX packets:7785 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:1000
          RX bytes:1932245 (1.8 MiB)  TX bytes:911841 (890.4 KiB)

eth1      Link encap:Ethernet  HWaddr 00:60:6e:b3:67:88
          inet addr:192.168.0.1  Bcast:192.168.0.255  Mask:255.255.255.0
          inet6 addr: fe80::260:6eff:feb3:6788/64 Scope:Link
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:31252 errors:0 dropped:0 overruns:0 frame:0
          TX packets:23923 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:1000
          RX bytes:2591968 (2.4 MiB)  TX bytes:2556356 (2.4 MiB)
```

# Modify IP Tables

In order to be able to run the proxy on port `8080` instead of `80` we need to tweak the iptables at the end so all traffic is routed properly. One step to do so is to copy the init.d script in [`/config/init.d/hbbtvproxy`](/config/init.d/hbbtvproxy) to `/etc/init.d/` on your Pi. Then just start the service like:

```sh
$ /etc/init.d/hbbtvproxy start
```

If you want to run this every time the PI boots up run:

```sh
$ sudo update-rc.d hbbtvproxy defaults
```

Or you can just apply the rules manually:

```sh
$ iptables -t nat -A POSTROUTING ! -d 192.168.0.1 -j MASQUERADE
$ iptables -t nat -A PREROUTING -i eth1 ! -d 192.168.0.1 -p tcp --dport 80 -j REDIRECT --to-port 8080
$ iptables -t nat -A PREROUTING -i eth1 ! -d 192.168.0.1 -p tcp --dport 443 -j REDIRECT --to-port 8080
```

# Better visibility within network

If you have multiple Raspberry PI devices setup and attached to your OTT devices it can be difficult to find the right PI to "ssh" into. To make your TVs more visible you should change the hostname of the PI attached to your TV. Let's say you've connected a PI to a Samsung Smart TV with model number "UE65HU7100". Open the Raspberry config utility:

```sh
$ sudo raspi-config
```

Choose the second option labeled as "Hostname - Set the visible name for this Pi on a network". Accept the info saying that you should only use ASCII letters 'a' through 'z' (case-insensitive), the digits '0' through '9', and the hyphen. We choose the TV model name as hostname. Accept the message and type in the new hostname "UE65HU7100". Then press ok and accept for rebooting. After the Pi has rebooted you can find it in your network by:

```sh
$ ping UE65HU7100.local
```

# Troubleshooting

Sometimes the PI doesn't find a connection to the TV. To work around and reconnect it again, do the following:

1. restart dnsmasq service (`sudo service dnsmasq restart`)
2. switch eth1 interface back `manual` (`iface eth1 inet manual`)
3. restart
4. switch eth1 interface back to its orginal settings (see above)
5. restart

To see if packets are now come through the Pi call `ifconfig`.
