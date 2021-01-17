// This node is designed to work with local Node-RED flow
// Refer is included flow for more information

var http = require('http');
var Service, Characteristic;
var Pilot, Button;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-http-plc-switch", "http-plc-switch", SwitchAccessory);
}

function SwitchAccessory(log, config) {
	this.log = log;
	
	// Configuration
	this.name 				= config["name"];
	this.switchName 		= config["switch_name"] || this.name; // fallback to "name" if you didn't specify an exact "switch_name"
	this.host				= config["host"] || "127.0.0.1";    
    	// Accessory information
    this.manufacturer   	= config["manufacturer"] || "MurchHome";
    this.model          	= config["model"] || "MH-Switch";
    this.serial         	= config["serial"] || "SW-0001";	
	// Switch
	this.switchAddr 		= config["switchAddr"] || 16394;    // Modbus address on remote PLC to switch on/off (momentary/ push button)
	this.statusAddr 		= config["statusAddr"] || 16994;    // Modbus address on remote PLC to read status of switch
  
}

function getData(pilot, host, callback) {
    var param = 'raddr=' + pilot + '&rtype=c';
	sendData(param, host, function(res) {
		callback(res);
	});
}

function getSetData(pilot, button, host, callback) {
	var param = 'write=true&waddr=' + button + '&wtype=c&wmode=mom&raddr=' + pilot + '&rtype=c';
	sendData(param, host, function(res) {
		callback(res);
	});		
}

function sendData(param, host, callback) {
	var req = null;
	var options = {
        	hostname: host,         // NodeRED local HTTP server
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

SwitchAccessory.prototype = {

	switch: undefined,
	
	getPowerOn: function(callback) { 
		var that = this; 
		var Pilot = this.statusAddr;
		var host = this.host;
		getData(Pilot, host, function(returnValue) {
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
		var host = this.host;
		getData(Pilot, host, function(returnValue) {
			var status = 0;
			if (returnValue) status = 1;
			if (status != powerCmd) {
				getSetData(Pilot, Button, host, function(returnValue2) {
					that.switch.getCharacteristic(Characteristic.On).getValue();
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
		
		var switchService = new Service.Switch(this.switchName + ' Switch');
    
		switchService
      		.getCharacteristic(Characteristic.On)
      		.on('get', this.getPowerOn.bind(this))
      		.on('set', this.setPowerOn.bind(this));
    	this.switch = switchService;
    	services.push(this.switch);
    	
		return services;
	}
};
