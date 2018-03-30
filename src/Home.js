import React from 'react';
import { StyleSheet, Text, View, TextInput, StatusBar, TouchableOpacity, Animated, ScrollView, ListView, Modal, Alert, AsyncStorage, Image, Dimensions, Linking } from 'react-native';
import { StackNavigator } from 'react-navigation';
import * as firebase from 'firebase';
import InputScrollView from 'react-native-input-scroll-view';
import md5 from 'md5';
import { Analytics, PageHit, Event } from 'expo-analytics';
import Link from './Components/Link.js';

let Environment = require('./environment.js')

let config = {
  apiKey: Environment.apiKey,
  authDomain: Environment.authDomain,
  databaseURL: Environment.databaseURL,
  projectId: Environment.projectId,
  storageBucket: Environment.storageBucket,
  messagingSenderId: Environment.messagingSenderId
};

let analytics = new Analytics(Environment.analytics);

let ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});

console.disableYellowBox = true

export default class Home extends React.Component {
    state = {
      x: new Animated.Value(0),
      games: [],
      value: 0,
      
      //Data for the new match
      newGameModalVisible: false,
      newGameName: '',
      newGameID: Math.floor(Math.random() * 899999 + 100000).toString(),
      pw: '',
      pwAgain: '',

      //Data for joining game
      joinGameModalVisible: false,
      joinGameName: '',
      joingameId: '',
      joinMaster: '',
      matchPw: '',

      myName: '',

      infoModalVisible: false
  };

  returnData(id) {
    console.log('returndata');
    console.log(id);
    this.deleteGame(id);
  }

  async componentDidMount() {
    //Starts the first loop in color changing
    this.changeColor();

    //Initialize Firebase
    firebase.initializeApp(config);

    this.loadGames();

    analytics.hit(new PageHit('Home'));

    //Save the games with 2s delay
    setTimeout(() => {
      this.saveGames();
    }, 2000);
  }

  //Save data to the AsyncStorage
  async saveGames() {
    //Save games to AsyncStorage
    try {
      await AsyncStorage.setItem('@MySuperStore:games', JSON.stringify(this.state.games));
    } catch (error) {
      // Error saving data
      console.log(error);
    }

    //Save name to AsyncStorage
    try {
      await AsyncStorage.setItem('@MySuperStore:name', this.state.myName);
    } catch (error) {
      // Error saving data
      console.log(error);
    }
  }

  //Load data from the AsyncStorage
  async loadGames() {
    //Get games from AsyncStorage
    try {
      let value = await AsyncStorage.getItem('@MySuperStore:games');
      if (value !== null){
        // We have data
        var array = JSON.parse(value);
        var thus = this;

        array.forEach(async(element) => {
          //Remove the " from the start and end of the string
          if(element.name[0] == '"') {
            element.name = element.name.slice(1, -1);
          }
          
          //Check if match still exists
          firebase.database().ref('games/' + element.id+'/members/')
          .once('value')
          .then((snap) => {
            if(snap.val()) {
              var members = Object.values(snap.val());
              var count = 0;

              members.forEach(element => {
                if(element.name == this.state.myName) {
                  count += 1;
                }
              });
            }
            else {
              this.deleteGame(element.name);
            }

            //If member even exists
            if(members) {
              //If match doesn't exist or player is kicked
              if(members.length < 0 || count <= 0) {
                this.deleteGame(element.name);
              } else {

              }
            } else {
              this.deleteGame(element.name);
            }
          })
        });
        this.setState({games: array});
      }
    } catch (error) {
      // Error retrieving data
      console.log(error);
    }

    //Get name from AsyncStorage
    try {
      let value = await AsyncStorage.getItem('@MySuperStore:name');
      if (value !== null){
        // We have data
        this.setState({myName: value});
      }
    } catch (error) {
      // Error retrieving data
      console.log(error);
    }
  }

