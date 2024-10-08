import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Button,
  ScrollView,
} from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import Api from "../api";
import FormPlaceAppPage from "../components/AddNewMarker";

const CustomButton = ({ title, icon, onPress, color }) => (
  <TouchableOpacity
    style={[styles.customButton, { backgroundColor: color }]}
    onPress={onPress}
  >
    <Ionicons name={icon} size={24} color="white" />
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);

const MapPage = ({ navigation }) => {
  const [typeOfMarker, setTypeOfMarker] = useState(null);
  const [markers, setMarker] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [clickedPosition, setClickedPosition] = useState(null);
  const [temporaryMarker, setTemporaryMarker] = useState(null);

  const mapRef = useRef(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setModalVisible(true);
      return;
    }
    let location = await Location.getCurrentPositionAsync({});
    setUserLocation(location.coords);
    centerMapOnLocation(location.coords);
  };

  const centerMapOnLocation = (location) => {
    mapRef.current.animateToRegion(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      },
      1000
    );
  };

  const handleRecenterPress = () => {
    if (userLocation) {
      centerMapOnLocation(userLocation);
    } else {
      setModalVisible(true);
    }
  };

  const handleMapPress = (event) => {
    setClickedPosition(event.nativeEvent.coordinate);
    setShowForm(!showForm);
    setTemporaryMarker(event.nativeEvent.coordinate);
    console.log(clickedPosition);
  };

  const fetchMarkersDataPlacesToClean = async () => {
    setIsLoading(true);
    setTypeOfMarker("place");
    try {
      const response = await Api.get("/garbagesPlaces");
      setMarker(response.data);
    } catch (error) {
      console.log("Error fetching marker info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMarkersDataEvents = async () => {
    setIsLoading(true);
    setTypeOfMarker("event");
    try {
      const response = await Api.get("/events");
      setMarker(response.data);
    } catch (error) {
      console.log("Error fetching marker info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnePage = (markerId) => {
    console.log("markerId", markerId);
    if (typeOfMarker === "place") {
      console.log("Navigating to OnePlacePage with markerId:", markerId);
      navigation.navigate("OnePlacePage", { markerId });
    }
    if (typeOfMarker === "event") {
      console.log("navigating to oneEventPage with markerId", markerId);
      navigation.navigate("OneEventPage", { markerId });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView ref={mapRef} style={styles.map} onPress={handleMapPress}>
          {Array.isArray(markers) && markers.length !== 0
            ? markers.map((marker, index) => {
                return (
                  <Marker
                    key={index}
                    coordinate={{
                      latitude: parseFloat(marker.position.lat),
                      longitude: parseFloat(marker.position.long),
                    }}
                    onCalloutPress={() => handleOnePage(marker._id)}
                  >
                    <Callout tappable tooltip>
                      {/*  style={styles.customCallout} */}
                      <View style={styles.calloutContainer}>
                        <Text style={styles.calloutTitle}>
                          {marker.name || "Unnamed Marker"}
                        </Text>
                        <Text style={styles.calloutDescription}>
                          {marker.description || "No description available"}
                        </Text>
                        <Text style={styles.calloutDescription}>
                          {marker._id || "No description available"}
                        </Text>
                        <Button title="show details" key={index}></Button>
                      </View>
                    </Callout>
                  </Marker>
                );
              })
            : null}

          {userLocation && (
            <Marker
              coordinate={userLocation}
              title="You are here"
              pinColor="blue"
            />
          )}
          {temporaryMarker && showForm && (
            <Marker coordinate={temporaryMarker} pinColor="pink" />
          )}
        </MapView>
        {showForm && (
          <FormPlaceAppPage
            setShowForm={setShowForm}
            showForm={showForm}
            clickedPosition={clickedPosition}
          />
        )}

        {isLoading && <ActivityIndicator size="large" color="#0000ff" />}
      </View>
      <TouchableOpacity
        style={styles.profileButton}
        onPress={() => navigation.navigate("User")}
      >
        <Ionicons name="person-circle-outline" size={30} color="white" />
      </TouchableOpacity>

      <ScrollView horizontal style={styles.buttonScrollView}>
        <CustomButton
          title="Recenter"
          icon="locate-outline"
          onPress={handleRecenterPress}
          color="#50C878"
        />
        <CustomButton
          title="Dirty Places"
          icon="trash-outline"
          onPress={fetchMarkersDataPlacesToClean}
          color="#FF6347"
        />
        <CustomButton
          title="Events"
          icon="calendar-outline"
          onPress={fetchMarkersDataEvents}
          color="#FFD700"
        />
        <CustomButton
          title="Reset"
          icon="refresh-outline"
          onPress={(() => setMarker(null), () => setTypeOfMarker(null))}
          color="#8A2BE2"
        />
      </ScrollView>

      {isLoading && <ActivityIndicator size="large" color="#0000ff" />}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Allow access to your location?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.textStyle}>Deny</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonOpen]}
                onPress={() => {
                  setModalVisible(false);
                  requestLocationPermission();
                }}
              >
                <Text style={styles.textStyle}>Allow</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  buttonScrollView: {
    flexGrow: 0,
    paddingVertical: 10,
    backgroundColor: "#21808D",
  },
  customButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    minWidth: 100,
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 5,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: "#F194FF",
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  calloutContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    width: "100%",
    height: "100%",
  },
  calloutTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
  calloutDescription: {
    fontSize: 14,
    marginBottom: 5,
  },
  calloutImage: {
    width: 150,
    height: 100,
    borderRadius: 5,
  },
  customCallout: {
    width: 200,
    height: 200,
  },
  profileButton: {
    position: "absolute",
    top: 30,
    right: 10,
    backgroundColor: "#4A90E2",
    padding: 10,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  addMarkerButton: {
    position: "absolute",
    top: 60,
    right: 10,
    backgroundColor: "#4A90E2",
    padding: 10,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
});

export default MapPage;
