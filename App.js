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
  configuration = {iceServers: [{url: 'stun:stun.l.google.com:19302'}]};

  constructor(props) {
    super(props);

    this.state = {
      socket: io(SERVER_URL, {
        jsonp: false,
        transports: ['websocket'],
      }),
      pc: new RTCPeerConnection(this.configuration),
      rpc: new RTCPeerConnection(this.configuration),
      isFront: false,
      frontVideoId: null,
      backVideoId: null,
      stream: null,
      remote: null,
    };

    console.log(this.state.socket);
    //this._getMediaDevices();
  }

  componentDidMount() {
    /*this.socket.on('remoteDescription', desc => {
      let sdp = new RTCSessionDescription(desc);
      console.log(sdp);

      if (sdp.type === 'offer') {
        this.state.pc.setRemoteDescription(sdp);
      }
    });

    this.socket.on('connect_error', err => {
      console.log(err);
    });

    this.socket.on('disconnect', function() {
      console.log('The client has disconnected!');
    });

    this._setPeerConnection();*/
  }

  _sentDescription(desc) {
    if (this.state.socket) {
      this.state.socket.emit('setDescription', desc);
    }
  }

  _setPeerConnection() {
    this.state.pc.createOffer().then(desc => {
      this.state.pc.setLocalDescription(desc).then(() => {
        this._sentDescription(desc);
      });
    });
  }

  _getMediaDevices = () => {
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
          optional: this.state.isFront
            ? [{sourceId: this.state.frontVideoId}]
            : [{sourceId: this.state.backVideoId}],
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

    this.state.pc.onicecandidate = e => {
      console.log(e);
    };
  };

  _onPressButton = () => {
    this.state.stream.getVideoTracks().forEach(track => {
      track._switchCamera();
    });

    this.setState(prevState => ({
      isFront: !prevState.isFront,
    }));
  };

  render() {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        {this.state.socket ? <DeviceList socket={this.state.socket} /> : null}
      </>
    );
  }
}

/*
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
*/

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
