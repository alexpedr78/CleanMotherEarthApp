// context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Api from "../api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    authenticateUser();
  }, []);

  const storeToken = async (token) => {
    try {
      await AsyncStorage.setItem("token", token);
    } catch (error) {
      console.error("Error storing token:", error);
    }
  };

  const removeToken = async () => {
    try {
      await AsyncStorage.removeItem("token");
    } catch (error) {
      console.error("Error removing token:", error);
    }
  };

  const authenticateUser = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setUser(null);
        setIsLoading(false);
        setIsLoggedIn(false);
        return;
      }
      const response = await Api.get("/auth/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUser(response.data);
      setIsLoggedIn(true);
      setIsLoading(false);
    } catch (error) {
      console.log("Authentication error:", error);
      setUser(null);
      setIsLoggedIn(false);
      setIsLoading(false);
    }
  };
  const login = async (pseudo, password) => {
    try {
      console.log("Attempting login with:", { pseudo, password });
      const response = await Api.post("/auth/login", { pseudo, password });
      console.log("Login response:", response.data);
      const { authToken } = response.data;
      await storeToken(authToken);
      await authenticateUser();
      return true;
    } catch (error) {
      console.error("Login error:", error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Error data:", error.response.data);
        console.error("Error status:", error.response.status);
        console.error("Error headers:", error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error("Error request:", error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error message:", error.message);
      }
      return false;
    }
  };

  const logout = async () => {
    await removeToken();
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        storeToken,
        removeToken,
        authenticateUser,
        isLoggedIn,
        isLoading,
        logout,
        login,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};