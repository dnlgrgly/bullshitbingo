import React from 'react';
import { StyleSheet, Text, View, TextInput, StatusBar, TouchableOpacity, Animated, ScrollView, ListView, Dimensions, Platform, Alert } from 'react-native';
import { StackNavigator } from 'react-navigation';
import * as GestureHandler from 'react-native-gesture-handler';
import { TabViewAnimated, TabBar } from 'react-native-tab-view';
import * as firebase from 'firebase';

const initialLayout = {
  height: 0,
  width: Dimensions.get('window').width,
};

const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});

export default class Game extends React.Component {
  state = {
    index: 0,
    routes: [
      { key: '1', title: 'Bingo' },
      { key: '2', title: 'Match info' }
    ],
    x: new Animated.Value(0),
    value: 0,

    myName: 'dandesz198',

    gameName: this.props.navigation.state.params.gameName,
    gameId: this.props.navigation.state.params.gameId,
    gameMaster: '',

    gameCards: ds.cloneWithRows([
      {
        text: 'Horváth Ákos',
        creator: 'szalaysz',
        voters: [
          'asdfmovie',
          'szalaysz'
        ]
      }, 
      {
        text: 'Tamáska Roland',
        creator: 'dandesz198',
        voters: [
          'dandesz198',
          'razor97'
        ]
      },
      {
        text: 'A lánya',
        creator: 'dibaczi',
        voters: [
          'dibaczi',
          'tamaskar'
        ]
      }
    ]),

    gameMembers: []
  };

  //Compare method for the players array
  compare(a,b) {
    if (a.points < b.points)
      return -1;
    if (a.points > b.points)
      return 1;
    return 0;
  }

  componentWillMount() {
    var thus = this;
    var members = [];

    firebase.database().ref('games/' + this.state.gameId + '/members/').orderByChild('points').once('value', function(snap) {
        snap.forEach(function(item) {
            var itemVal = item.val();
            members.push(itemVal);
        });
    });

    this.setState({gameMembers: members});

    firebase.database().ref('games/' + this.state.gameId + '/master').once('value', function(snap) {
      var str = JSON.stringify(snap);
      var finalstr = str.substring(1, str.length-1)
      thus.setState({gameMaster: finalstr});
    });

    //Starts the first loop in color changing
    this.changeColor();
  }

  _handleIndexChange = index => this.setState({ index });

  _renderHeader = (props) => {
    var bgColor = this.state.x.interpolate({
      inputRange: [1, 2, 3, 4, 5],
      outputRange: ['rgb(22, 160, 133)', 'rgb(39, 174, 96)', 'rgb(41, 128, 185)', 'rgb(142, 68, 173)', 'rgb(211, 84, 0)']
    });
    return(<TabBar style={{paddingTop: Platform.OS == 'ios' ? 15 : 0, backgroundColor: bgColor}} {...props}/>);
  };

  _renderScene = ({ route }) => {
    var bgColor = this.state.x.interpolate({
      inputRange: [1, 2, 3, 4, 5],
      outputRange: ['rgb(22, 160, 133)', 'rgb(39, 174, 96)', 'rgb(41, 128, 185)', 'rgb(142, 68, 173)', 'rgb(211, 84, 0)']
    });
    switch (route.key) {
      case '1':
      return (
        <ScrollView style={styles.container}>
          <Text style={[styles.heading, {color: '#555', fontSize: 30}]}>{this.state.gameName}</Text>
          <ListView
            dataSource={this.state.gameCards}
            enableEmptySections={true}
            style={styles.membersList}
            renderRow={(rowData) => <Text style={[styles.membersListItem]}>{rowData.text}</Text>}
          />
        </ScrollView>
      );
      case '2':      
      return (
        <ScrollView style={styles.container}>
          <Text style={[styles.heading, {color: '#555', fontSize: 30}]}>{this.state.gameName}</Text>
          <View style={{flexDirection: 'column'}}>
            <Text style={[styles.p, {marginTop: 5}]}>Game pin:</Text>
            <Text style={styles.h2}>{this.state.gameId}</Text>
            <Text style={[styles.p, {fontSize: 15}]}>Others will use this code to connect the game.</Text>
          </View>
          <View style={{flexDirection: 'column'}}>
            <Text style={[styles.p, {marginTop: 15}]}>Game master:</Text>
            <Text style={styles.h2}>{this.state.gameMaster}</Text>
            <Text style={[styles.p, {fontSize: 15}]}>They can give points for the winners of the match.</Text>
          </View>
          <Text style={[styles.heading, {color: '#555', fontSize: 30, marginTop: 20}]}>Members</Text>
          <ListView
            dataSource={ds.cloneWithRows(this.state.gameMembers.sort(function(a,b) {return (a.points < b.points) ? 1 : ((b.points < a.points) ? -1 : 0);} ))}
            enableEmptySections={true}
            style={{marginTop: 10, margin: -20}}
            renderRow={(rowData) => 
            <Animated.View style={{flex: 1, paddingHorizontal: 20, height: 40, flexDirection: 'row', justifyContent: 'center', backgroundColor: this.state.myName == rowData.name ? bgColor : 'transparent'}}>
              <Text style={[styles.membersListItem, {color: this.state.myName == rowData.name ? 'white' : '#555', marginTop: 7.5}]}><Text style={[styles.membersListItem, {fontWeight: '700', color: this.state.myName == rowData.name ? 'white' : '#555'}]}>{rowData.name}</Text> | {rowData.points} XP</Text>
              <Animated.View style={{padding: 5, margin: 5, borderColor: this.state.myName == rowData.name ? 'white' : bgColor, borderWidth: 1.5, borderRadius: 5, alignSelf: 'flex-end', marginRight: 0, marginLeft: 'auto'}}>
                <TouchableOpacity onPress={()=>{
                  Alert.alert(
                    'Are you sure?', 
                    'Do you *really* want to kick '+rowData.name+'? They can still rejoin the game.',
                    [ 
                      {text: 'Nope', onPress: () => console.log('Cancel'), style: 'cancel'},
                      {text: 'Yes', onPress: () => console.log('User kicked'), style: 'destructive'}
                    ],
                  );
                }}>
                  <Animated.Text style={{color: this.state.myName == rowData.name ? 'white' : bgColor}}>Kick player</Animated.Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
            }
          />
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
    var value = this.state.value;
    if(value > 5) {
      value = 0;
    } else {
      value += 1;
    }
    this.setState({value: value});
    Animated.timing(this.state.x, { toValue: value, duration: 3000 }).start();
    //Wait 3 sec before animating again
    setTimeout(() => {
      //Continue the animation
      this.changeColor()
    }, 3000);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  },

  welcome: {
    fontSize: 40,
    marginTop: 20,
    fontWeight: 'bold',
    color: '#ecf0f1'
  },

  heading: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#ecf0f1'
  },

  input: {
    color: '#ecf0f1',
    padding: 5,
    marginRight: 25,
    height: 45,
    fontSize: 18,
    borderColor: '#ecf0f1',
    borderBottomWidth: 2.5
  },

  button: {
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    shadowColor: '#999',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.7
  },

  membersList: {
    paddingTop: 5
  },

  membersListItem: {
    fontSize: 20,
    color: '#555',
    fontWeight: '500'
  },

  h2: {
    color: '#444',
    fontSize: 34,
    fontWeight: '700'
  },

  p: {
    color: '#666',
    fontSize: 20
  }
});