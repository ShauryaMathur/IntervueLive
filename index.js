const express = require("express");
const fs = require("fs");
const cors = require("cors");
const WebSocket = require("ws");
const crypto = require("crypto");
const http = require("http")
const https = require("https")
const path = require('path');
const { log } = require("console");

//Logging
const loggingOptions = {
      logDirectory:path.join(__dirname,'/logs'),
      fileNamePattern:'<DATE>.log',
      dateFormat:'YYYY.MM.DD'
};
const debug = require('simple-node-logger').createRollingFileLogger(loggingOptions);

//Editor Config
const setupWSConnection = require("y-websocket/bin/utils.js").setupWSConnection;



// const privateKey = fs.readFileSync('/etc/letsencrypt/live/interviews.codeground.in/privkey.pem', 'utf8');
// const certificate = fs.readFileSync('/etc/letsencrypt/live/interviews.codeground.in/cert.pem', 'utf8');
// const ca = fs.readFileSync('/etc/letsencrypt/live/interviews.codeground.in/chain.pem', 'utf8');

// const options = {
//     key: privateKey,
//     cert: certificate,
//     ca: ca
// };

//Initialise Express App
const app = express();

const httpServer = http.createServer(app);
const videoServer = require("http").Server(app);
const collabEditServer = require("http").Server(app);
const io = require("socket.io")(videoServer);

app.use(cors({origin: "https://live2.codegrounds.co.in", credentials: true}));


// middleware
app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.static("public"));
// app.use(express.static(__dirname, { dotfiles: 'allow' } ));
app.use(express.urlencoded({extended: true}));

//Room Config
const rooms = {};

//@route -> createroom[post]
// app.get("/createroom/:roomname", (req, res) => {
//   if (rooms[req.params.roomname] != null) {
//     return res.render("roomalreadyexists");
//   }

//   rooms[req.params.roomname] = { users: {} };

//   res.status(200);
//   io.emit("room_created", req.params.roomname);
// });

// Routes

//@route -> index
app.get("/", (req, res) => {
  debug.info("Index Route Called");
  res.render("index", { rooms: rooms });
});

//@route -> room
//To create Interviewer Room
app.get("/interviewer/:token/:room", (req, res) => {
  var salt = "DevelopedByManojAndShaurya";
  var hash = crypto
    .createHash("md5")
    .update(req.params.room + salt)
    .digest("hex");

  // if (hash.toLowerCase() !== req.params.token.toLowerCase()) {
  //   debug.error(`Invalid Hash : ${hash} for room : ${req.params.room}`);
  //   return res.render("roomdoesnotexist");
  // }
  
  if (rooms[req.params.room] == null || rooms[req.params.room] == true) {
    rooms[req.params.room]=true;
    debug.info(
      `Room created successfully with token : ${req.params.room} by Interviewer `
    );
    return res.render("room", { room_name: req.params.room });
  }
});

//Create Candidate's Room
app.get("/candidate/:room", (req, res) => {
  if (rooms[req.params.room] == null) {
    debug.error(`Room with token : ${req.params.room} does not exist`);
    return res.render("roomdoesnotexist");
  }
  debug.info(`Candidate joined room with token : ${req.params.room}`);
  return res.render("room", { room_name: req.params.room });
});

//@route -> For Diconnecting Interview
app.get("/disconnect/:room", (req, res) => {
  var key = req.params.room;
  delete rooms[key];
  debug.info(`Interview with token : ${req.params.room} disconnected`);
});

app.get("*", (req, res) => {
  debug.info("Default Route");
  res.render("index", { rooms: rooms });
});

//socket connection established
try {
  io.on("connection", socket => {
    console.log('Connected');
    
    socket.on("new_client", room => {
      console.log('COnnected3')
      io.in(room).clients(function(error, clients) {
        if (error) {
          debug.error(`Error while creating new client in new room ${room} ` + error);
          throw error;
        }
        if (clients.length >= 2) {
          debug.error("Trying to join an active Interview room with token " + room );
          socket.emit("session_active");
          return;
        }
        console.log('Connected2');
        socket.join(room);

        if (clients.length < 2) {
          if (clients.length == 1) {
            debug.info("Creating Peer for room " + room);
            socket.emit("create_peer");
          }
        }
      });
    });

    const send_offer = (room, offer) => {
      socket.to(room).broadcast.emit("sent_offer", offer);
    };

    const send_answer = (room, data) => {
      socket.to(room).broadcast.emit("sent_answer", data);
    };

    const disconnect = room => {
      socket.to(room).emit("remove_peer");
    };

    //events
    socket.on("offer", send_offer);
    socket.on("answer", send_answer);
    socket.on("user_disconnected", disconnect);
  });
} catch (err) {
  debug.info("Error connecting Socket" + err);
}

videoServer.listen(4000, () => {
  console.log("videoServer listening on port: 4000");
  debug.info("videoServer listening on port: 4000");
});

collabEditServer.listen(8080, function() {
  console.log("collabEditServer listening on port: 8080");
  debug.info("collabEditServer listening on port: 8080");
});

const wss = new WebSocket.Server({ server: collabEditServer });

wss.on("connection", (conn, req) => {
  try {
    setupWSConnection(conn, req, {
      gc: req.url.slice(1) !== "prosemirror-versions"
    });
    debug.info("YJS Setup successfull for Request " + req.url);
  } catch (err) {
    debug.error(`Error setting up YJS` + err);
  }
});
