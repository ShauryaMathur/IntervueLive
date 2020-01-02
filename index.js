const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();
const options = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem")
};
const server = require("https").Server(options, app);
const crypto = require("crypto");

const server6 = require("https").Server(options, app);
const WebSocket = require("ws");

//const StaticServer = require('node-static').Server
const setupWSConnection = require("y-websocket/bin/utils.js").setupWSConnection;

//const production = process.env.PRODUCTION != null
//const port = process.env.PORT || 8080

const io = require("socket.io")(server);
//const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "https://codegrounds.co.in", credentials: true }));

//middleware
app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
//const staticServer = new StaticServer('.', { cache: production ? 3600 : false, gzip: production })

const rooms = {};

//@route -> createroom[post]
app.get("/createroom/:roomname", (req, res) => {
  //console.log('hi');

  if (rooms[req.params.roomname] != null) {
    return res.render("roomalreadyexists");
  }

  rooms[req.params.roomname] = { users: {} };
  //console.log("In",rooms);
  //res.redirect(`/interviewer/${req.params.roomname}`);
  res.status(200);
  io.emit("room_created", req.params.roomname);
});

//@route -> For Diconnecting Interview
app.get("/disconnect/:roomname", (req, res) => {
  var key = req.params.roomname;
  delete rooms[key];
});

//@route -> index
app.get("/", (req, res) => {
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
  if (hash.toLowerCase() !== req.params.token.toLowerCase()) {
    //console.log("1", "encryption mismatch");
    return res.render("roomdoesnotexist");
  }
  if (rooms[req.params.room] != null) {
    //console.log("2", "room already there", rooms);
    return res.render("room", { room_name: req.params.room });
  }
  rooms[req.params.room] = { users: {} };
  io.emit("room_created", req.params.room);
  //console.log("3", "new room created");
  return res.render("room", { room_name: req.params.room });
});
//Create Interviewee Room
app.get("/candidate/:room", (req, res) => {
  if (rooms[req.params.room] == null) {
    return res.render("roomdoesnotexist");
  }
  res.render("room", { room_name: req.params.room });
});

app.get("*", (req, res) => {
  res.render("index", { rooms: rooms });
});

//socket connection established
io.on("connection", socket => {
  //console.log('Socket Started');
  socket.on("new_client", room => {
    io.in(room).clients(function(error, clients) {
      if (error) {
        throw error;
      }
      if (clients.length >= 2) {
        socket.emit("session_active");
        return;
      }
      socket.join(room);

      if (clients.length < 2) {
        if (clients.length == 1) socket.emit("create_peer");
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

server.listen(443, () => {
  //console.log('Video server listening on port: 443');
});

server6.listen(5000, function() {
  //console.log('Site and CollabEditor server listening on port: 5000');
});
const wss = new WebSocket.Server({ server: server6 });
//console.log("hello\n\n", process.env.PORT,"hello\n\n");
wss.on("connection", (conn, req) =>
  setupWSConnection(conn, req, {
    gc: req.url.slice(1) !== "prosemirror-versions"
  })
);
