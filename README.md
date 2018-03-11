# homebridge-http-light

Works with a http accessible light device on HomeBridge Platform

# Installation

1. Install homebridge using: npm install -g homebridge
2. Install in to npm using: npm install -g https://github.com/murch1/homebridge-http-light.git
3. Update your configuration file. See sample-config.json in this repository for a sample. 

# Configuration

Configuration sample:

 ```
"accessories": [
        {
            "accessory":      "http-light",
            "name":           "Lamp",
            "bulb_name":      "Lamp1"
        }
]

```
