const express = require("express");
const cors = require("cors");
const app = express();
const server = require("http").Server(app);
const WebSocket = require("ws");
//const http = require("http");

//const StaticServer = require('node-static').Server
const setupWSConnection = require("y-websocket/bin/utils.js").setupWSConnection;

//const production = process.env.PRODUCTION != null
//const port = process.env.PORT || 8080

const io = require("socket.io")(server);
const PORT = process.env.PORT || 5000;

//app.use(cors());

//middleware
app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
//const staticServer = new StaticServer('.', { cache: production ? 3600 : false, gzip: production })

const rooms = {};

//@route -> createroom[post]
app.get("/createroom/:roomname", (req, res) => {
  if (rooms[req.params.roomname] != null) {
    return res.render("roomalreadyexists");
  }
  console.log("In");
  rooms[req.params.roomname] = { users: {} };
  res.redirect(`/interviewer/${req.params.roomname}`);
  io.emit("room_created", req.params.roomname);
});

//@route -> index
app.get("/", (req, res) => {
  res.render("index", { rooms: rooms });
});

/* const server2 = http.createServer((request, response) => {
  request.addListener('end', () => {
    staticServer.serve(request, response)
  }).resume()
}) */

//@route -> room
//To create Interviewer Room
app.get("/interviewer/:room", (req, res) => {
  if (rooms[req.params.room] == null) {
    return res.render("roomdoesnotexist");
  }
  res.render("room", { room_name: req.params.room });
});

//Create Interviewee Room
app.get("/candidate/:room", (req, res) => {
  if (rooms[req.params.room] == null) {
    return res.render("roomdoesnotexist");
  }
  res.render("room", { room_name: req.params.room });
});


//socket connection established
io.on("connection", socket => {
  socket.on("new_client", room => {
    io.in(room).clients(function(error, clients) {
      if (error) {
        throw error;
      }
      if (clients.length >= 3) {
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

app.use(function(req, res, next) {
  res.status(404);
  res.send("404");
});
const wss = new WebSocket.Server({ server });

wss.on("connection", (conn, req) =>
  setupWSConnection(conn, req, {
    gc: req.url.slice(1) !== "prosemirror-versions"
  })
);
/* server2.listen(port, () => {
  console.log(`Server for wbsocket started on PORT --> ${PORT}`);
}); */
server.listen(PORT, () => {
  console.log(`Server started on PORT --> ${PORT}`);
});
