/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import React from 'react';
import {
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity,
  Button,
  Image,
  TextInput,
  Alert,
} from 'react-native';

// Import Storage Settings
import { dirPictures } from './dirStorageSetting';

// Custom Components

// Import Persistance Storage
import realm from './realm';


// Image Grid Layout Component
import PhotoGrid from 'react-native-image-grid';

// Camera Import
import { RNCamera } from 'react-native-camera';

// Navigator Import
import { createStackNavigator, createAppContainer } from 'react-navigation';


const moment = require('moment');
const RNFS = require('react-native-fs');
const uuidv1 = require('uuid/v1');


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

  static navigationOptions = {
    title: 'Home',
  };

  constructor() {
    super();
    this.state = { items: [] };
  }
 
  componentDidMount() {

    let photos = realm.objects('Photo');

    let items = Array.apply(null, photos).map((v, i) => {

      // Modify Path to Support Src Uri
      return {
        id: v.id,
        name: v.name,
        src: 'file://' + v.path,
        date: v.date,
        location: v.location,
        comment: v.comment,
      };
    });
    this.setState({ items }); 


    // // get a list of files and directories in the main bundle
    // RNFS.readDir(dirPictures)
    // .then((result) => {
    //   console.log('RESULT', result);

    //   let photos = realm.objects('Photo');

    //   let items = Array.apply(null, result).map((v, i) => {
        
    //     // Modify Path to Support Src Uri
    //     return { id: i, photoName: v.name, src: 'file://' + v.path};
    //   });
    //   this.setState({ items });      
    // })
    // .catch((err) => {
    //   console.log(err.message, err.code);
    // });
  }


  renderItem(item, itemSize, itemPaddingHorizontal) {
    
    //Single item of Grid
    return (
      <TouchableOpacity
        key={item.id}
        style={{
          width: itemSize,
          height: itemSize,
          paddingHorizontal: itemPaddingHorizontal,
        }}
        onPress={() => {
          /* 1. Navigate to the Image View route */
          this.props.navigation.navigate('ImageView', {
            photoID: item.id,
            photoName: item.name,
            photoPath: item.src,
            photoDate: item.date,
            photoLocation: item.location,
            photoComment: item.comment,
          });
        }}>
        <Image
          resizeMode="cover"
          style={{ flex: 1 }}
          source={{ uri: item.src }}
        />
      </TouchableOpacity>
    );
  }
  
  render() {
    
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
        <View style={styles.gridStyle}>
        <PhotoGrid
          data={this.state.items}
          itemsPerRow={3}
          //You can decide the item per row
          itemMargin={1}
          itemPaddingHorizontal={1}
          renderItem={this.renderItem.bind(this)}
        />
        </View>
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

      realm.write(() => {
        realm.create(
          'Photo',
          {
            id: uuidv1(),
            name: newImageName,
            path: newFilepath,
            date: new Date(),
          }
        )
      });

      console.log('Image Moved', imageMoved);
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




class ImageView extends React.Component {
  
  deletePhoto(key,path) {

    let photo = realm.objectForPrimaryKey('Photo',key)

    realm.write(() => {
      realm.delete(photo);
    })
    
    RNFS.unlink(path)
    .then(() => {
      console.log('FILE DELETED');
    })
    // `unlink` will throw an error, if the item to unlink does not exist
    .catch((err) => {
      console.log(err.message);
    });

  }

  static navigationOptions = {
    title: 'Image View',
  };

  render() {


    const { navigation } = this.props;
    const photoID = navigation.getParam('photoID', '');
    const photoPath = navigation.getParam('photoPath', '');
    const photoName = navigation.getParam('photoName', '');
    const photoDate = navigation.getParam('photoDate', '');
    const photoLocation = navigation.getParam('photoLocation', 'Default Photo Location');
    const photoComment = navigation.getParam('photoComment', '');

    console.log("VIEW COMMENT" + photoComment);



    return (
    <View>
      <View style={styles.singleImageTitleBar}>
        <Text style={styles.singleImageTitle}>{photoName}</Text>
        <View style={styles.singleImageButtonControl}>
          <Button
            title="EDIT"
            onPress={() => {
              /* 1. Navigate to the Edit Image route */
              this.props.navigation.navigate('EditImage', {
                photoID: photoID,
                photoName: photoName,
                photoPath: photoPath,
                photoLocation: photoLocation,
                photoComment: photoComment,
              });
            }}
          />
        </View>
        <View style={styles.singleImageButtonControl}>
          <Button
            title="DELETE"
            color="#8b0000"
            onPress={() => {
              
              Alert.alert(
                'Delete Image',
                'Are you sure you want to Delete this Image',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      this.deletePhoto(photoID,photoPath)
                      this.props.navigation.navigate('Home');
                    }
                  },
                  {
                    text: 'Cancel',
                    onPress: () => console.log('Cancel Pressed'),
                    style: 'cancel',
                  },
                ],
                {cancelable: false},
              );
            }}
          />
        </View>
      </View>
      <View style={styles.singleImageContainer}>
        <Image
          style={styles.singleImage}
          source={{ uri: photoPath }}
        />
      </View>

      <View style={styles.singleImageContent}>
        <Text style = {styles.fieldDisplay}>DATE: {photoDate.toLocaleDateString()}</Text>
        <TouchableOpacity
          onPress={() => {
            /* 1. Navigate to the Camera route */
            this.props.navigation.navigate('ImageMapView',{
              photoLocation: photoLocation,
            });
          }}
        >
          <Text style = {styles.fieldDisplay}>LOCATION: {photoLocation}</Text>
        </TouchableOpacity>
        
        <View style = {styles.fieldDisplay}>
          <Text>COMMENTS:</Text>
          <View style={{
            borderColor: '#000000',
            marginTop: 10,
            borderWidth: 1 }}
          >
            <TextInput
              editable = {false}
              multiline = {true}
              numberOfLines = {4}
              style = {
                {
                  textAlignVertical: "top",
                  color : "gray"
                }
              }
              value = {photoComment}
            />
          </View>
        </View>
      </View>
    </View>

    )
  }
}

