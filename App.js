import React from 'react';
import {StyleSheet, TouchableHighlight, StatusBar} from 'react-native';
import io from 'socket.io-client';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
} from 'react-native-webrtc';
import MediaDevice from './src/utils/mediaDevice';
import Peer from './src/utils/peer';
import {SERVER_URL} from './config';
import DeviceList from './src/components/DeviceList/DeviceList';

class App extends React.Component {
  mediaDevice = new MediaDevice(true, 480, 640, 30);

  constructor(props) {
    super(props);

    this.state = {
      socket: io(SERVER_URL, {
        jsonp: false,
        transports: ['websocket'],
      }),
      pc: null,
      stream: null,
      videoSourceId: null,
      remote: null,
    };

    this.mediaDevice.getStream().then(stream => {
      this.setState({
        stream: stream,
      });
    });
  }

  componentDidMount() {
    this.state.socket.on('remoteDescription', data => {
      if (data.desc) {
        let sdp = new RTCSessionDescription(data.desc);

        if (sdp.type === 'offer') {
          let peer = new Peer(
            this.state.stream,
            data.from,
            false,
            this._sentDescription,
            this._onRemoteStream,
          );

          peer.onOffer(sdp);

          this.setState({
            pc: peer,
          });
        } else if (sdp.type === 'answer') {
          this.state.pc.onAnswer(sdp);
        }
      } else if (data.candidate) {
        let candidate = new RTCIceCandidate(data.candidate);
        this.state.pc.addCandidate(candidate);
      }
    });
  }

  _onSelectPeer = socketId => {
    let peer = new Peer(
      this.state.stream,
      socketId,
      true,
      this._sentDescription,
      this._onRemoteStream,
    );
    this.setState({
      pc: peer,
    });
  };

  _sentDescription = (to, data) => {
    if (data.sdp) {
      this.state.socket.emit('setDescription', {
        to: to,
        desc: data,
      });
    } else if (data.candidate) {
      this.state.socket.emit('setDescription', {
        to: to,
        candidate: data,
      });
    }
  };

  _onRemoteStream = stream => {
    this.setState({
      remote: stream,
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
