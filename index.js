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
  logDirectory: path.join(__dirname, '/logs'),
  fileNamePattern: '<DATE>.log',
  dateFormat: 'YYYY.MM.DD'
};
const debug = require('simple-node-logger').createRollingFileLogger(loggingOptions);

//Editor Config
const setupWSConnection = require("y-websocket/bin/utils").setupWSConnection;

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
const io = require("socket.io")(httpServer, {
  transports: ['websocket','polling'] // Ensure WebSocket transport is used
});

// const videoServer = require("http").Server(app);
// const collabEditServer = require("http").Server(app);

//Middleware
app.use(cors({ origin: "https://live2.codegrounds.co.in", credentials: true }));
app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
// app.use(express.static(__dirname, { dotfiles: 'allow' } ));

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
    rooms[req.params.room] = true;
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

//Socket.io Connection

io.on("connection", socket => {
  socket.on("new_client", room => {
    console.log('COnnected3')
    io.in(room).clients(function (error, clients) {
      if (error) {
        debug.error(`Error while creating new client in new room ${room} ` + error);
        throw error;
      }
      if (clients.length >= 2) {
        debug.error("Trying to join an active Interview room with token " + room);
        socket.emit("session_active");
        return;
      }
      socket.join(room);

      if (clients.length === 1) {
        if (clients.length == 1) {
          debug.info(`Creating Peer for room: ${room}`);
          socket.emit("create_peer");
        }
      }
    });
  });

  socket.on("offer", (room, offer) => {
    socket.to(room).broadcast.emit("sent_offer", offer);
  });

  socket.on("answer", (room, data) => {
    socket.to(room).broadcast.emit("sent_answer", data);
  });

  socket.on("user_disconnected", (room) => {
    socket.to(room).emit("remove_peer");
  });
});

//Websocket Server
const wss = new WebSocket.Server({ noServer:true });

// Handle WebSocket Upgrade Requests
httpServer.on('upgrade', (request, socket, head) => {
  // Handle WebSocket requests for YJS
  if (request.url.startsWith('/yjs') || request.url.startsWith('/1')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
  // Handle other upgrade requests, e.g., for Socket.IO
  else {
    // Handle other WebSocket upgrade requests, e.g., for Socket.IO
    // Note: Socket.IO does not need explicit handling of upgrade
    // It will automatically handle upgrade requests
    socket.destroy(); // Close the socket if not handling by YJS
  }
});

// Handle YJS WebSocket connections
wss.on('connection', (ws, request) => {
  try {
    setupWSConnection(ws, request, {
      gc: request.url.slice(1) !== "prosemirror-versions"
    });
    console.log(`YJS Setup successful for Request: ${request.url}`);
  } catch (err) {
    console.error(`Error setting up YJS: ${err}`);
  }
});

// Start server
httpServer.listen(4000, () => {
  console.log("Server listening on port 4000");
  debug.info("Server listening on port 4000");
});

// Error handling for the HTTP server
httpServer.on('error', (err) => {
  console.error('Server error:', err);
  debug.error('Server error: ' + err);
});

