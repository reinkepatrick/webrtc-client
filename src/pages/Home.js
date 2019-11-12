import React from 'react';
import {StyleSheet, View, Text, StatusBar} from 'react-native';

class Homescreen extends React.Component {
  render() {
    return (
      <>
        <StatusBar barStyle="dark-content" />
        <View style={styles.container}>
          <Text style={styles.text}>Test</Text>
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

export default Homescreen;
