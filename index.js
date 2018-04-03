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
	
	// Configuration
	this.name = config["name"];
	this.lightName = config["light_name"] || this.name; // fallback to "name" if you didn't specify an exact "light_name"    
    // Accessory information
    this.manufacturer    = config["manufacturer"] || "MurchHome";
    this.model           = config["model"] || "MH-Light";
    this.serial          = config["serial"] || "LT-0001";	
	// Light
	this.switchAddr = config["switchAddr"] || 16394;    // Modbus address on remote PLC to switch light on/off (momentary/ push button)
	this.statusAddr = config["statusAddr"] || 16994;    // Modbus address on remote PLC to read status of light
  
}

function getData(pilot, callback) {
    var param = 'raddr=' + pilot + '&rtype=c';
	sendData(param, function(res) {
		callback(res);
	});
}

function getSetData(pilot,button,callback) {
	var param = 'write=true&waddr=' + button + '&wtype=c&wmode=mom&raddr=' + pilot + '&rtype=c';
	sendData(param, function(res) {
		callback(res);
	});		
}

function sendData(param, callback) {
	var req = null;
	var options = {
        	hostname: '127.0.0.1',          // NodeRED local HTTP server
        	port: '1880',                   // NodeRED port
        	path: '/modbus?' + param,       // HTTP access point + parameters
        	method: 'GET',
        	timeout: 2500
  	};
	req = http.request(options, function (res) {
    	res.setEncoding('utf8');
    	res.on('data', function (chunk) {
			data = JSON.parse(chunk);
        	callback(data);
    	});
  	});
		req.on('error', function(e) {
			console.log('Problem with request: ' + JSON.stringify(e));
			callback(null);
		});
		req.end();
}

LightAccessory.prototype = {

	light: undefined,
	
	getPowerOn: function(callback) { 
		var that = this; 
		var Pilot = this.statusAddr;
		getData(Pilot, function(returnValue) {
			if (returnValue) {
  				callback(null,1);
  			} else {
  				callback(null,0);
  			}
  		});
	},

	setPowerOn: function(powerCmd, callback) {
		var that = this;
		var Pilot = this.statusAddr;
		var Button = this.switchAddr;
		getData(Pilot, function(returnValue) {
			var status = 0;
			if (returnValue) status = 1;
			if (status != powerCmd) {
				getSetData(Pilot,Button,function(returnValue2) {
					that.light.getCharacteristic(Characteristic.On).getValue();
					callback(null);
				});	
			} else {
				callback(null);
			}
		});
	},

	getServices: function() {
		var services = [], informationService = new Service.AccessoryInformation();
		
        informationService
            .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
            .setCharacteristic(Characteristic.Model, this.model)
            .setCharacteristic(Characteristic.SerialNumber, this.serial);
        services.push(informationService);
		
		var lightService = new Service.Lightbulb(this.lightName + ' Light');
    
		lightService
      		.getCharacteristic(Characteristic.On)
      		.on('get', this.getPowerOn.bind(this))
      		.on('set', this.setPowerOn.bind(this));
    	this.light = lightService;
    	services.push(this.light);
    	
		return services;
	}
};
