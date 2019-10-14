document.addEventListener("DOMContentLoaded", event => {
  let localStream,
    client = {};
  let audioenabled = true;
  let disbalevideoenabled = true;
  let url = "https://cgvideochat.herokuapp.com";
  const Peer = require("simple-peer");
  const io = require("socket.io-client");
  const socket = io(`${url}`);
  const DetectRTC = require("detectrtc");
  const clipboard = new ClipboardJS(".copy");
  const host_stream = document.getElementById("host_stream");
  const remote_stream = document.getElementById("remote_stream");
  const disableVideo = document.getElementById("disablevideo");
  const screensharebutton=document.getElementById("screensharebuttonid");
  const mute = document.getElementById("mute");
  const hangup = document.getElementById("hangup");
  const link = document.getElementById("link");
  const invBtn = document.getElementById("invite");
  const waiting = document.getElementById("waiting");
  const muteicon = document.getElementById("muteicon");
  const disableVideoicon = document.getElementById("disableVideoicon");

  self.MonacoEnvironment = {
    getWorkerUrl: function(moduleId, label) {
      if (label === "json") {
        return "/dist/json.worker.bundle.js";
      }
      if (label === "css") {
        return "/dist/css.worker.bundle.js";
      }
      if (label === "html") {
        return "/dist/html.worker.bundle.js";
      }
      if (label === "typescript" || label === "javascript") {
        return "/dist/ts.worker.bundle.js";
      }
      return "/dist/editor.worker.bundle.js";
    }
  };

  //initialize app with getUserMedia
  navigator.getMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;

  if (DetectRTC.isWebRTCSupported === false) {
    alert("Device not supported!");
  }
  if (DetectRTC.osName === "iOS" && DetectRTC.browser === "Chrome") {
    alert("Browser not supported! Please use Safari");
  }

  navigator.mediaDevices.getDisplayMedia({video: true,audio: true}).then(stream=>{screenstream=stream;}).catch(err=>{console.log(err);});

  screensharebutton.addEventListener("click",function(){
    
    navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: true
    })
    .then(stream => {
      //emit new client
      socket.emit("new_client", room);
      localStream = stream;
      console.log("screen2 in client", window.stream2);
      host_stream.setAttribute("autoplay", "");
      host_stream.setAttribute("muted", "");
      host_stream.setAttribute("playsinline", "");

      if ("srcObject" in host_stream) {
        host_stream.srcObject = stream;
      } else {
        // old browsers
        host_stream.src = URL.createObjectURL(stream);
      }

      //Peer constructor
      const init_peer = type => {
        let peer = new Peer({
          initiator: type == "init" ? true : false,
          stream: localStream,
          trickle: false
        });
        peer.on("stream", stream => {
          waiting.setAttribute("hidden", "");
          remote_stream.setAttribute("autoplay", "");
          remote_stream.setAttribute("muted", "");
          remote_stream.setAttribute("playsinline", "");

          if ("srcObject" in remote_stream) {
            remote_stream.srcObject = stream;
          } else {
            // old browsers
            remote_stream.src = URL.createObjectURL(stream);
          }
        });

        return peer;
      };

      //Create host
      const make_peer = () => {
        client.gotAnswer = false;
        let peer = init_peer("init");
        peer.on("signal", data => {
          if (!client.gotAnswer) {
            socket.emit("offer", room, data);
          }
        });
        client.peer = peer;
      };

      //Create remote peer
      const make_remote_peer = offer => {
        let peer = init_peer("notinit");
        peer.on("signal", data => {
          socket.emit("answer", room, data);
        });
        peer.signal(offer);
        client.peer = peer;
      };

      //session active message
      const session_active = () => {
        document.write("Session Active. Please try again later!");
      };

      //handle answer
      const signal_answer = answer => {
        client.gotAnswer = true;
        let peer = client.peer;
        peer.signal(answer);
      };

      //handle destroy peer
      const remove_peer = () => {
        remote_stream.remove();
        window.location.href = "/";
        if (client.peer) {
          client.peer.destroy();
        }
      };

      //hangup
      hangup.addEventListener("click", () => {
        socket.emit("user_disconnected", room);
        //console.log(`ROOOM:::${room}`)
        remove_peer();
      });

      //mute audio
      mute.addEventListener("click", () => {
        let audioTracks = localStream.getAudioTracks();
        for (var i = 0; i < audioTracks.length; ++i) {
          audioTracks[i].enabled = !audioTracks[i].enabled;
          if (audioenabled) muteicon.className = "fas fa-microphone";
          else muteicon.className = "fas fa-microphone-slash";

          audioenabled = !audioenabled;
        }
      });

      //disable video
      disableVideo.addEventListener("click", () => {
        //videoTracks = localStream.getVideoTracks();
        //videoTracks=screenstream.getVideoTracks();
        localStream=screenstream;
        // for (var i = 0; i < videoTracks.length; ++i) {
        //   videoTracks[i].enabled = !videoTracks[i].enabled;
        //   if (disbalevideoenabled) disableVideoicon.className = "fas fa-video";
        //   else disableVideoicon.className = "fas fa-video-slash";

        //   disbalevideoenabled = !disbalevideoenabled;
        // }
      });

      //invite
      function getUrl() {
        let url = window.location.href;
        link.value = url;
      }

      invBtn.addEventListener("click", getUrl());

      //events
      socket.on("sent_offer", make_remote_peer);
      socket.on("sent_answer", signal_answer);
      socket.on("session_active", session_active);
      socket.on("create_peer", make_peer);
      socket.on("remove_peer", remove_peer);
    })
    .catch(err => {
      alert(
        "Cannot get access to your media device! Check logs for more info."
      );
      console.log(err);
    });});
  
});
