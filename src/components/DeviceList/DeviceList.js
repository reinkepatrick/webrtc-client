import React from 'react';
import {StyleSheet, FlatList, SafeAreaView, Text} from 'react-native';

class DeviceList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      clients: [],
    };

    this.props.socket.on('clients', this._onAllClients);
  }

  componentDidMount() {
    this._ready();
  }

  componentWillUnmount() {
    this.props.socket.removeListener('clients', this._onAllClients);
    if (this.props.socket) {
      this.props.socket.emit('willDisconnect', {
        message: 'Client will disconnect!',
      });
    }
  }

  _onAllClients = data => {
    let index = data.clients.indexOf(this.props.socket.id);
    if (index > -1) {
      data.clients.splice(index, 1);
    }
    this.setState({
      clients: data.clients,
    });
  };

  _ready = () => {
    if (this.props.socket) {
      this.props.socket.emit('ready', {
        message: 'Client is ready!',
      });
    }
  };

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.id}>{this.props.socket.id}</Text>
        <Text style={styles.text}>Clients:</Text>
        <FlatList
          data={this.state.clients}
          renderItem={({item}) => (
            <Text
              style={styles.text}
              onPress={() => this.props.onSelectPeer(item)}>
              {item}
            </Text>
          )}
          keyExtractor={item => item}
        />
      </SafeAreaView>
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
  },
  text: {
    fontWeight: 'bold',
    marginBottom: 15,
    fontSize: 26,
  },
  id: {
    marginTop: 10,
  },
});

export default DeviceList;
