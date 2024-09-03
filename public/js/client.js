document.addEventListener("DOMContentLoaded", (event) => {
  let localStream,
    client = {};
  let audioEnabled = true;
  let disableVideoEnabled = true;
  const url = `${location.protocol}//${location.hostname}:4000`;
  console.log(url);

  const axios = require("axios");
  const Peer = require("simple-peer");
  const socket = io(url);
  const DetectRTC = require("detectrtc");
  const clipboard = new ClipboardJS(".copy");

  const fullscreen = document.getElementById("fullscreen");
  const hostStream = document.getElementById("host_stream");
  const remoteStream = document.getElementById("remote_stream");
  const disableVideo = document.getElementById("disablevideo");
  const mute = document.getElementById("mute");
  const hangup = document.getElementById("hangup");
  const invBtn = document.getElementById("invite");
  const link = document.getElementById("link");
  const waiting = document.getElementById("waiting");
  const muteIcon = document.getElementById("muteicon");
  const disableVideoIcon = document.getElementById("disableVideoicon");
  const maximize = document.getElementById("maximize");
  const maximizeIcon = document.getElementById("maximizeIcon");
  const remoteStreamVideoBox = document.getElementById("remote-stream-video-box");
  const hangupConfirmationButton = document.getElementById("hangupConfirmationButton");

  let videoStreamMaximizeFlag = true;

  if (location.href.includes("/candidate/")) {
    hangup.remove();
    disableVideo.remove();
    mute.remove();
    invBtn.remove();
  }

  /* 
  document.addEventListener("visibilitychange", function() {
    if (document.location.href.includes('interviewer')) {
      confirm("Do NOT switch tabs!");
    }
  });
  */

  if (!DetectRTC.isWebRTCSupported) {
    alert("Device not supported!");
  }
  if (DetectRTC.osName === "iOS" && DetectRTC.browser === "Chrome") {
    alert("Browser not supported! Please use Safari");
  }

  console.log('DOM2');

  navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then((stream) => {
      console.log('New client');

      socket.emit("new_client", room);
      localStream = stream;
      hostStream.setAttribute("autoplay", "");
      hostStream.setAttribute("muted", "");
      hostStream.setAttribute("playsinline", "");

      hostStream.srcObject = stream;

      const initPeer = (type) => {
        console.log('Init peer');

        let peer = new Peer({
          initiator: type === "init",
          stream: localStream,
          trickle: false,
          config: {
            iceServers: [
              {
                urls: "stun:global.stun.twilio.com:3478"
              },
              {
                urls: "turn:your.turn.server:3478",
                username: "yourUsername",
                credential: "yourPassword"
              }
            ]
          }
        });

        peer.on("stream", (stream) => {
          waiting.hidden = true;
          remoteStream.setAttribute("autoplay", "");
          remoteStream.setAttribute("muted", "");
          remoteStream.setAttribute("playsinline", "");

          remoteStream.srcObject = stream;
        });

        return peer;
      };

      const makePeer = () => {
        client.gotAnswer = false;
        let peer = initPeer("init");
        peer.on("signal", (data) => {
          if (!client.gotAnswer) {
            socket.emit("offer", room, data);
          }
        });
        client.peer = peer;
      };

      const makeRemotePeer = (offer) => {
        let peer = initPeer("notinit");
        peer.on("signal", (data) => {
          socket.emit("answer", room, data);
        });
        peer.signal(offer);
        client.peer = peer;
      };

      const sessionActive = () => {
        document.write("Session Active. Please try again later!");
      };

      const signalAnswer = (answer) => {
        client.gotAnswer = true;
        client.peer.signal(answer);
      };

      const removePeer = () => {
        remoteStream.remove();
        window.location.href = "/";
        if (client.peer) {
          client.peer.destroy();
        }
      };

      hangupConfirmationButton.addEventListener("click", () => {
        socket.emit("user_disconnected", room);
        axios
          .get(`/disconnect/${room}`)
          .then((res) => {})
          .catch((err) => {
            console.log(err);
          });
        removePeer();
      });

      mute.addEventListener("click", () => {
        localStream.getAudioTracks().forEach((track) => {
          track.enabled = !track.enabled;
          if (audioEnabled) {
            muteIcon.className = "fas fa-microphone-slash fa-sm";
            mute.title = "Enable Audio";
          } else {
            muteIcon.className = "fas fa-microphone fa-sm";
            mute.title = "Disable Audio";
          }
          audioEnabled = !audioEnabled;
        });
      });

      fullscreen.addEventListener("click", () =>
        document.documentElement.requestFullscreen()
      );

      disableVideo.addEventListener("click", () => {
        localStream.getVideoTracks().forEach((track) => {
          track.enabled = !track.enabled;
          if (disableVideoEnabled) {
            disableVideoIcon.className = "fas fa-video-slash fa-sm";
            disableVideo.title = "Enable Video";
          } else {
            disableVideoIcon.className = "fas fa-video fa-sm";
            disableVideo.title = "Disable Video";
          }
          disableVideoEnabled = !disableVideoEnabled;
        });
      });

      maximize.addEventListener("click", () => {
        if (videoStreamMaximizeFlag) {
          remoteStreamVideoBox.className = "video-box2 maximized-stream";
          maximizeIcon.className = "fa fa-window-minimize";
          maximize.title = "Minimize Window";
        } else {
          remoteStreamVideoBox.classList.remove("maximized-stream");
          maximizeIcon.className = "fa fa-window-maximize";
          maximize.title = "Maximize Window";
        }
        videoStreamMaximizeFlag = !videoStreamMaximizeFlag;
      });

      function getUrl() {
        let url = window.location.href
          .replace("interviewer", "candidate")
          .replace(window.location.href.split("/")[4] + "/", "");
        link.value = url;
      }

      invBtn.addEventListener("click", getUrl);

      const addMedia = (stream) => {
        hostStream.setAttribute("autoplay", "");
        hostStream.setAttribute("muted", "");
        hostStream.setAttribute("playsinline", "");

        hostStream.srcObject = stream;
      };

      // shareScreen.addEventListener("click", () => {
      //   client.peer.removeStream(localStream);

      //   navigator.mediaDevices
      //     .getDisplayMedia({ audio: true, video: true })
      //     .then(stream => {
      //       localStream = stream;
      //       client.peer.addStream(stream);

      //       var videoTracks = stream.getVideoTracks();
      //       for(let i=0;i<videoTracks.length;i++)
      //         client.peer.addTrack(videoTracks[i],stream);

      //     })
      //     .catch(err => console.log(err));
      // });

      socket.on("sent_offer", makeRemotePeer);
      socket.on("sent_answer", signalAnswer);
      socket.on("session_active", sessionActive);
      socket.on("create_peer", makePeer);
      socket.on("remove_peer", removePeer);
    })
    .catch((err) => {
      alert("Cannot get access to your media device! Check logs for more info.");
      console.log(err);
    });
});
