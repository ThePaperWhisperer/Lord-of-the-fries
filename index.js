const express = require("express");
const http = require("http");
const fs = require("fs");
const Ably = require('ably');

// For the full code sample see here: https://github.com/ably/quickstart-js
const ably = new Ably.Realtime('AUFTWw.lX4uEQ:N9x3o9blgYQF8Q70S2mwM_y3bENa3ijxFteTRHEX6-s');
await ably.connection.once('connected');
console.log('Connected to Ably!');
const channel = ably.channels.get('quickstart');


const { addWords, isBad } = require("adults");
var roomname;
var users = [];
var rooms = [];
var winners = [];
const app = express();
const PORT = 3000 || process.env.PORT;
const server = http.createServer(app);
// Set static folder
app.use(express.static(__dirname));

var i = 0;
	var x = 0;
var roomnumber;
var people = 0;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  people++;
 
			channel.subscribe("username", (user) => {
    if (users.includes(user) || user === null || user === "" || isBad(user)) {
      channel.publish("usernotadded");
    } else {
      users.push(user);
      channel.publish("useradded", users);
      channel.publish("joined", user);
    }
	});
  channel.subscribe("message", message => {
				channel.publish("newmessage", {message: message.message, user: "someone"});
  });
	channel.subscribe("house", (u)=> {
		channel.publish("housemade", u);
	});
	channel.subscribe("fire", (u)=> {
		channel.publish("firemade", u);
	});
  
  channel.subscribe("userwon", () => {
    
        channel.publish("winnerchosen");
        channel.publish("gg");

  });
  channel.subscribe("playerhit", () => {
   
        channel.publish("damage");

  });
  channel.subscribe("died", (user) => {
    users.filter((use) => use != user);
   
        channel.publish("leave", users);
        channel.publish("gameover", user);
     
  });
  channel.subscribe("hit", (person) => {
        channel.publish("point", person);    
  });
  channel.subscribe("won", (user) => {
   
        channel.publish("winner", user);
        winners.push(user);
        if (winners.length === 2) {
          channel.publish("winners", winners);
        }
  
  });
  channel.subscribe("move", (matrix) => {
   

  });
	channel.subscribe("escape", per => {
		channel.publish("escaped", per)
	})
