import React from 'react';
import {StyleSheet, TouchableOpacity, Text} from 'react-native';
import {
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
} from 'react-native-webrtc';
import MediaDevice from '../../utils/mediaDevice';
import Peer from '../../utils/peer';

class VideoCallView extends React.Component {
  mediaDevice = new MediaDevice(true, 480, 640, 30);

  constructor(props) {
    super(props);

    this.state = {
      pc: null,
      stream: null,
      videoSourceId: null,
      remote: null,
    };
  }

  componentDidMount() {
    this.mediaDevice.getStream().then(stream => {
      this.setState({
        stream: stream,
      });

      if (this.props.callee) {
        this._onSelectPeer(this.props.callee);
      }
    });

    this.props.socket.on('remoteDescription', this._onRemoteDescripton);
  }

  componentWillUnmount() {
    this.props.socket.removeListener(
      'remoteDescription',
      this._onRemoteDescripton,
    );
    this.state.pc.close();
    this.setState({
      pc: null,
      stream: null,
      videoSourceId: null,
      remote: null,
    });
  }

  _onRemoteDescripton = data => {
    if (data.desc) {
      let sdp = new RTCSessionDescription(data.desc);

      if (sdp.type === 'offer') {
        let peer = new Peer(
          this.state.stream,
          data.from,
          false,
          this._sentDescription,
          this._onRemoteStream,
          this._onCloseCall,
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
  };

  _onSelectPeer = socketId => {
    let peer = new Peer(
      this.state.stream,
      socketId,
      true,
      this._sentDescription,
      this._onRemoteStream,
      this._onCloseCall,
    );
    this.setState({
      pc: peer,
    });
  };

  _sentDescription = (to, data) => {
    if (data.sdp) {
      this.props.socket.emit('setDescription', {
        to: to,
        desc: data,
      });
    } else if (data.candidate) {
      this.props.socket.emit('setDescription', {
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

  _onCloseCall = () => {
    this.props.onCloseCall();
  };

  render() {
    return this.state.remote ? (
      <React.Fragment>
        <TouchableOpacity onPress={() => this.mediaDevice.switchCamera()}>
          <RTCView
            style={styles.view}
            mirror={this.state.isFront}
            streamURL={this.state.remote.toURL()}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.decline]}
          onPress={this._onCloseCall}>
          <Text style={styles.decline}>Beenden</Text>
        </TouchableOpacity>
      </React.Fragment>
    ) : null;
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
  button: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    padding: 10,
  },
  decline: {
    backgroundColor: '#cd0030',
    color: '#ffffff',
  },
});

export default VideoCallView;
