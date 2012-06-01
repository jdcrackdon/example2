
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , sio = require('socket.io')
  , azure = require('azure')
  , $data = require('jaydata')
  , facebook = require('faceplate');

  require('./clicktoaction.js');

var serviceBusService = azure.createServiceBusService();

//Create server
var app = module.exports = express.createServer(
  express.bodyParser(),
  express.cookieParser(),
  require('faceplate').middleware({
    app_id: '419704494719974',
    secret: '72969658f939749acf860ae8df65da65'
  }));

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

var topic = "ttopic"
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

io.sockets.on('connection', function(socket){

  socket.on('ready', function(res) { 
    if (res) {
        socket.emit('helo', 'Say hello to my little friend');

    };
  });

  serviceBusService.sendQueueMessage('queue', 'Send Message Still Works', function(error) {
      if (!error) {
      }
  });

  serviceBusService.receiveQueueMessage('queue', function(error, receivedMessage) {
      if(!error){
          socket.emit('helo', receivedMessage.body);
          receiveSubscriptionMessage();
      };
  }); 

  socket.emit('helo', clicktoaction.context.FacebookUsers);

});

io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 20); 
});


function receiveSubscriptionMessage () {
  serviceBusService.receiveQueueMessage('queue', function(error, receivedMessage) {
      if(!error){
          socket.emit('helo', receivedMessage.body);
      };
  }); 
}



// Routes
app.get('/', routes.index);

app.get('/home', function(req, res){ 
  res.render('home', { title: 'Home' }); 
});

app.get('/test2', function(req, res){ 
  res.render('test2', { title: 'test2' }); 
});