import React from 'react';
import { StyleSheet, Text, View, TextInput, StatusBar, TouchableOpacity, Animated, ScrollView, ListView, Dimensions, Platform, Alert } from 'react-native';
import { StackNavigator, NavigationActions } from 'react-navigation';
import * as GestureHandler from 'react-native-gesture-handler';
import { TabViewAnimated, TabBar } from 'react-native-tab-view';
import * as firebase from 'firebase';
import Home from './Home.js';
import Card from './Components/Card.js';
import { Analytics, PageHit, Event } from 'expo-analytics';

let Environment = require('./environment.js')

let initialLayout = {
  height: 0,
  width: Dimensions.get('window').width,
};

let ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});

let analytics = new Analytics(Environment.analytics);

var isMounted = false;

transitionConfig : () => ({
	transitionSpec: {
		duration: 0,
		timing: Animated.timing,
		easing: Easing.step0,
	},
})

export default class Room extends React.Component {
  state = {
    index: 0,
    routes: [
      { key: '1', title: 'Matches' },
      { key: '2', title: 'Room info' }
    ],
    x: new Animated.Value(0),
    value: 0,

    myName: this.props.navigation.state.params.myName,

    gameName: this.props.navigation.state.params.gameName,
    gameId: this.props.navigation.state.params.gameId,
    gameMaster: '',

    matches: [],

    gameMembers: [],

    newMatchText: '',
  };

  componentDidMount() {
    //Sync Firebase
    this.getData();
    //Starts the first loop in color changing
    this.changeColor();

    analytics.hit(new PageHit('Game'));
  }

  componentWillMount() {
    isMounted = true;
  }

  componentWillUnmount() {
    isMounted = false;
  }

  //Download match data from Firebase
  getData() {
    var thus = this;
    var members = [];

    //Get data and add listener
    firebase.database().ref('games/' + this.state.gameId+'/').on('value', async function(snapshot) {
      //Parse objects
      let snap = snapshot.val();

      let membersName = Object.values(snap.members);
      var members = [];

      membersName.forEach(element => {
        firebase.database().ref('users/'+element+'/').once('value', function(snp) {
          members.push(snp.val());
        });
      });

      var matches = [];
      if(snap.matches) {
        snap.matches.forEach(element => {
          matches.push(element);
        });
      } else {
        thus.setState({gameMembers: members, gameMaster: snap.master, matches: []});
        return;
      }
      thus.setState({gameMembers: members, gameMaster: snap.master, matches: matches});
    });

    //Add the user kicker listener
    firebase.database().ref('games/' + this.state.gameId+'/members').on('child_removed', async function(snap) {
      if(snap.val() == thus.state.myName) {
        thus.props.navigation.state.params.returnData(thus.state.gameName);
        thus.props.navigation.goBack();
        Alert.alert('Kicked', "You were kicked from the game. You can still rejoin if you'd like to.");        
      }
    });
  }

  returnData(id) {
    this.props.navigation.state.params.returnData(this.state.gameName);
    this.props.navigation.goBack();
  }

  //Upload data to Firebase
  syncToFirebase() {
    //Upload every card to Firebase
    firebase.database().ref('games/'+this.state.gameId+'/').update({
      matches: this.state.matches
    });
  }

  _handleIndexChange = index => this.setState({ index });

  _renderHeader = (props) => {
    var bgColor = this.state.x.interpolate({
      inputRange: [1, 2, 3, 4],
      outputRange: ['rgb(26, 188, 156)', 'rgb(22, 160, 133)', 'rgb(46, 204, 113)', 'rgb(39, 174, 96)']
    });
    return(<TabBar style={{paddingTop: 15, backgroundColor: bgColor}} {...props}/>);
  };

