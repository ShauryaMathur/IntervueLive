const express = require("express");
var ReverseMd5 = require('reverse-md5');
const cors = require("cors");
const app = express();
const server = require("http").Server(app);
const crypto = require('crypto')

const server6 = require("http").Server(app);
const WebSocket = require("ws");
//const http = require("http");

//const StaticServer = require('node-static').Server
const setupWSConnection = require("y-websocket/bin/utils.js").setupWSConnection;

//const production = process.env.PRODUCTION != null
//const port = process.env.PORT || 8080

const io = require("socket.io")(server);
//const PORT = process.env.PORT || 5000;

var reverseMd5 = ReverseMd5({
	lettersUpper: true,
	lettersLower: true,
	numbers: true,
	special: false,
	whitespace: true,
	maxLen: 12
});

app.use(cors({origin:'https://codegrounds.co.in',credentials:true}));

//middleware
app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
//const staticServer = new StaticServer('.', { cache: production ? 3600 : false, gzip: production })

const rooms = {};

//@route -> createroom[post]
app.get("/createroom/:roomname", (req, res) => {
  console.log('hi');

  if (rooms[req.params.roomname] != null) {
    return res.render("roomalreadyexists");
  }


  
  rooms[req.params.roomname] = { users: {} };
  console.log("In",rooms);
  //res.redirect(`/interviewer/${req.params.roomname}`);
  res.status(200);
  io.emit("room_created", req.params.roomname);
});

//@route -> For Diconnecting Interview
app.get("/disconnect/:roomname",(req,res)=>{
  var key=req.params.roomname;
  delete rooms[key];
})

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
app.get("/interviewer/:token/:room", (req, res) => {

  var salt='DevelopedByManojAndShaurya';
  

  var hash = crypto.createHash('md5').update(req.params.room+salt).digest("hex");
  console.log('hash',hash);
  if (rooms[req.params.room] != null) {
    return res.render("roomalreadyexists");
  }
  
  rooms[req.params.room] = { users: {} };
  console.log("In",rooms);
  //res.redirect(`/interviewer/${req.params.roomname}`);
  //res.status(200);
  io.emit("room_created", req.params.room);

  if (rooms[req.params.room] == null || hash.toLowerCase()!==req.params.token.toLowerCase()) {
    console.log('4','Here');
    return res.render("roomdoesnotexist");
  }
  console.log('ab');
  return res.render("room", { room_name: req.params.room });
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
  console.log('here');
  console.log('Socket Started');
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

/* app.use(function(req, res, next) {
  res.status(404);
  res.send("404");
}); */

/* server2.listen(port, () => {
  console.log(`Server for wbsocket started on PORT --> ${PORT}`);
}); */

server.listen(5000,() => {
    console.log('Video server listening on port: 5000');
});

server6.listen(8080, function() {
  console.log('Site and CollabEditor server listening on port: 8080');
}); 
const wss = new WebSocket.Server({ server:server6 });

wss.on("connection", (conn, req) =>
  setupWSConnection(conn, req, {
    gc: req.url.slice(1) !== "prosemirror-versions"
  })
);  
