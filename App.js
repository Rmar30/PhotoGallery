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
  Image,
  CameraRoll,
} from 'react-native';

// Import Storage Settings
import { dirPictures } from './dirStorageSetting';

// Camera Import
import { RNCamera } from 'react-native-camera';
// Navigator Import
import { createStackNavigator, createAppContainer } from 'react-navigation';

const moment = require('moment');
const RNFS = require('react-native-fs');



const moveAttachment = async (filePath, newFilepath) => {

  return new Promise((resolve, reject) => {

    RNFS.mkdir(dirPictures)
      .then(() => {
        RNFS.moveFile(filePath, newFilepath)
          .then(() => {
            console.log('FILE MOVED', filePath, newFilepath);
            resolve(true);
          })
          .catch(error => {
            console.log('moveFile error', error);
            reject(error);
          });
      }) 
      .catch(err => {
        console.log('mkdir error', err);
        reject(err);
      });
  });
};

class HomeScreen extends React.Component {

  //Style Home Navigation at Top
  static navigationOptions = {
    title: 'Home',
  };
  
  render() {

    const { navigation } = this.props;
    const dataURI = navigation.getParam('dataURI', 'No data');

    // get a list of files and directories in the main bundle
    RNFS.readDir(dirPictures)
      .then((result) => {
        console.log('GOT RESULT', result);

        // stat the first file
        return Promise.all([RNFS.stat(result[0].path), result[0].path]);
      })
      .then((statResult) => {
        if (statResult[0].isFile()) {
          // if we have a file, read it
          return RNFS.readFile(statResult[1], 'utf8');
        }

        return 'no file';
      })
      .then((contents) => {
        // log the file contents
        console.log(contents);
      })
      .catch((err) => {
        console.log(err.message, err.code);
      });

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
        {/* <Text>{JSON.stringify(dataURI)}</Text>
        <Image
          style={{width: 300, height: 300}}
          source={{uri: dataURI}}
        /> */}
      </View>
    );
  }
}


class CameraScreen extends React.Component {

  static navigationOptions = {
    title: 'Camera',
  };


  saveImage = async filePath => {
    try {
      // set new image name and filepath
      const newImageName = `${moment().format('DDMMYY_HHmmSSS')}.jpg`;
      const newFilepath = `${dirPictures}/${newImageName}`;

      // move and save image to new filepath
      const imageMoved = await moveAttachment(filePath, newFilepath);
      console.log('image moved', imageMoved);
    } catch (error) {
      console.log(error);
    }
  };


  takePicture = async function() {
    if (this.camera) {
      const options = { quality: 0.5, base64: true, fixOrientation: true};
      const data = await this.camera.takePictureAsync(options);
      this.saveImage(data.uri);
      this.props.navigation.navigate('Home');
      // this.props.navigation.navigate('Home', {
      //   dataURI: data.uri
      // });
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