  componentWillReceiveProps() {
    console.log('componentWillReceiveProps');
    this.deleteGame(this.props.delete);
  }

  //Delete a game from the 'Current matches' list
  deleteGame(name) {
    var games = this.state.games;
    games.splice(games.indexOf(name), 1);
    this.setState({games: games});
    this.saveGames();
  }

  render() {
    if(this.props.navigation.state.params) {
      console.log(this.props.navigation.state.params.delete)
    }
    var bgColor = this.state.x.interpolate({
      inputRange: [1, 2, 3, 4],
      outputRange: ['rgb(26, 188, 156)', 'rgb(22, 160, 133)', 'rgb(46, 204, 113)', 'rgb(39, 174, 96)']
    });

    return (
      <Animated.View style={[styles.container, {backgroundColor: bgColor}]}>
        <StatusBar
          barStyle="light-content"
        />
        <Modal
          animationType="slide"
          transparent={false}
          visible={this.state.newGameModalVisible}>
          <View style={{flex: 1}}>
            <ScrollView style={{flex: 1}}>
              <Animated.View style={{padding: 20, backgroundColor: bgColor}}>
                  <Text style={[styles.heading, {fontSize: 32}]}>Create a new Bullshit Bingo match</Text>
              </Animated.View>
              <View style={{flexDirection: 'column', padding: 20, paddingBottom: 10}}>
                <Text style={styles.p}>The name of the match (public)</Text>
                <TextInput
                  style={[styles.input, {color: '#666', borderColor: '#666', marginTop: 5, marginBottom: 20}]}
                  underlineColorAndroid='transparent'
                  onChangeText={(newGameName) => this.setState({newGameName})}
                  value={this.state.newGameName}
                />
                <Text style={[styles.p, {marginTop: 10}]}>Your in-match name (public)</Text>
                <TextInput
                  style={[styles.input, {color: '#666', borderColor: '#666', marginTop: 5, marginBottom: 20}]}
                  underlineColorAndroid='transparent'
                  onChangeText={(myName) => this.setState({myName})}
                  value={this.state.myName}
                />
                <Text style={[styles.p, {marginTop: 10}]}>Password lock (for you only)</Text>
                <TextInput
                  style={[styles.input, {color: '#666', borderColor: '#666', marginTop: 5, marginBottom: 20}]}
                  underlineColorAndroid='transparent'
                  secureTextEntry={true}
                  placeholder="Password"
                  placeholderTextColor="#aaa"
                  onChangeText={(pw) => this.setState({pw})}
                  value={this.state.pw}
                />
                <TextInput
                  style={[styles.input, {color: '#666', borderColor: '#666', marginTop: 5, marginBottom: 20}]}
                  underlineColorAndroid='transparent'
                  secureTextEntry={true}
                  placeholder="Password again"
                  placeholderTextColor="#aaa"
                  onChangeText={(pwAgain) => this.setState({pwAgain})}
                  value={this.state.pwAgain}
                />
              </View>
              <View style={{flexDirection: 'column', paddingHorizontal: 20}}>
                <Text style={styles.p}>Match PIN:</Text>
                <Text style={styles.h2}>{this.state.newGameID}</Text>
              </View>
              <View style={{flexDirection: 'row', height: 45, marginHorizontal: 20, marginTop: 10, marginBottom: 20}}>
                <Animated.View style={[styles.button, {flex: 1, backgroundColor: bgColor, marginRight: 25}]}>
                  <TouchableOpacity style={[styles.button, {flex: 1, backgroundColor: 'transparent'}]} onPress={()=>{

                    //Check the password
                    if(this.state.pw != this.state.pwAgain) {
                      Alert.alert('Error', "The passwords don't match.");
                      return;
                    }
                    
                    //Upload the game itself to Firebase
                    firebase.database().ref('games/'+this.state.newGameID).set({
                      name: this.state.newGameName,
                      master: this.state.myName,
                      masterPw: md5(this.state.pw)
                    });

                    //Upload the user to Firebase
                    firebase.database().ref('games/'+this.state.newGameID+'/members/'+this.state.myName).set({
                      'name': this.state.myName,
                      'points': 0
                    });

                    //Add the new game to the Games array (renderen in 'Current matches' section)
                    var games = this.state.games;
                    games.push({id: this.state.newGameID, name: this.state.newGameName});
                    this.setState({games: games, newGameModalVisible: false});

                    //Navigate to the new game's screen
                    this.props.navigation.navigate('Game', {gameName: this.state.newGameName, gameId: this.state.newGameID, myName: this.state.myName, returnData: this.returnData.bind(this)})

                    //Save the new game to AsyncStorage
                    this.saveGames();

                    //Create new game ID for the next game, empty the screen
                    this.setState({pw: '', pwAgain: '', newGameName: '', newGameID: Math.floor(Math.random() * 899999 + 100000).toString()});

                    analytics.event(new Event('CreateMatch'));
                    }}>
                    <Text style={[styles.join, {color: 'white'}]}>Create match</Text>
                  </TouchableOpacity>
                </Animated.View>
                <Animated.View style={[styles.button, {flex: 1, backgroundColor: bgColor}]}>
                  <TouchableOpacity style={[styles.button, {flex: 1, backgroundColor: 'transparent'}]} onPress={()=>{this.setState({newGameModalVisible: false})}}>
                    <Text style={[styles.join, {color: 'white'}]}>Cancel</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </ScrollView>
            
          </View>
        </Modal>
        <Modal
          animationType="slide"
          transparent={false}
          visible={this.state.joinGameModalVisible}>
          <View style={{flex: 1}}>
            <Animated.View style={{padding: 20, backgroundColor: bgColor}}>
                <Text style={[styles.heading, {fontSize: 32}]}>Join "{this.state.joinGameName}"?</Text>
            </Animated.View>
            <View style={{flex: 1, padding: 20}}>
              <View style={{flexDirection: 'column'}}>
                <Text style={[styles.p, {marginTop: 10}]}>Your in-match name (public)</Text>
                <TextInput
                  style={[styles.input, {color: '#666', borderColor: '#666', marginTop: 5, marginBottom: 20}]}
                  underlineColorAndroid='transparent'
                  onChangeText={(myName) => this.setState({myName})}
                  value={this.state.myName}
                />
                <TextInput
                  style={[styles.input, {color: '#666', borderColor: '#666', marginTop: 5, marginBottom: 20, display: this.state.myName == this.state.joinMaster ? 'flex' : 'none'}]}
                  secureTextEntry={true}
                  placeholder="Match master password"
                  placeholderTextColor="#aaa"
                  underlineColorAndroid='transparent'
                  onChangeText={(joinPw) => this.setState({joinPw})}
                  value={this.state.joinPw}
                />
              </View>
              <View style={{flexDirection: 'row', height: 45, marginTop: 20}}>
                <Animated.View style={[styles.button, {flex: 1, backgroundColor: bgColor, marginRight: 25}]}>
                  <TouchableOpacity style={[styles.button, {flex: 1, backgroundColor: 'transparent'}]} onPress={async()=>{
                    //Chceck the password
                    if(this.state.myName == this.state.joinMaster && this.state.matchPw != md5(this.state.joinPw)) {
                      Alert.alert('Error', 'The password is incorrect.');
                      return;
                    }

                    //Add the user to Firebase
                    firebase.database().ref('games/'+this.state.joingameId+'/members/'+this.state.myName).set({
                      'name': this.state.myName,
                      'points': 0
                    });

                    //Add the new game to the games array (rendered in the 'Current matches' section in Home.js)
                    var games = this.state.games;
                    games.push({name: this.state.joinGameName, id: this.state.joingameId});
                    this.setState({joinGameModalVisible: false, games: games, joingameId: ''});

                    //Navigate to the game
                    this.props.navigation.navigate('Game', {gameName: this.state.joinGameName, gameId: this.state.joingameId, myName: this.state.myName, returnData: this.returnData.bind(this)});

                    //Save to AsyncStorage
                    this.saveGames();

                    analytics.event(new Event('JoinMatch'));
                  }}>
                    <Text style={[styles.join, {color: 'white'}]}>Join match</Text>
                  </TouchableOpacity>
                </Animated.View>
                <Animated.View style={[styles.button, {flex: 1, backgroundColor: bgColor}]}>
                  <TouchableOpacity style={[styles.button, {flex: 1, backgroundColor: 'transparent'}]} onPress={()=>{this.setState({joinGameModalVisible: false})}}>
                    <Text style={[styles.join, {color: 'white'}]}>Cancel</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>
          </View>
        </Modal>
        <Modal
          animationType="slide"
          transparent={false}
          visible={this.state.infoModalVisible}>
          <ScrollView style={{flex: 1, backgroundColor: '#eee', padding: 20}}>
            <Text style={[styles.welcome, {color: '#555', marginVertical: 20}]}>Bullshit Bingo</Text>
            <Text style={{color: '#555', fontSize: 16}}>
              Imagine the endless possibilities of creating a bingo game about anything. Who's going to marry next, what's the next thing that's going to broke in the office, which character is going to be gay in the next season of your favorite Netflix show, etc.{"\n"}{"\n"}
              Well, that's what Bullshit Bingo is about.{"\n"}
              Create a match, share it with your friends, and play together freely.
            </Text>
            <Text style={[styles.heading, {color: '#555', marginTop: 15}]}>Rules</Text>
            <Text style={{color: '#555', fontSize: 16}}>
              • You can only vote on 2 games{"\n"}
              • Only the match master can delete cards and give points (via 'Bingo!' button){"\n"}
              • The match master can kick anyone{"\n"}
              • Both the kicked players and the quitters can rejoin every match{"\n"}
              • Once the match master exits, the game is going to be deleted, permanently.{"\n"}
              • Have fun! ;)
            </Text>
            <Text style={[styles.heading, {color: '#555', marginTop: 15}]}>Creator</Text>
            <Text style={{color: '#555', fontSize: 16, fontWeight: 'bold'}}>This project is fully open-source.</Text>
            <Link text="Bullshit Bingo on GitHub" url="https://github.com/dandesz198/bullshitbingo" />
            <Text style={{color: '#555', fontSize: 16, marginTop: 16}}>
              Daniel Gergely{"\n"}
                • <Link text="GitHub" url="https://github.com/dandesz198" />{"\n"}
                • <Link text="Facebook" url="https://fb.me/dandesz198" />{"\n"}
                • <Link text="Twitter" url="https://twitter.com/dandesz198" />{"\n"}
                • <Link text="LinkedIn" url="https://linkedin.com/in/dandesz198" />
            </Text>
            <Text style={[styles.heading, {color: '#555', marginTop: 10}]}>Contributor</Text>
            <Text style={{color: '#555', fontSize: 16}}>
              Péter Hajdu{"\n"}
                • <Link text="GitHub" url="https://github.com/razor97" />{"\n"}
                • <Link text="Facebook" url="https://fb.me/hajdupetke" />{"\n"}
                • <Link text="Twitter" url="https://twitter.com/hajdupetke" />{"\n"}
            </Text>
            <TouchableOpacity style={{marginLeft: 'auto', marginRight: 'auto'}} onPress={()=>{Linking.openURL('https://paypal.me/dandesz198')}}>
              <Image source={require('./coffee.png')} resizeMode="cover" style={{height: 45, width: 225}}/>
            </TouchableOpacity>
            <Text style={[styles.p, {fontSize: 15, textAlign: 'center', marginTop: 5}]}>Since the server isn't free, every single cent of your donation is going to be spent on the costs of running this game.</Text>
            <Animated.View style={{flex: 1, backgroundColor: bgColor, marginTop: 20, marginBottom: 40, height: 50}}>
              <TouchableOpacity style={[styles.button, {flex: 1, shadowColor: 'transparent', backgroundColor: 'transparent'}]} onPress={()=>{this.setState({infoModalVisible: false})}}>
                <Text style={[styles.join, {backgroundColor: 'transparent', color: 'white'}]}>Close</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </Modal>
        <View style={{marginTop: 20, flexDirection: 'row', width: Dimensions.get('window').width}}>
          <Text style={styles.welcome}>Bullshit Bingo</Text>
          <TouchableOpacity style={{marginRight: 40, marginLeft: 'auto', alignItems: 'center'}} onPress={() => {this.setState({infoModalVisible: true})}}>
              <Image source={require('./info.png')} style={{height: 25, width: 25, marginTop: 'auto', marginBottom: 'auto'}} />
          </TouchableOpacity>
        </View>
        <ScrollView style={{flex: 1}}>
          <TouchableOpacity style={[styles.button, {marginTop: 20, height: 45}]} onPress={()=>{this.setState({newGameModalVisible: true})}}>
            <Animated.Text style={[styles.join, {color: bgColor}]}>Create new match</Animated.Text>
          </TouchableOpacity>
          <Text style={styles.heading}>Join match</Text>
          <View style={{flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center'}}>
            <TextInput
              style={[styles.input, {flex: 1}]}
              placeholder="Match PIN"
              placeholderTextColor="#ecf0f1"
              keyboardType="number-pad"
              underlineColorAndroid='transparent'
              onChangeText={(joingameId) => this.setState({joingameId})}
              value={this.state.joingameId}
            />
            <TouchableOpacity onPress={()=>{
              var thus = this;

              //Get the name and the master's name of the new match
              firebase.database().ref('games/' + this.state.joingameId).once('value', function(snap) {
                var newGameName = JSON.stringify(snap.val().name);
                var masterName = JSON.stringify(snap.val().master);
                var masterPw = JSON.stringify(snap.val().masterPw);

                //Check if the game exists
                if(newGameName.length > 1 && newGameName != "null") {
                  //Remove "
                  newGameName = newGameName.slice(1, -1);
                  masterName = masterName.slice(1, -1);
                  masterPw = masterPw.slice(1, -1);

                  //Open the connection modal
                  thus.setState({joinGameName: newGameName, joinMaster: masterName, matchPw: masterPw, joinGameModalVisible: true});
                } else {
                  Alert.alert("Error", "Something bad happened (maybe). Please check the game PIN and/or try again later.")
                }
              });
              }} style={[styles.button, {flex: 1}]}>
              <Animated.Text style={[styles.join, {color: bgColor}]}>Join</Animated.Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.heading}>Current matches</Text>
          <ListView
            dataSource={ds.cloneWithRows(this.state.games)}
            enableEmptySections={true}
            renderRow={(rowData) => 
              <TouchableOpacity style={{borderColor: '#ecf0f1', borderBottomWidth: .5, padding: 2.5}} onPress={()=>{this.props.navigation.navigate('Game', {gameName: rowData.name, gameId: rowData.id, myName: this.state.myName})}}>
                <Text style={styles.gameList}>{rowData.name}</Text>
              </TouchableOpacity>
            }
          />
        </ScrollView>
      </Animated.View>
    );
  }

  //Animate to the next color
  changeColor() {
    //Get the number of the next color
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
    flex: 1,
    padding: 20,
    justifyContent: 'center'
  },

  welcome: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ecf0f1'
  },

  heading: {
    fontSize: 30,
    marginTop: 35,
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

  join: {
    fontSize: 20,
    textAlign: 'center'
  },

  gameList: {
    color: 'white',
    fontWeight: '300',
    fontSize: 20,
    marginVertical: 5
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