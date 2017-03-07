Network Setup
=============

The Raspberry Pi has to act as middlemen between SmartTV and network. The following explains how to setup the Pi to connect properly without doing any additional setup. Per default the Raspberry comes with an integrated ethernet port. In order to allow the described setup an additional port is required and can be added by using an USB network adapter (e.g. a Renkforce Network adapter available at [Conrad](http://www.conrad.com/ce/en/product/1079700/Network-adapter-100-Mbits-Renkforce-USB-20-LAN-10100-Mbps)). With that connect your computer via ethernet wire to the integrated ethernet port and the SmartTV to the added network adapter. This will define the connection between the Raspberry Pi and your computer/network as `eth0` and between the SmartTV and the Pi as `eth1` interface.

First let's setup the DHCP server to it assigns the IPs properly.

```sh
# make a backup from the default config
$ sudo mv /etc/dnsmasq.conf /etc/dnsmasq_backup.conf
```

Create an empty file of `/etc/dnsmasq.conf` and set the following:

```
interface=eth0
dhcp-range=192.168.2.2,192.168.2.254,255.255.255.0,12h

interface=eth1
dhcp-range=192.168.3.2,192.168.3.254,255.255.255.0,12h
```

Next step is to define the network interfaces so that the TV can connect properly to the Raspberry Pi as well as the Pi to the computer/network. Again make sure to create a backup file before changing anything:

```sh
$ sudo mv /etc/network/interfaces /etc/network/interfaces_backup
```

Then create an empty file and add the following at the end to the file:

```
auto eth0
iface eth0 inet static
  address 192.168.2.2
  netmask 255.255.255.0
  gateway 192.168.2.1
  up ethtool -s eth0 wol g

auto eth1
iface eth1 inet static
  address 192.168.3.1
  netmask 255.255.255.0
```

The last step is to reboot the Raspberry Pi so it can adapt the network settings. It might be a good idea to also setup the wifi before doing any changes to the network so that you can still access the Pi when it can't connect via ethernet.

```sh
# reboot Pi
$ sudo reboot
```

After rebooting you should be able to connect from your network/computer over the IP `192.168.2.2`. You can also search for the IP address by executing:

```sh
$ ping raspberrypi.local
PING raspberrypi.local (192.168.2.2): 56 data bytes
64 bytes from 192.168.2.2: icmp_seq=0 ttl=64 time=0.633 ms
64 bytes from 192.168.2.2: icmp_seq=1 ttl=64 time=0.706 ms
...
```

Once connected to the Raspberry Pi your network interfaces should look like the following:

```sh
pi@raspberrypi:~/appium-hbbtv-driver $ ifconfig
eth0      Link encap:Ethernet  HWaddr b8:27:eb:a3:4b:76
          inet addr:192.168.2.2  Bcast:192.168.2.255  Mask:255.255.255.0
          inet6 addr: fe80::ba27:ebff:fea3:4b76/64 Scope:Link
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:8767 errors:0 dropped:0 overruns:0 frame:0
          TX packets:7785 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:1000
          RX bytes:1932245 (1.8 MiB)  TX bytes:911841 (890.4 KiB)

eth1      Link encap:Ethernet  HWaddr 00:60:6e:b3:67:88
          inet addr:192.168.3.1  Bcast:192.168.3.255  Mask:255.255.255.0
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

Or you can just apply the rules manually:

```sh
$ iptables -t nat -A POSTROUTING ! -d 192.168.3.1 -j MASQUERADE
$ iptables -t nat -A PREROUTING -i eth1 ! -d 192.168.3.1 -p tcp --dport 80 -j REDIRECT --to-port 8080
$ iptables -t nat -A PREROUTING -i eth1 ! -d 192.168.3.1 -p tcp --dport 443 -j REDIRECT --to-port 8080
```
