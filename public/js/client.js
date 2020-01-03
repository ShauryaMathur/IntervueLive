document.addEventListener("DOMContentLoaded", event => {
  let localStream,
    client = {};
  let audioenabled = true;
  let disbalevideoenabled = true;
  let url = location.protocol + "//" + location.host+':5000';
  const axios = require("axios");
  const Peer = require("simple-peer");
  const io = require("socket.io-client");
  const socket = io(`${url}`);
  const DetectRTC = require("detectrtc");
  const clipboard = new ClipboardJS(".copy");
  const fullscreen = document.getElementById("fullscreen");
  //const invite = document.getElementById("invite");
  const host_stream = document.getElementById("host_stream");
  const remote_stream = document.getElementById("remote_stream");
  const disableVideo = document.getElementById("disablevideo");
  const compileAndRun = document.getElementById("compile");
  const mute = document.getElementById("mute");
  const hangup = document.getElementById("hangup");
  const invBtn = document.getElementById("invite");
  const link = document.getElementById("link");
  const waiting = document.getElementById("waiting");
  const muteicon = document.getElementById("muteicon");
  const disableVideoicon = document.getElementById("disableVideoicon");
  const maximize = document.getElementById("maximize");
  const maximizeIcon = document.getElementById("maximizeIcon");
  // const shareScreen = document.getElementById("sharescreen");
  const remoteStreamVideoBox = document.getElementById(
    "remote-stream-video-box"
  );
  const hangupConfirmationButton = document.getElementById(
    "hangupConfirmationButton"
  );

  videoStreamMaximizeFlag = true;

  if (location.href.indexOf("/candidate/") != -1) {
    hangup.remove();
    disableVideo.remove();
    mute.remove();
    invBtn.remove();
  }

  /*  document.addEventListener("visibilitychange",function(){
    if(document.location.href.indexOf('interviewer')===-1){
      confirm("Do NOT switch tabs!");

    }
      
  }); */

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
      socket.emit("new_client", room);
      localStream = stream;
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
      hangupConfirmationButton.addEventListener("click", () => {
        socket.emit("user_disconnected", room);
        axios
          .get("/disconnect/" + room)
          .then(function(res) {})
          .catch(function(err) {
            console.log(err);
          });
        remove_peer();
      });

      //mute audio
      mute.addEventListener("click", () => {
        let audioTracks = localStream.getAudioTracks();
        for (var i = 0; i < audioTracks.length; ++i) {
          audioTracks[i].enabled = !audioTracks[i].enabled;
          if (audioenabled) {
            muteicon.className = "fas fa-microphone fa-sm";
            mute.title = "Enable Audio";
          } else {
            muteicon.className = "fas fa-microphone-slash fa-sm";
            mute.title = "Disable Audio";
          }
          audioenabled = !audioenabled;
        }
      });

      //goto FullScreen
      fullscreen.addEventListener("click", () =>
        document.documentElement.requestFullscreen()
      );

      //disable video
      disableVideo.addEventListener("click", () => {
        videoTracks = localStream.getVideoTracks();
        for (var i = 0; i < videoTracks.length; ++i) {
          videoTracks[i].enabled = !videoTracks[i].enabled;
          if (disbalevideoenabled) {
            disableVideoicon.className = "fas fa-video fa-sm";
            disableVideo.title = "Enable Video";
          } else {
            disableVideoicon.className = "fas fa-video-slash fa-sm";
            disableVideo.title = "Disable Video";
          }
          disbalevideoenabled = !disbalevideoenabled;
        }
      });

      //maximise stream window
      maximize.addEventListener("click", () => {
        if (videoStreamMaximizeFlag) {
          remoteStreamVideoBox.className = "video-box2 maximized-stream";
          maximizeIcon.className = "fa fa-window-minimize";
          maximize.title = "Minimise Window";
          videoStreamMaximizeFlag = false;
        } else {
          remoteStreamVideoBox.classList.remove("maximized-stream");
          maximizeIcon.className = "fa fa-window-maximize";
          maximize.title = "Maximise Window";
          videoStreamMaximizeFlag = true;
        }
      });

      //invite url
      function getUrl() {
        let url = window.location.href
          .replace("interviewer", "candidate")
          .replace(window.location.href.split("/")[4] + "/", "");
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
      };

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
      //     .catch(err => //console.log(err));
      // });

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
