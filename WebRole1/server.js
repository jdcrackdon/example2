
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , sio = require('socket.io')
  , azure = require('azure')
  , data = require('./datajs.min.js')
  , facebook = require('faceplate');

data.OData.read( 
  "http://dev.idlinksolutions.com/clicktoaction/clicktoactionData.svc/", 
  function (data) { 
    
  } 
);

var serviceBusService = azure.createServiceBusService();

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
        DefaultMessageTimeToLive: 'PT1M'
};

var topic = "TopicTest"
  , subscription = "subscription1";

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
        createTopic();
    };
  });

});

//Create tipc
function createTopic () {
  serviceBusService.createTopicIfNotExists(topic, topicOptions, function(error){
     if(!error){
        createSubscriptions();
     }     
  });
}


function createSubscriptions () {
  serviceBusService.createSubscription(topic, subscription, function(error){
     if(!error){ 
        sendMessage();      
      }
  });
}

function receiveSubscriptionMessage () {
  serviceBusService.receiveSubscriptionMessage(topic, subscription, function(error, receivedMessage){
      if(!error){
          socket.emit('helo', 'done');
      }
  });  
}


//Data message function
function sendMessage(){
  serviceBusService.sendTopicMessage(topic, 'Is a live', function(error) {
      if(!error){   
        socket.emit('helo', 'done');
        
        serviceBusService.sendTopicMessage(topic, 'Again more strong, Is a live', function(error) {
            if(!error){     
              receiveSubscriptionMessage();
            }
        });
      }
  });
};


// Routes
app.get('/', routes.index);
app.get('/home', function(req, res){ res.render('home', { title: 'Home' }); });