
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , sio = require('socket.io')
  , azure = require('azure')
  , nowjs = require("now")
  , request = require('request')
  , facebook = require('faceplate');


var serviceBusService = azure.createServiceBusService();

//Create server
var app = module.exports = express.createServer(express.bodyParser(),
  express.cookieParser(),
  require('faceplate').middleware({
    app_id: process.env.FACEBOOK_APP_ID,
    secret: process.env.FACEBOOK_SECRET
  }));

var everyone = nowjs.initialize(app, {socketio: {transports: ['xhr-polling', 'jsonp-polling']}});

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

everyone.now.distributeMessage = function (message) {
    //receiveSubscriptionMessage();
    everyone.now.receiveMessage(this.now.name, message);
};

function receiveSubscriptionMessage () {
  serviceBusService.receiveSubscriptionMessage(topic, subscription, function(error, receivedMessage){
      if(!error){
          console.log('received')
          //io.sockets.emit('helo', receivedMessage.body);
          everyone.now.receiveMessage("subsc1", receivedMessage.body);
      }

  });
}

setInterval(function(){receiveSubscriptionMessage();}, 1000);

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