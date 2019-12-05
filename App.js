import React from 'react';
import {StyleSheet, StatusBar, TouchableOpacity} from 'react-native';
import io from 'socket.io-client';
import {SERVER_URL} from './config';
import DeviceList from './src/components/DeviceList/DeviceList';
import VideoCallView from './src/components/VideoCallView/VideoCallView';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      socket: io(SERVER_URL, {
        jsonp: false,
        transports: ['websocket'],
        connection: false,
        callee: null,
        caller: null,
      }),
    };
  }

  componentDidMount() {}

  _onSelectPeer = item => {
    this.setState({
      connection: true,
      callee: item,
    });
  };

  _onAcceptCall = item => {
    this.setState({
      connection: true,
      caller: item,
    });
  };

  _onCloseCall = () => {
    this.setState({
      connection: false,
      callee: null,
      caller: null,
    });
  };

  render() {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        {this.state.connection ? (
          <VideoCallView
            socket={this.state.socket}
            callee={this.state.callee}
            caller={this.state.caller}
            onCloseCall={this._onCloseCall}
          />
        ) : this.state.socket ? (
          <DeviceList
            socket={this.state.socket}
            onSelectPeer={this._onSelectPeer}
            onAcceptCall={this._onAcceptCall}
          />
        ) : null}
      </>
    );
  }
}

export default App;
