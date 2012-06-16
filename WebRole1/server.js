
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
  , fs = require('fs')
  , request = require('request');

    var objFb='',
        speak='',
        photoFB='';

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

everyone.now.distributeMessage = function (message) {
    //receiveSubscriptionMessage();
    everyone.now.receiveMessage(this.now.name, message);
};

everyone.now.sendReady = function (msg) {
    everyone.now.receiveMessage("subsc1", msg);
};

function receiveSubscriptionMessage () {

  everyone.now.checkValue = function() {
    objFb=this.now.fbObject;
    speak=this.now.speaker;
    photoFB = this.now.capture;
    console.log(objFb);
    //console.log(photoFB);
    console.log(speak); 
  };

  serviceBusService.receiveSubscriptionMessage(topic, subscription, function(error, receivedMessage){
      if(!error){
          var v = receivedMessage.customProperties.uid;
          var d = new Date().toLocaleString();
          var fullDate = moment(d);
          var jsonDate = '/Date('+moment().valueOf()+')/';
          var urlFilterUsers = "FacebookUsers?$filter=Uid%20eq%20'"+v+"'";
          var urlFilterObjects = "FacebookObjects?$filter=StartDate le datetime'"+fullDate.format()+"' and FinishDate ge datetime'"+fullDate.format()+"'";
          requestUserData(urlFilterUsers);
          everyone.now.likeShow(true);
      }
  });
}

setInterval(function(){receiveSubscriptionMessage();}, 1000);

//get some data
function requestUserData (filter) {
  console.log(filter);
  OData.read({ requestUri: "http://dev.idlinksolutions.com/clicktoaction/clicktoactionData.svc/"+filter, 
    user: "clicktoactionuser", 
    password: "IDlink.co1" }, function (data,response) {
        //TODO  
        /*var fullDate = moment(moment(data.results[0].FinishDate).valueOf());
        fullDate.add('days',1);
        var jsonDate = '/Date('+moment().valueOf()+')/';
        //fullDate.subtract('hours', 7); //gmt -0500
        everyone.now.receiveMessage("subsc1", data.results[0].FinishDate);*/
        console.log(data.results);
        var userToken = data.results[0].Token; 
        console.log('user '+data.results[0].Token)
        facebookInteraction(userToken);
  }, function (err) {
      console.log("error "+err.message);
  }, OData.jsonHandler);
}

function facebookInteraction(token) {
  FB.setAccessToken(token); //global 
  //FB.api('4100972728855/likes', 'post', function (res) {
  FB.api(objFb+'/likes', 'post', function (res) {
    if(!res || res.error) {
      everyone.now.receiveMessage('hola', 'like');
      console.log(res.error);
    }else{
      var msg_fb = "TEST I like "+speak;
      FB.api({ method: 'stream.publish', message: msg_fb }, function (res) {
        if(!res || res.error_msg) {
            everyone.now.receiveMessage('hola', 'status');
            console.log('post '+res.error_msg);
        }
        else {
            dataUser(token);
        }
      });
    }
  }); 
}

function postPhotoAlbum (argument) {
    FB.setAccessToken(token);
    FB.api('/album_id/photos', 'post', {
        message:'photo description',
        url:imgURL        
    }, function(response){
        if (!response || response.error) {
            alert('Error occured');
        } else {
            alert('Post ID: ' + response.id);
        }
    });
}

function dataUser(token) {
  var time = moment();

  FB.setAccessToken(token);
  FB.api('fql', { q: {
    user : 'SELECT uid, name, pic_small FROM user WHERE uid=me()',
    post : 'SELECT post_id, actor_id, target_id, app_id, message FROM stream WHERE source_id = me() LIMIT 1'
    } }, function (res) {
    if(!res || res.error) {
      console.log(res.error);
      return;
    }else{
      //var dataJson = '{"name":"'+res.data[1].fql_result_set+'", "pic":"'+res.data[1].fql_result_set.pic_small+'", "status":"'+res.data[0].fql_result_set.message+'"}';
      console.log(res.data[0].fql_result_set);

      everyone.now.receiveMessage('hola', res.data); //JSON.parse();
    }
  });
}
  var data_feed=[];
function streamFeeder () {
  var i=0;
  OData.read({ requestUri: "http://dev.idlinksolutions.com/clicktoaction/clicktoactionData.svc/FacebookUsers", 
    user: "clicktoactionuser", 
    password: "IDlink.co1" }, function (data,response) {
        data.results.forEach(function(d) {
          FB.setAccessToken(d.Token);
          FB.api('fql', { q: 'SELECT actor_id, message FROM stream WHERE app_id = 419704494719974 and source_id = me() '
           }, function (res) {
            if(!res || res.error) {
              console.log(res.error);
              return;
            }else{
              res.data.forEach(function(item,index,array) {
                FB.api('fql', { q: 'SELECT pic_small,name FROM user WHERE uid='+item.actor_id
                 }, function (res) {
                  if(!res || res.error) {
                    console.log('ll'+res.error);
                    return;
                  }else{
                    data_feed[i]={"name" : res.data[0].name, "pic_small" : res.data[0].pic_small, "message" : item.message };
                    i++;
                    if(index+1==array.length){
                      everyone.now.streamFeed(data_feed);
                      return;
                    }
                    //console.log(data_feed);
                  }
                });
              });
            }
          });
        });
  }, function (err) {
      console.log("error "+err.message);
  }, OData.jsonHandler);
  //app_id 419704494719974 391782434200952
}

// Routes
app.get('/', function(req, res){ 
  streamFeeder();
  res.render('index', { title: 'Home'}); 
});

app.get('/home', function(req, res){ 
  res.render('home', { title: 'Home' }); 
});