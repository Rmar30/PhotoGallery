/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import React, {Component} from 'react';
import {
  Platform, 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity,
  Button,
  Image
} from 'react-native';

// Camera Import
import { RNCamera } from 'react-native-camera';
// Navigator Import
import { createStackNavigator, createAppContainer } from 'react-navigation';


class HomeScreen extends React.Component {


  //Style Home Navigation at Top
  static navigationOptions = {
    title: 'Home',
  };
  

  render() {

    const { navigation } = this.props;
    const dataURI = navigation.getParam('dataURI', 'No data');

    return (
      <View style={styles.container}>
        <Text style={styles.title}>PHOTO GALLERY</Text>
        <Button
            title="Open Camera"
            onPress={() => {
              /* 1. Navigate to the Camera route */
              this.props.navigation.navigate('Camera');
            }}
          />
        <Text>{JSON.stringify(dataURI)}</Text>
        <Image
          style={{width: 300, height: 300}}
          source={{uri: dataURI}}
        />

      </View>
    );
  }
}


class CameraScreen extends React.Component {

  static navigationOptions = {
    title: 'Camera',
  };

  takePicture = async function() {
    if (this.camera) {
      const options = { quality: 0.5, base64: true, fixOrientation: true};
      const data = await this.camera.takePictureAsync(options);
      console.log(data.uri);
      this.props.navigation.navigate('Home', {
        dataURI: data.uri
      });
    }
  };

  render() {
    return (
      <View style={styles.camera_container}>
        <RNCamera
          ref={ref => {
            this.camera = ref;
          }}
          style={styles.preview}
          type={RNCamera.Constants.Type.back}
          flashMode={RNCamera.Constants.FlashMode.on}
          permissionDialogTitle={"Permission to use camera"}
          permissionDialogMessage={
            "We need your permission to use your camera phone"
          }
          onGoogleVisionBarcodesDetected={({ barcodes }) => {
            console.log(barcodes);
          }}
        />
        <View
          style={{ flex: 0, flexDirection: "row", justifyContent: "center" }}
        >
          <TouchableOpacity
            onPress={this.takePicture.bind(this)}
            style={styles.capture}
          >
            <Text style={{ fontSize: 14 }}> SNAP </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

// DEFINING STACK
const RootStack = createStackNavigator(
  {
    Home: HomeScreen,
    Camera: CameraScreen,
  },
  {
    initialRouteName: 'Home',
    
    /* Shared Navigation Configurations */
    defaultNavigationOptions: {
      headerStyle: {
        backgroundColor: '#003366',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    },
  }
);


const AppContainer = createAppContainer(RootStack);

export default class App extends React.Component {
  render() {
    return <AppContainer />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  title: {
    fontSize: 40,
    textAlign: 'center',
    margin: 10,
  },
  camera_container: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: "black"
  },
  preview: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center"
  },
  capture: {
    flex: 0,
    backgroundColor: "#fff",
    borderRadius: 5,
    padding: 15,
    paddingHorizontal: 20,
    alignSelf: "center",
    margin: 20
  },
  
});
