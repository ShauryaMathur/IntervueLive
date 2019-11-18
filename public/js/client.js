document.addEventListener("DOMContentLoaded", event => {

  document.documentElement.requestFullscreen();
  console.log(location.hash);
  if(location.hash==='#1')
    console.log("I am creator");
  else  
    console.log("I sux")
  
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
 // const shareScreen = document.getElementById("sharescreen");
  const mute = document.getElementById("mute");
  const hangup = document.getElementById("hangup");
  const link = document.getElementById("link");
  const invBtn = document.getElementById("invite");
  const waiting = document.getElementById("waiting");
  const muteicon = document.getElementById("muteicon");
  const disableVideoicon = document.getElementById("disableVideoicon");
<<<<<<< HEAD
  const maximize=document.getElementById("maximize");
  const remoteStreamVideoBox=document.getElementById("remote-stream-video-box");
  const minimize=document.getElementById("minimize");
  let videoStreamMaximizeFlag = false;
=======
>>>>>>> Revert "Test new socket URL"

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

  document.addEventListener("visibilitychange",function(){
    if(document.location.href.indexOf('interviewer')===-1){
      confirm("Do NOT switch tabs!");

    }
      
  });

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

  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: true
    })
    .then(stream => {
      //emit new client
      socket.emit("new_client", room);
      localStream = stream;
      //console.log("screen2 in client", window.stream2);
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
        console.log("I am the creator");
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
          if (audioenabled) muteicon.className = "fas fa-microphone fa-sm";
          else muteicon.className = "fas fa-microphone-slash fa-sm";

          audioenabled = !audioenabled;
        }
      });

      //disable video
      disableVideo.addEventListener("click", () => {
        videoTracks = localStream.getVideoTracks();
        for (var i = 0; i < videoTracks.length; ++i) {
          videoTracks[i].enabled = !videoTracks[i].enabled;
          if (disbalevideoenabled) disableVideoicon.className = "fas fa-video fa-sm";
          else disableVideoicon.className = "fas fa-video-slash fa-sm";

          disbalevideoenabled = !disbalevideoenabled;
        }
      });

<<<<<<< HEAD
      //maximise stream window
      maximize.addEventListener("click",()=>{

        videoStreamMaximizeFlag=true;

        if(videoStreamMaximizeFlag){
          remoteStreamVideoBox.className="video-box2 maximized-stream";
        }
      });

      //Minimize stream window
      minimize.addEventListener('click',()=>{
        
        videoStreamMaximizeFlag=false;
        if(!videoStreamMaximizeFlag)
          remoteStreamVideoBox.classList.remove("maximized-stream");
      });

      //invite url
=======
      //invite
>>>>>>> Revert "Test new socket URL"
      function getUrl() {
        let url = window.location.href.replace('interviewer','candidate');
        link.value = url;
      }

      invBtn.addEventListener("click", getUrl());

      addMedia = stream => {
        
        host_stream.setAttribute("autoplay", "");
        host_stream.setAttribute("muted", "");
        host_stream.setAttribute("playsinline", "");

        if ("srcObject" in host_stream) {
          host_stream.srcObject = stream;
        } else {
          // old browsers
          host_stream.src = URL.createObjectURL(stream);
        }
        
        if(document.location.href.indexOf('interviewer')>-1)
          document.location.reload();
        console.log("Done");
      };

<<<<<<< HEAD
      // shareScreen.addEventListener("click", () => {
        
      //   client.peer.removeStream(localStream);

      //   navigator.mediaDevices
      //     .getDisplayMedia({ audio: true, video: true })
      //     .then(stream => {
      //       localStream = stream;

      //       client.peer.addStream(stream);

      //       //client.peer.on('stream',stream=>{});
      //       var videoTracks = stream.getVideoTracks();
      //       for(let i=0;i<videoTracks.length;i++)
      //         client.peer.addTrack(videoTracks[i],stream);

      //       // client.peer.signal();
      //       // addMedia(stream);
      //     })
      //     .catch(err => console.log(err));
      // });
=======
      shareScreen.addEventListener("click", () => {
        client.peer.removeStream(localStream);

        navigator.mediaDevices
          .getDisplayMedia({ audio: false, video: true })
          .then(stream => {
            localStream = stream;

            client.peer.addStream(localStream);

            //addMedia(stream);
          })
          .catch(err => console.log(err));
      });
>>>>>>> Revert "Test new socket URL"

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
    });
});