class ImageMapView extends React.Component {
  
  static navigationOptions = {
    title: 'Image Map View',
  };


  render() {

    const { navigation } = this.props;
    const photoLocation = navigation.getParam('photoLocation', 'Default Photo Location');



    return (
    <View>
      <Text>Hello this is ImageMap View</Text>
    </View>
    )
  }
}

class EditImage extends React.Component {
  
  static navigationOptions = {
    title: 'Edit Image',
  };

  constructor(props) {
    super(props);
    this.state = {
      name:'',
      location:'',
      comment:'',
    };
  }

  componentDidMount() 
  {
    const { navigation } = this.props;
    const photoName = navigation.getParam('photoName', '');
    const photoLocation = navigation.getParam('photoLocation', 'Default Photo Location');
    const photoComment = navigation.getParam('photoComment', '');
    this.setState({
      name: photoName,
      location: photoLocation,
      comment: photoComment
    });
  }


  render() {

    const { navigation } = this.props;
    const photoID = navigation.getParam('photoID', '');
    const photoPath = navigation.getParam('photoPath', '');
    const photoName = navigation.getParam('photoName', '');
    const photoLocation = navigation.getParam('photoLocation', 'Default Photo Location');
    const photoComment = navigation.getParam('photoComment', '');

    console.log("EDIT" + photoComment);

    return (
    <View>
      {/* <View style={styles.singleImageContainer}>
        <Image
          style={styles.singleImage}
          source={{ uri: photoPath }}
        />
      </View> */}
      <View style={styles.singleImageContent}>
        <View style = {styles.fieldDisplay}>
          <Text>NAME:</Text>
          <View style={{
            borderColor: '#000000',
            marginTop: 10,
            borderWidth: 1 }}
          >
          <TextInput
            editable = {true}
            multiline = {true}
            numberOfLines = {2}
            style = {
              {
                textAlignVertical: "top",
                color : "gray"
              }
            }
            onChangeText={(name) => this.setState({name})}
            value = {this.state.name}
          />
          </View>
          <View style = {styles.fieldDisplay}>
            <Text>LOCATION:</Text>
            <View style={{
              borderColor: '#000000',
              marginTop: 10,
              borderWidth: 1 }}
            >
              <TextInput
                editable = {true}
                multiline = {true}
                numberOfLines = {2}
                style = {
                  {
                    textAlignVertical: "top",
                    color : "gray"
                  }
                }
                onChangeText={(location) => this.setState({location})}
                value = {this.state.location}
              />
            </View>
          </View>
          <View style = {styles.fieldDisplay}>
            <Text>COMMENTS:</Text>
            <View style={{
              borderColor: '#000000',
              marginTop: 10,
              borderWidth: 1 }}
            >
              <TextInput
                editable = {true}
                multiline = {true}
                numberOfLines = {4}
                style = {
                  {
                    textAlignVertical: "top",
                    color : "gray"
                  }
                }
                onChangeText={(comment) => this.setState({comment})}
                value = {this.state.comment}
              />
            </View>
          </View>
          <Button
            title="Save"
            style = {styles.fieldDisplay}
            onPress={() => {
              /* 1. Navigate to the Camera route */
              realm.write(() => {
                // Update book with new price keyed off the id
                realm.create('Photo', {
                  id: photoID,
                  name: this.state.name,
                  location: this.state.location,
                  comment: this.state.comment,
                }, true);
              });

              this.props.navigation.navigate('Home');
            }}
          />
        </View>
      </View>
    </View>
    )
  }
}

// DEFINING STACK
const RootStack = createStackNavigator(
  {
    Home: HomeScreen,
    Camera: CameraScreen,
    ImageView: ImageView,
    ImageMapView: ImageMapView,
    EditImage: EditImage,
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
    padding: 8,
    paddingHorizontal: 20,
    alignSelf: "center",
    margin: 20
  },
  gridStyle: {
    justifyContent: 'center',
    flex: 1,
    marginTop: 20,
  },



  // IMAGE VIEW STYLES
  singleImageTitleBar: {
    flexWrap: 'wrap', 
    alignItems: 'flex-start',
    flexDirection:'row',
    marginHorizontal: 35,
    marginTop: 20,

  },
  singleImageButtonControl: {
    width: '20%',
    marginHorizontal: 3,
  },
  singleImage: {
    justifyContent: 'center',
    width: 300,
    height: 300,
    marginTop: 20,
  },
  singleImageContainer: {
    alignItems: 'center',
  },
  singleImageTitle: {
    fontSize: 20,
    flex:1,
  },
  singleImageContent: {
    textAlign: 'left',
    marginHorizontal: 40,
    marginTop: 12,
  },
  fieldDisplay: {
    marginVertical: 8,
  },
  locationBar: {
    flexDirection:'row',
    flexWrap: 'wrap', 
    alignItems: 'flex-start',
  },

});
