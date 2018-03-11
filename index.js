// This node is designed to work with local Node-RED flow
// Refer is included flow for more information

var http = require('http');
var Service, Characteristic;
var Pilot, Button;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-http-light", "http-light", LightAccessory);
}

function LightAccessory(log, config) {
  this.log = log;
  this.name = config["name"];
  this.lightName = config["light_name"] || this.name; // fallback to "name" if you didn't specify an exact "light_name"
  this.binaryState = 0;                               // light state, default is OFF
  this.switchAddr = config["switchAddr"] || 16394;    // Modbus address on remote PLC to switch light on/off (momentary/ push button)
  this.statusAddr = config["statusAddr"] || 16994;    // Modbus address on remote PLC to read status of light
  
//  this.search();
}

function getData(pilot,callback) {
  var param = 'raddr=' + pilot + '&rtype=c';
//console.log(data);
  var req = null;
  var options = {
        hostname: '127.0.0.1',          // NodeRED local HTTP server
        port: '1880',                   // NodeRED port
        path: '/modbus&' + param,       // HTTP access point + parameters
        method: 'GET',
  };
  req = http.request(options, function (res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
        console.log('Light: ' + chunk);
	callback(chunk);
    });
  });
  req.on('error', function(e) {
    console.log(pilot + ' problem with request: ' + e.message);
    callback(-1);
  });
  req.end();
}

function getSetData(pilot,button,callback) {
  var param = 'write=true&waddr=' + button + '&wtype=c&wmode=mom&raddr=' + pilot + '&rtype=c';
  var req = null;
  var options = {
        hostname: '127.0.0.1',          // NodeRED local HTTP server
        port: '1880',                   // NodeRED port
        path: '/modbus&' + param,       // HTTP access point + parameters
        method: 'GET',
  };
  req = http.request(options, function (res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
        callback(chunk);
    });
  });
  req.on('error', function(e) {
    callback(-1);
  });
  req.end();
}


LightAccessory.prototype.getPowerOn = function(callback) {  
  var Pilot = this.statusAddr;
  getData(Pilot, function(returnValue) {
	  LightAccessory.prototype.binaryState = returnValue;
    callback(null,returnValue);
  });
}

LightAccessory.prototype.setPowerOn = function(powerCmd, callback) {
  var Pilot = this.statusAddr;
  var Button = this.switchAddr;
  getData(Pilot, function(returnValue) {
	if(returnValue != powerCmd) {
	  getSetData(Pilot,Button,function(returnValue2) {
		  LightAccessory.prototype.binaryState = returnValue2;
				});
			callback(null);	
	} else {
		callback(null);
	}
  });

}

LightAccessory.prototype.getServices = function() {
    var lightService = new Service.Light(this.name);
    
    lightService
      .getCharacteristic(Characteristic.On)
      .on('get', this.getPowerOn.bind(this))
      .on('set', this.setPowerOn.bind(this));
    
    return [lightService];
}
