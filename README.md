# homebridge-http-plc-switch

Works with a HTTP accessible switch device on HomeBridge Platform
This plug-in is designed to work with a Node-RED flow that communicates with a PLC via modbus. 
This is setup as a switch, so that Homekit treats it slightly different to things like outlets and light switches.

Import sample-flow.json in to Node-RED to see how this side of things works.

The PLC uses the leading-edge pulse to toggle the switch on and off.

This plug-in has been adapted from homebridge-fakebulb (by Sergey Chemishkian) to suit my very specific installation. Feel free to hack away at it to make it work for you.

# Installation

1. Install Node-RED. Go to https://nodered.org/docs/getting-started/installation for instructions.
2. Install homebridge using: npm install -g homebridge
2. Install homebridge-http-light in to npm using: npm install git://github.com/murch1/homebridge-http-plc-switch.git
3. Update your ~/.homebridge/config.json configuration file. See sample-config.json in this repository for a sample. 

# Configuration

Configuration sample:

 ```
    "accessories": [
        {
            "accessory":      "http-plc-switch",
            "name":           "Bedroom LED Outlet Switch",
            "switch_name":    "Bedroom",
            "switchAddr":     "16394",         // PLC modbus address that acts as the push button to switch on the light
            "statusAddr":     "16994"          // PLC modbus address that acts as the pilot light to read the status of the light
        }
],

```
