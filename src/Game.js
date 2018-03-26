import React from 'react';
import { StyleSheet, Text, View, TextInput, StatusBar, TouchableOpacity, Animated, ScrollView, ListView, Dimensions, Platform } from 'react-native';
import { StackNavigator } from 'react-navigation';
import * as GestureHandler from 'react-native-gesture-handler';
import { TabViewAnimated, TabBar } from 'react-native-tab-view';

const initialLayout = {
  height: 0,
  width: Dimensions.get('window').width,
};

export default class Game extends React.Component {
  state = {
    index: 0,
    routes: [
      { key: '1', title: 'Bingo' },
      { key: '2', title: 'Chat' },
      { key: '3', title: 'Members' },
    ],
    x: new Animated.Value(0),
  };

  componentWillMount() {
    //Starts the first loop in color changing
    this.changeColor();
  }

  _handleIndexChange = index => this.setState({ index });

  _renderHeader = (props) => {
    var bgColor = this.state.x.interpolate({
      inputRange: [1, 2, 3, 4, 5, 6, 7],
      outputRange: ['rgb(26, 188, 156)', 'rgb(22, 160, 133)', 'rgb(46, 204, 113)', 'rgb(39, 174, 96)', 'rgb(52, 152, 219)', 'rgb(41, 128, 185)', 'rgb(155, 89, 182)']
    });
    return(<TabBar style={{paddingTop: Platform.OS == 'ios' ? 15 : 0, backgroundColor: bgColor}} {...props}/>);
  };

  _renderScene = ({ route }) => {
      switch (route.key) {
        case '1':
        return (
          <ScrollView style={{ flex: 1 }}>
          </ScrollView>
        );
        case '2':
        return (
          <ScrollView style={{ flex: 1 }}>
          </ScrollView>
        );
        case '3':      
        return (
          <ScrollView style={{ flex: 1 }}>
          </ScrollView>
        );
        default:
        return null;
      }
  };

  render() {
    return (
      <TabViewAnimated
        navigationState={this.state}
        renderScene={this._renderScene}
        renderHeader={this._renderHeader}
        onIndexChange={this._handleIndexChange}
        initialLayout={initialLayout}
      />
    );
  }

  //Animate to the next color
  changeColor() {
      Animated.timing(this.state.x, { toValue: Math.floor(Math.random() * 7), duration: 5000 }).start();
      //Wait 5 sec before animating again
      setTimeout(() => {
        //Continue the animation
        this.changeColor()
      }, 5000);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center'
  },

  welcome: {
    fontSize: 40,
    marginTop: 20,
    fontWeight: 'bold',
    color: '#ecf0f1'
  },

  heading: {
    fontSize: 25,
    marginTop: 25,
    fontWeight: 'bold',
    color: '#ecf0f1'
  },

  instructions: {
    fontSize: 18,
    textAlign: 'center',
    color: '#ecf0f1'
  },

  input: {
    color: '#ecf0f1',
    padding: 5,
    marginRight: 20,
    height: 50,
    fontSize: 18,
    borderColor: '#ecf0f1',
    borderBottomWidth: 2.5
  },

  button: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    shadowColor: '#888',
    shadowOffset: {width: 0, height: 2.5},
    shadowOpacity: 0.7
  },

  join: {
    fontSize: 20,
    textAlign: 'center'
  },

  gameList: {
    color: 'white',
    fontWeight: '200',
    fontSize: 20,
    marginVertical: 7.5
  }
});