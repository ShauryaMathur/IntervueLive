const express = require("express");
const fs = require("fs");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");
const crypto = require("crypto");
var debug = require("debug")("server");
const setupWSConnection = require("y-websocket/bin/utils.js").setupWSConnection;
const app = express();
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
  ca:''
};

if(process.env.NODE_ENV==='production'){
  try {
    options.key= fs.readFileSync("prodcerts/privkey.pem", "utf8");
    options.cert = fs.readFileSync("prodcerts/cert.pem", "utf8");
    options.ca = fs.readFileSync("prodcerts/chain.pem", "utf8");
  } catch (err) {
    debug(`Error loading SSL certificates` + err);
  }
}

const httpServer = http.createServer(app);
const videoServer = require("https").Server(options, app);
const collabEditServer = require("https").Server(options, app);
const io = require("socket.io")(videoServer);

app.use(cors({ origin: "https://live2.codegrounds.co.in", credentials: true }));

//middleware
app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

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

//@route -> For Diconnecting Interview
app.get("/disconnect/:room", (req, res) => {
  var key = req.params.room;
  delete rooms[key];
  debug(`Interview with token : ${req.params.room} disconnected`);
});

//@route -> index
app.get("/", (req, res) => {
  debug("Index Route Called");
  res.render("index", { rooms: rooms });
});

//@route -> room
//To create Interviewer Room
app.get("/interviewer/:token/:room", (req, res) => {
  debug(`Interviewer route active for : ${req.params.room}`);
  var salt = "DevelopedByManojAndShaurya";
  var hash = crypto
    .createHash("md5")
    .update(req.params.room + salt)
    .digest("hex");
  if (hash.toLowerCase() !== req.params.token.toLowerCase()) {
    debug(`Invalid Hash : ${hash} for room : ${req.params.room}`);
    return res.render("roomdoesnotexist");
  }
  if (rooms[req.params.room] == null) {
    rooms[req.params.room]=true;
    debug(
      `Room created successfully with token : ${req.params.room} by Interviewer `
    );
    return res.render("room", { room_name: req.params.room });
  }
});

//Create Candidate's Room
app.get("/candidate/:room", (req, res) => {
  if (rooms[req.params.room] == null) {
    debug(`Room with token : ${req.params.room} does not exist`);
    return res.render("roomdoesnotexist");
  }
  debug(`Candidate joined room with token : ${req.params.room}`);
  return res.render("room", { room_name: req.params.room });
});

app.get("*", (req, res) => {
  debug("Default Route");
  res.render("index", { rooms: rooms });
});

//socket connection established
try {
  io.on("connection", socket => {
    debug(`Socket Created`);
    socket.on("new_client", room => {
      io.in(room).clients(function(error, clients) {
        if (error) {
          debug(`Error while creating new client in new room ${room} ` + error);
          throw error;
        }
        if (clients.length >= 2) {
          debug("Trying to join an active Interview room ");
          socket.emit("session_active");
          return;
        }
        socket.join(room);

        if (clients.length < 2) {
          if (clients.length == 1) {
            debug("Creating Peer");
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
  debug("Error connecting Socket" + err);
}

videoServer.listen(5000, () => {
  console.log("videoServer listening on port: 5000");
});

collabEditServer.listen(443, function() {
  console.log("collabEditServer listening on port: 443");
});

httpServer.listen(80, () => {
  console.log("HTTP Server Listening on port : 80");
});
const wss = new WebSocket.Server({ server: collabEditServer });

wss.on("connection", (conn, req) => {
  try {
    setupWSConnection(conn, req, {
      gc: req.url.slice(1) !== "prosemirror-versions"
    });
    debug("YJS Setup successfull for Request " + req.url);
  } catch (err) {
    debug(`Error setting up YJS` + err);
  }
});
