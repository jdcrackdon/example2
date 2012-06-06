
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , azure = require('azure')
  , nowjs = require("now")
  , OData = require('./datajs-1.0.3.js').OData
  , FB = require('fb')
  , moment = require('moment')
  , request = require('request');

//Create the service Bus
var serviceBusService = azure.createServiceBusService();

//Create server
var app = module.exports = express.createServer();

//Newjs sockets
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

everyone.now.sendReady = function (msg) {
    everyone.now.receiveMessage("subsc1", msg);
};

function receiveSubscriptionMessage () {

  everyone.now.checkValue = function() {
      console.log(this.now.fbObject); 
  };

  serviceBusService.receiveSubscriptionMessage(topic, subscription, function(error, receivedMessage){
      if(!error){
          var v = receivedMessage.customProperties.uid;
          var d = new Date().toLocaleString();
          var fullDate = moment(d);
          var jsonDate = '/Date('+moment().valueOf()+')/';
          //requestUserData("FacebookUsers?$filter=Uid%20eq%20'"+v+"'");
          var urlFilterUsers = "FacebookUsers?$filter=Uid eq '"+v+"'";
          var urlFilterObjects = "FacebookObjects?$filter=StartDate le datetime'"+fullDate.format()+"' and FinishDate ge datetime'"+fullDate.format()+"'";
          //requestUserData(urlFilterObjects);
          console.log(urlFilterObjects);
          //everyone.now.receiveMessage("subsc1", $data.results[0].Token);
          //makeLikes($data.results[0].Token);
          everyone.now.receiveMessage("subsc1", 'asasasasas');
      }
  });
}

setInterval(function(){receiveSubscriptionMessage();}, 1000);

//get some data
function requestUserData (filter) {
  OData.atomHandler.read = (function () {
      var atomReadFunction = OData.atomHandler.read;
      return function (response, context) {
          if (response.headers["Content-Type"]) {
              return atomReadFunction.call(OData.atomHandler, response, context);
          }
      }
  })();
  OData.read({ requestUri: "http://dev.idlinksolutions.com/clicktoaction/clicktoactionData.svc/"+filter, 
    user: "clicktoactionuser", 
    password: "IDlink.co1" }, function (data,response) {
      /*if (type == 'date'){


      }*/  
      var fullDate = moment(moment(data.results[0].FinishDate).valueOf());
      fullDate.add('days',1);
      var jsonDate = '/Date('+moment().valueOf()+')/';
      //fullDate.subtract('hours', 7); //gmt -0500
      everyone.now.receiveMessage("subsc1", data.results[0].FinishDate);
      //console.log(data.results[0]);
  }, function (err) {
      console.log("error "+err);
  }, OData.jsonHandler);
}

function makeLikes (access_token) {
  // body...10150934692631941
  FB.setAccessToken(access_token);
  FB.api('10150934692631941/likes', 'post', function (res) {
    if(!res || res.error) {
      console.log(res.error);
      return;
    }
    console.log('Post Id: ' + res.id);
  });
}


// Routes
app.get('/', function(req, res){ 
  res.render('index', { title: 'Home' }); 
});

app.get('/home', function(req, res){ 
  res.render('home', { title: 'Home' }); 
});