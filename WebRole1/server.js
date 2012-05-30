
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , sio = require('socket.io')
  , azure = require('azure')
  , $data = require('jaydata')
  , facebook = require('faceplate');

var serviceBusService = azure.createServiceBusService();

//Create server
var app = module.exports = express.createServer(
  express.bodyParser(),
  express.cookieParser(),
  require('faceplate').middleware({
    app_id: '419704494719974',
    secret: '72969658f939749acf860ae8df65da65'
  }));

// data classes
$data.Class.define("$clicktoaction.Types.FacebookUsers",$data.Entity, null, {
    Id: { dataType: "guid", key: true},
    Identification: { dataType: "string"},
    Token: { dataType: "string"},
    FacebookId: { dataType: "string"},
    Identification: { dataType: "string"},
    Permissions: { dataType: "string" },
    Email: { dataType: "string" }
}, null);



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
        //$clicktoaction.context = new $clicktoaction.Types.FacebookUsersContext({ name:"oData", oDataServiceHost:"http://dev.idlinksolutions.com/clicktoaction/clicktoactionData.svc" });
    };
  });

});

// Data init
function dataService () {
  $clicktoaction.context = new $clicktoaction.Types.FacebookUsersContext({ name:"oData", oDataServiceHost:"http://dev.idlinksolutions.com/clicktoaction/clicktoactionData.svc" });
}


//Create topic
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