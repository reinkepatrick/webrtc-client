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

class App extends React.Component {
  socket = null;
  configuration = {iceServers: [{url: 'stun:stun.l.google.com:19302'}]};
  state = {
    pc: new RTCPeerConnection(this.configuration),
    isFront: false,
    frontVideoId: null,
    backVideoId: null,
    stream: null,
    remote: null,
  };

  constructor(props) {
    super(props);

    this.socket = io(SERVER_URL, {
      reconnection: true,
      reconnectionDelay: 500,
      jsonp: false,
      reconnectionAttempts: Infinity,
      transports: ['websocket'],
    });

    this.socket.on('connect_error', err => {
      console.log(err);
    });
  }

  componentDidMount() {
    mediaDevices.enumerateDevices().then(sourceInfos => {
      for (let i = 0; i < sourceInfos.length; i++) {
        if (sourceInfos[i].kind === 'videoinput') {
          if (sourceInfos[i].facing === 'front') {
            this.setState({
              frontVideoId: sourceInfos[i].deviceId,
            });
          } else {
            this.setState({
              backVideoId: sourceInfos[i].deviceId,
            });
          }
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
        optional: this.state.isFront ? [{sourceId: this.state.frontVideoId}] : [],
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
  }

  _onPressButton = () => {
    this.state.stream.getVideoTracks().forEach(track => {
      track._switchCamera();
    });

    this.setState(prevState => ({
      isFront: !prevState.isFront
    }))
  };

  render() {
    this.state.stream ? this.state.stream.getAudioTracks().readonly = false : null
    console.log(this.state.stream ? this.state.stream.getAudioTracks() : null);
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <TouchableHighlight
          style={styles.container}
          onPress={this._onPressButton}>
          {this.state.stream ? (
            <RTCView
              style={styles.view}
              mirror={this.state.isFront}
              streamURL={this.state.stream.toURL()}
            />
          ) : (
            <></>
          )}
        </TouchableHighlight>
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
