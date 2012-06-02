
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , sio = require('socket.io')
  , azure = require('azure')
  , events = require('events')
  , serverEmitter = new events.EventEmitter()
  , request = require('request')
  , facebook = require('faceplate');


var serviceBusService = azure.createServiceBusService();

//Create server
var app = module.exports = express.createServer();

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});


//init the server
app.listen(process.env.port);


// Service bus instance config
var topicOptions = {
        MaxSizeInMegabytes: '5120',
        DefaultMessageTimeToLive: 'PT3M'
};

var topic = "test_topic"
  , subscription = "subsc1";

//message body
var message = {
    body: '',
    customProperties: {
        messagenumber: 1
    }
};


/*
 *Socket.IO server (single process only)
 */
var io = sio.listen(app);

io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 20);  
});


function receiveSubscriptionMessage () {
  serviceBusService.receiveSubscriptionMessage(topic, subscription, function(error, receivedMessage){
      if(!error){
          console.log('received')
          io.sockets.emit('helo', receivedMessage.body);
          receiveSubscriptionMessage();
      }
  });
}

io.sockets.on('connection', function(socket){

  receiveSubscriptionMessage();

  socket.once('connection', function (client) {    

  });

  socket.on('ready', function(res) { 
    if (res) {
        socket.emit('helo', 'Say hello to my little friend');
    };
  });

  //requestUserData();
});


//get some data
function requestUserData () {
  request({uri: 'https://cold-river-3054.herokuapp.com/dataFacebookUser.json'}, function(err,response,body) {
        if(!err){
            var cleanData = JSON.parse(body);
            console.log(cleanData);
            return cleanData;
        }
        
    }
  ); 
}


// Routes
app.get('/', routes.index);

app.get('/home', function(req, res){ 
  res.render('home', { title: 'Home' }); 
});