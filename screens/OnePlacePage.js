import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import Api from "../api";
import AddAnEvent from "../components/AddAnEventButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TouchableOpacity } from "react-native-gesture-handler";

const OnePlacePage = ({ navigation }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [placeDetails, setPlaceDetails] = useState(null);
  const [isThereEvents, setIsThereEvents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState("");
  const route = useRoute();
  const { markerId } = route.params;

  useEffect(() => {
    fetchPlaceDetails();
    fetchUserId();
  }, [refreshKey]);

  const fetchUserId = async () => {
    try {
      const userId = await AsyncStorage.getItem("currentUser");
      if (userId) {
        setCurrentUser(userId);
      }
    } catch (error) {
      console.error("Error fetching user ID:", error);
    }
  };

  const fetchPlaceDetails = async () => {
    try {
      const response = await Api.get(`/garbagesPlaces/${markerId}`);
      setPlaceDetails(response.data);
      console.log("datafromtheplace:", response.data);
      const response2 = await Api.get(`/events/place/${markerId}`);
      console.log("event:", response2.data);

      setIsThereEvents(response2.data);
    } catch (error) {
      console.error("Error fetching place details:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatEventTime = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  if (!placeDetails) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDetailsText}>
          No details available for this place.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.eventBox}>
        <Text style={styles.title}>{placeDetails.name}</Text>
        {placeDetails.photo && (
          <Image source={{ uri: placeDetails.photo }} style={styles.image} />
        )}
        <Text style={styles.description}>{placeDetails.description}</Text>
        <Text style={styles.address}>Address: {placeDetails.address}</Text>
      </View>
      <Text style={styles.eventText}>
        Event about this place:{" "}
        {isThereEvents.length > 0 ? "" : "No events found"}
      </Text>
      {isThereEvents.map((event, index) => (
        <TouchableOpacity
          key={index}
          style={styles.eventBox}
          onPress={() =>
            navigation.navigate("OneEventPage", { markerId: event._id })
          }
        >
          <Text style={styles.eventName}>{event.name}</Text>
          <Text style={styles.eventPosition}>{event.position.long}</Text>
          <Text style={styles.eventDescription}>{event.description}</Text>
          <Text style>{formatEventTime(event.timeStart)}</Text>
        </TouchableOpacity>
      ))}
      <AddAnEvent
        setRefreshKey={setRefreshKey}
        markerId={markerId}
        placeInfos={placeDetails}
        currentUser={currentUser}
      ></AddAnEvent>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f3f4f6",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  image: {
    width: "100%",
    height: 250,
    resizeMode: "cover",
    marginBottom: 15,
    borderRadius: 15,
  },
  description: {
    fontSize: 18,
    color: "#555",
    marginBottom: 10,
  },
  address: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },
  eventText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4A90E2",
  },
  noDetailsText: {
    fontSize: 18,
    color: "#999",
    textAlign: "center",
  },
  eventBox: {
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  eventName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  eventPosition: {
    fontSize: 16,
    color: "#666",
  },
  eventDescription: {
    fontSize: 14,
    color: "#777",
  },
});

export default OnePlacePage;
