import {RTCPeerConnection} from 'react-native-webrtc';

class Peer {
  isNegotiating = false;
  configuration = {iceServers: [{url: 'stun:stun.l.google.com:19302'}]};
  peer = null;
  socketId = null;
  stream = null;

  constructor(
    stream,
    socketId,
    isOffer,
    sentDescription,
    onRemoteStream,
    onCloseCall,
  ) {
    this.onCloseCall = onCloseCall;
    this.sentDescription = sentDescription;
    this.socketId = socketId;
    this.peer = new RTCPeerConnection(this.configuration);
    this.stream = stream;

    this.peer.onnegotiationneeded = data => {
      if (this.isNegotiating) {
        return;
      }
      this.isNegotiating = true;
      if (isOffer) {
        this.peer.createOffer().then(desc => {
          this.peer.setLocalDescription(desc).then(() => {
            sentDescription(this.socketId, desc);
          });
        });
      }
    };

    this.peer.addStream(this.stream);

    this.peer.onaddstream = event => {
      onRemoteStream(event.stream);
    };

    this.peer.onicecandidate = event => {
      if (event.candidate) {
        sentDescription(this.socketId, event.candidate);
      }
    };

    this.peer.onsignalingstatechange = () => {
      this.isNegotiating = this.peer.signalingState !== 'stable';
    };

    this.peer.oniceconnectionstatechange = data => {
      if (this.peer.iceConnectionState === 'disconnected') {
        this.close();
      }
    };
  }

  onOffer = sdp => {
    this.peer.setRemoteDescription(sdp).then(() => {
      this.peer.createAnswer().then(desc => {
        this.peer.setLocalDescription(desc).then(() => {
          this.sentDescription(this.socketId, desc);
        });
      });
    });
  };

  onAnswer = sdp => {
    this.peer.setRemoteDescription(sdp);
  };

  addCandidate = candidate => {
    this.peer.addIceCandidate(candidate);
  };

  close = () => {
    this.peer.close();
    this.onCloseCall();
  };
}

export default Peer;