  _renderScene = ({ route }) => {
    var bgColor = this.state.x.interpolate({
      inputRange: [1, 2, 3, 4],
      outputRange: ['rgb(26, 188, 156)', 'rgb(22, 160, 133)', 'rgb(46, 204, 113)', 'rgb(39, 174, 96)']
    });
    switch (route.key) {
      case '1':
      return (
        <ScrollView 
          style={styles.container} 
          decelerationRate={0}
          contentOffset={{x: 0, y: 125}}
          >
          <View style={{width: Dimensions.get('window').width, backgroundColor: '#d8e1e3', marginBottom: 15, zIndex: 999}}>
            <TextInput
              style={{width: '100%', height: 75, padding: 15, marginBottom: 10, color: '#555', fontSize: 16}}
              underlineColorAndroid='transparent'
              placeholder="Create a new match"
              placeholderTextColor="#666"
              onChangeText={(newMatchText) => this.setState({newMatchText})}
              value={this.state.newMatchText}
            />
            <TouchableOpacity style={{
              justifyContent: 'center',
              width: 100,
              height: 30,
              backgroundColor: this.state.newMatchText.length > 0 ? '#555' : '#999',
              borderRadius: 5,
              marginLeft: 'auto',
              marginRight: 15,
              marginBottom: 10
            }} onPress={() => {
              if (this.state.newMatchText.length > 0) {
                //Declare variables
                var matches = this.state.matches;
                var newMatch = {name: this.state.newMatchText, master: this.state.myName, cards: []}

                //Add new card to the start of the array
                matches.unshift(newMatch);

                this.setState({matches: matches});
                this.setState({newMatchText: ''});

                this.syncToFirebase();

                analytics.event(new Event('NewMatch'));
              } else {
                 return;
              }
            }}>
              <Text style={{color: 'white', textAlign: 'center', fontWeight: "bold"}}>Create</Text>
            </TouchableOpacity>
          </View>
          <Text style={{padding: 1.25, textAlign: 'center', fontSize: 14, color: '#888'}}>Pull down to create a new match</Text>
          <ListView
            dataSource={ds.cloneWithRows(this.state.matches)}
            enableEmptySections={true}
            style={[styles.membersList, {minHeight: Dimensions.get('window').height}]}
            renderRow={(rowData) => <Card isMatch={true} matchName={this.state.gameName} cardText={rowData.name} creatorName={rowData.master} bgColor={bgColor} isGameMaster={rowData.master == this.state.myName ? true : false} 
            onVotePress={()=>{
                this.props.navigation.navigate('Match', {matchName: this.state.gameName, gameId: this.state.gameId, myName: this.state.myName, matchId: this.state.matches.indexOf(rowData), matchMaster: rowData.master, returnData: this.returnData.bind(this)});
            }}
            onBingoPress={()=>{
              Alert.alert('Are you sure?', 'You are now deleting the match "'+rowData.name+'". This action is irreversible. Are you sure?', [
                {
                  text: "I'll delete it",
                  onPress: ()=>{ 
                    firebase.database().ref('games/'+this.state.gameId+'/matches/'+this.state.matches.indexOf(rowData)).remove();
                  }
                },
                { text: 'Nah', style: 'cancel' }
              ])
            }}
            />
          }
          />
        </ScrollView>
      );
      case '2':      
      return (
        <ScrollView style={{flex: 1}}>
          <View style={[styles.card, {marginTop: 15}]}>
            <Text style={[styles.heading, {color: '#555', fontSize: 30}]}>{this.state.gameName}</Text>
          </View>
          <View style={styles.card}>
            <Text style={[styles.p]}>Room PIN:</Text>
            <Text style={styles.h2}>{this.state.gameId}</Text>
            <Text style={[styles.p, {fontSize: 15}]}>Others can use this code to join to this room.</Text>
          </View>
          <View style={styles.card}>
            <Text style={[styles.p]}>Room master:</Text>
            <Text style={styles.h2}>{this.state.gameMaster}</Text>
            <Text style={[styles.p, {fontSize: 15}]}>They can give points for the winners in the matches.</Text>
          </View>
          <View style={styles.card}>
            <Text style={[styles.heading, {color: '#555', fontSize: 30}]}>Members</Text>
            <ListView
              dataSource={ds.cloneWithRows(this.state.gameMembers.sort(function(a,b) {return (a.points < b.points) ? 1 : ((b.points < a.points) ? -1 : 0);} ))}
              enableEmptySections={true}
              style={{marginTop: 10}}
              renderRow={(rowData) => 
              <Animated.View style={{flex: 1, paddingHorizontal: 20, height: 40, flexDirection: 'row', justifyContent: 'center', backgroundColor: this.state.myName == rowData.name ? bgColor : 'transparent'}}>
                <Text style={[styles.membersListItem, {color: this.state.myName == rowData.name ? 'white' : '#555', marginTop: 7.5}]}><Text style={[styles.membersListItem, {fontWeight: '700', color: this.state.myName == rowData.name ? 'white' : '#555'}]}>{rowData.name}</Text> | {rowData.points} XP</Text>
                <Animated.View style={{display: this.state.myName != this.state.gameMaster && this.state.myName != rowData.name ? 'none' : 'flex', padding: 5, margin: 5, borderColor: this.state.myName == rowData.name ? 'white' : bgColor, borderWidth: 1.5, borderRadius: 5, alignSelf: 'flex-end', marginRight: 0, marginLeft: 'auto'}}>
                  <TouchableOpacity onPress={()=>{
                    var thus = this;
                    Alert.alert(
                      'Are you sure?', 
                      this.state.myName == rowData.name ? 'Do you *really* want to quit the match '+this.state.gameName+'? You can still rejoin the match later.' : 'Do you *really* want to kick '+rowData.name+'? They can still rejoin the match.',
                      [ 
                        {text: 'Nope', onPress: () => console.log('Cancel'), style: 'cancel'},
                        {text: 'Yes', onPress: () => {
                          //Determine if the player is the match master
                          if(this.state.myName == this.state.gameMaster) {
                            //If match master AND kicking itself
                            if(this.state.myName == rowData.name) {
                              //But you are the match master - quitting will delete the match
                              Alert.alert(
                                'Are you sure?', 
                                'You are the match master. If you quit, the match will be deleted.',
                                [ 
                                  {text: 'Nope', onPress: () => console.log('Cancel'), style: 'cancel'},
                                  {text: 'Yes, I want to delete the match', onPress: () => {
                                    //Delete match
                                    firebase.database().ref('games/' + this.state.gameId).remove();
                                    analytics.event(new Event('Delete game'));
                                    this.props.navigation.state.params.returnData(this.state.gameName);
                                    this.props.navigation.goBack();
                                  }, style: 'destructive'}
                                ],
                              );
                            }
                            else {
                              //Since it's not kicking itself, they can kick the player
                              analytics.event(new Event('Kick'));
                              let members = this.state.gameMembers;
                              members.splice(members.indexOf(rowData));
                              firebase.database().ref('games/' + this.state.gameId).update({
                                'members': members
                              });
                            }
                            
                          }
                          else {
                            if(rowData.name == this.state.myName) {
                              //Quit game
                              analytics.event(new Event('Quit'));
                              let members = this.state.gameMembers;
                              members.splice(members.indexOf(rowData));
                              firebase.database().ref('games/' + this.state.gameId).update({
                                'members': members
                              });
                              this.props.navigation.state.params.returnData(this.state.gameName);
                              this.props.navigation.goBack();
                            } else {
                              //Can't kick others
                              Alert.alert(
                                'Error', 
                                "You aren't the match master. You can't kick other players.",
                                [ 
                                  {text: 'Ok', onPress: () => console.log('Cancel'), style: 'cancel'},
                                ],
                              );
                            }
                          }
                          thus.syncToFirebase();
                        }, style: 'destructive'}
                      ],
                    );
                  }}>
                    <Animated.Text style={{color: this.state.myName == rowData.name ? 'white' : bgColor}}>{this.state.myName == rowData.name ? 'Quit match' : 'Kick player'}</Animated.Text>
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>
              }
            />
          </View>
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
    if(!isMounted) {
      return;
    }
    var value = this.state.value;
    if(value > 4) {
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

let styles = StyleSheet.create({
  container: {
    flex: 1
  },

  heading: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#fff'
  },

  input: {
    color: '#fff',
    padding: 5,
    marginRight: 25,
    height: 45,
    fontSize: 18,
    borderColor: '#fff',
    borderBottomWidth: 2.5
  },

  membersList: {
    paddingTop: 5
  },

  membersListItem: {
    fontSize: 18,
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
  },

  card: {
    width: Dimensions.get('window').width * 0.9,
    marginHorizontal: Dimensions.get('window').width * 0.05,
    marginVertical: 10,
    padding: 15,
    backgroundColor: 'white',
    shadowColor: '#999',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.7
  }
});