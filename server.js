var util            = require('util'),
    https           = require('https'),
    base64          = require('./lib/base64'),
    Twitter         = require('ntwitter'),
    dynamo = require("dynamo");

var client = dynamo.createClient({
  accessKeyId: process.env.AWS_KEY,    // your access key id
  secretAccessKey: process.env.AWS_SECRET // your secret access key
});

var db = client.get('us-east-1');

const KEYWORD  = "crm,cloud,touch,forcedotcom,modelmetricsinc,modelfx,salesforce,model%20metrics,force.com,mobile,chatter,html5,social,social%20enterprise,social%20business,dreamforce,df12,benioff,data.com,heroku,appexchange";

//Production
var twit = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

//Development
/*var twit = new Twitter({
  consumer_key: process.env.DEV_TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.DEV_TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.DEV_TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.DEV_TWITTER_ACCESS_TOKEN_SECRET
});*/

twit.verifyCredentials(function (err, data) {
    if (err) {
      log("Error verifying credentials: " + err);
      process.exit(1);
    }
  });



twit.stream('statuses/filter',  {'track':KEYWORD}, function(stream) {
  stream.on('data', function (data) {
    //console.log(data);
    var dataToSave = {};
    dataToSave['Tweet ID'] = data.id_str;
    dataToSave.id = data.id_str;
    if(data.text != null && data.text.length > 0) dataToSave.text = data.text;
    if(data.user.screen_name != null && data.user.screen_name.length > 0) dataToSave.screen_name = data.user.screen_name;
    if(data.user.location != null && data.user.location.toString().length > 0) dataToSave.userLocation = data.user.location.toString();
    if(data.user.profile_image_url != null && data.user.profile_image_url.length > 0) dataToSave.userImage = data.user.profile_image_url;
    if(data.id != null) dataToSave.id_num = data.id;
    if(data.geo != null && JSON.stringify(data.geo).length > 0) dataToSave.geo = JSON.stringify(data.geo);
    if(data.created_at != null && data.created_at.toString().length > 0) dataToSave.created_at = data.created_at.toString();
    if(data.place != null && JSON.stringify(data.place).length > 0) dataToSave.place = JSON.stringify(data.place);
//console.log(dataToSave);
    db.put('dynamohum',dataToSave).save(function(err, saved) {
      if( err ) 
      {
        console.log("Tweet not saved");
        console.log(err);
        console.log(dataToSave);
      }
      //else console.log("Tweet saved");
  });

    //var tweet = strencode(data.text);
  });
  stream.on('end', function (response) {
       // Handle a disconnection
       killTwitterStream();
  });
  stream.on('destroy', function (response) {
       // Handle a 'silent' disconnection from Twitter, no end/error event fired
       killTwitterStream();
  });
});


/**
 * Something borked. Kill twitter stream.
 **/
function killTwitterStream() { 
  log("Killing Process")
  process.exit(1);
}


/**
 * Simple log...
 **/
function log(logText) {
  console.log(new Date().toDateString()+ ": "+logText);
}

function strencode( data ) {
  return unescape( encodeURIComponent( JSON.stringify( data ) ) );
}