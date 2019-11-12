/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React from 'react';
import {StyleSheet, View, Text, Button, StatusBar} from 'react-native';
import io from 'socket.io-client';
import {SERVER_URL} from './config';

class App extends React.Component {
  socket = null;
  state = {
    buttonPressed: 0,
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

    this.socket.on('button_pressed', data => {
      this.setState({
        buttonPressed: data,
      });
    });

    this.socket.on('connect_error', err => {
      console.log(err);
    });
  }

  onClick = () => {
    this.socket.emit('button_pressed', this.state.buttonPressed);
  };

  render() {
    return (
      <>
        <StatusBar barStyle="dark-content" />
        <View style={styles.container}>
          <Text style={styles.text}>{this.state.buttonPressed}</Text>
          <Button title="Gib mir Pi" onPress={this.onClick} />
        </View>
      </>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default App;
