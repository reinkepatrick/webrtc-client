import React from 'react';
import {StyleSheet, TouchableHighlight, StatusBar} from 'react-native';
import io from 'socket.io-client';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  MediaStream,
  MediaStreamTrack,
  mediaDevices,
  registerGlobals,
} from 'react-native-webrtc';
import {SERVER_URL} from './config';
import DeviceList from './src/components/DeviceList/DeviceList';

class App extends React.Component {
  isNegotiating = false;
  configuration = {iceServers: [{url: 'stun:stun.l.google.com:19302'}]};

  constructor(props) {
    super(props);

    this.state = {
      socket: io(SERVER_URL, {
        jsonp: false,
        transports: ['websocket'],
      }),
      pc: null,
      isFront: true,
      videoSourceId: null,
      stream: null,
      remote: null,
    };
  }

  componentDidMount() {
    this._getMediaDevices();

    this.state.socket.on('remoteDescription', data => {
      if (data.desc) {
        let sdp = new RTCSessionDescription(data.desc);

        if (sdp.type === 'offer') {
          let peer = this._onCreatePeer(data.from, false);

          peer.setRemoteDescription(sdp).then(() => {
            peer.createAnswer().then(desc => {
              peer.setLocalDescription(desc).then(() => {
                this._sentDescription(data.from, desc);
              });
            });
          });

          this.setState({
            pc: peer,
          });
        } else if (sdp.type === 'answer') {
          this.state.pc.setRemoteDescription(sdp);
        }
      } else if (data.candidate) {
        let candidate = new RTCIceCandidate(data.candidate);
        this.state.pc.addIceCandidate(candidate);
      }
    });
  }

  _getMediaDevices = () => {
    mediaDevices.enumerateDevices().then(sourceInfo => {
      for (let i = 0; i < sourceInfo.length; i++) {
        if (
          sourceInfo.kind === 'videoinput' &&
          sourceInfo.facing === (this.state.isFront ? 'front' : 'environment')
        ) {
          this.setState({
            videoSourceId: sourceInfo.deviceId,
          });
        }
      }
    });

    mediaDevices
      .getUserMedia({
        audio: true,
        video: {
          mandatory: {
            minWidth: 1920,
            minHeight: 1080,
            minFrameRate: 60,
          },
          facingMode: this.state.isFront ? 'user' : 'environment',
          optional: this.state.videoSourceId
            ? [{sourceId: this.state.videoSourceId}]
            : [],
        },
      })
      .then(stream => {
        this.setState({
          stream: stream,
        });
      })
      .catch(error => {
        console.log(error);
      });
  };

  _onCreatePeer = (socketId, isOffer) => {
    const peer = new RTCPeerConnection(this.configuration);

    peer.onnegotiationneeded = () => {
      if (this.isNegotiating) {
        return;
      }
      this.isNegotiating = true;
      if (isOffer) {
        peer.createOffer().then(desc => {
          peer.setLocalDescription(desc).then(() => {
            this._sentDescription(socketId, desc);
          });
        });
      }
    };

    peer.addStream(this.state.stream);

    peer.onaddstream = event => {
      this.setState({
        remote: event.stream,
      });
    };

    peer.onicecandidate = event => {
      if (event.candidate) {
        this.state.socket.emit('setDescription', {
          to: socketId,
          candidate: event.candidate,
        });
      }
    };

    peer.onsignalingstatechange = event => {
      this.isNegotiating = peer.signalingState !== 'stable';
    };
    peer.onremovestream = event => {};

    return peer;
  };

  _onSelectPeer = socketId => {
    let peer = this._onCreatePeer(socketId, true);
    this.setState({
      pc: peer,
    });
  };

  _sentDescription = (to, data) => {
    this.state.socket.emit('setDescription', {
      to: to,
      desc: data,
    });
  };

  render() {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        {this.state.remote ? (
          <RTCView
            style={styles.view}
            mirror={this.state.isFront}
            streamURL={this.state.remote.toURL()}
          />
        ) : this.state.socket ? (
          <DeviceList
            socket={this.state.socket}
            onSelectPeer={this._onSelectPeer}
          />
        ) : null}
      </>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    height: '100%',
    width: '100%',
  },
  view: {
    width: '100%',
    height: '100%',
  },
  text: {
    fontWeight: 'bold',
    marginBottom: 15,
    fontSize: 26,
  },
});

export default App;
