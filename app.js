var _dirname = 'C:/xampp/htdocs/game2';
var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req, res) {
	res.sendFile('https://github.com/giammirove/digitus/blob/master/index.html');
});
app.use('client', express.static('https://github.com/giammirove/digitus'));

serv.listen(2000);
console.log('server started');

var SOCKET_LIST = {};
var PLAYER_LIST = {};
var ITEM_LIST = {};

var Player = function(id){
	var self = {
		x:250,
		y:250,
		id:id,
		number: "" + Math.floor(10 + Math.random()),
		
		pressingRight:false,
		pressingLeft:false,
		pressingUp:false,
		pressingDown:false,
		health:10,
		maxSpd:10,
	}
	self.updatePosition = function(){
		if(self.pressingRight)
			self.x += self.maxSpd;
		if(self.pressingLeft)
			self.x -= self.maxSpd;
		if(self.pressingUp)
			self.y -= self.maxSpd; // va al contrario
		if(self.pressingDown)
			self.y += self.maxSpd;
	}
	
	return self;
}

var Item = function(){
	var self = {
			x: 200,
			y: 200,
			enable:true
	}
	
	return self;
}

var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
	console.log('socket connection');
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;
	for(var i = 0; i < 5; i++){
		var item = Item();
		ITEM_LIST[i] = item;
	}
	
	var player = Player(socket.id);
	PLAYER_LIST[socket.id] = player;
	
	socket.on('disconnect', function(){
		delete SOCKET_LIST[socket.id];
		delete PLAYER_LIST[socket.id];
		console.log('Player disconnected');
	});
	
	socket.on('deleteItem', function(data){
		console.log(data.name);
	});
	
	socket.on('keyPress', function(data){
		if(data.inputId === 'left')
			player.pressingLeft = data.state;
		else if(data.inputId === 'right')
			player.pressingRight = data.state;
		else if(data.inputId === 'up')
			player.pressingUp = data.state;
		else if(data.inputId === 'down')
			player.pressingDown = data.state;
	});
});

setInterval(function(){
	var pack = [];
	var itemPack = [];
	for (var i in PLAYER_LIST){
		var player = PLAYER_LIST[i];
		player.updatePosition();
		pack.push({
			x:player.x,
			y:player.y,
			number:player.number,
			health:player.health
		});
		
		for(var i in SOCKET_LIST){
			var socket = SOCKET_LIST[i];
			socket.emit('newPos', pack);
			for(var z in ITEM_LIST){
				var item = ITEM_LIST[z];
				itemPack.push({
					x:item.x,
					y:item.y,
					enable:item.enable
				});
				
				if(item.enable) socket.emit('drawItem', itemPack);
			}
		}
	}
}, 1000/25);
