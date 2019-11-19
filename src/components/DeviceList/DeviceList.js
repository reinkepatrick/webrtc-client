import React from 'react';
import {StyleSheet, View, Text} from 'react-native';

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
    let clients = this.state.clients.map(client => {
      return (
        <Text key={client} style={styles.text}>
          {client}
        </Text>
      );
    });
    return (
      <View style={styles.container}>
        <Text style={styles.id}>{this.props.socket.id}</Text>
        <Text style={styles.text}>Clients:</Text>
        {clients}
      </View>
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
});

export default DeviceList;
