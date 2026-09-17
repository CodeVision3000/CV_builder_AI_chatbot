import React, { useEffect } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import { AuthProvider, useAuthUser } from "react-auth-kit";
import "./App.css";
import "./resources/manrope.css";
import NavBar from "./routes/NavBar";
import Routing from "./routes/Routing";
import "./Widget.css";
import SupportChat from "./components/SupportChat.tsx";
import AutoLogout from "./components/auth/AutoLogout.tsx";
import analyticsClient from "./utilities/analyticsClient";

// Initialize internal analytics client
analyticsClient.init();

const REFRESH_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const Layout = () => {
  const location = useLocation();
  const getAuth = useAuthUser();
  const auth = getAuth();

  useEffect(() => {
    // Check last refresh time
    const lastRefresh = localStorage.getItem("lastAppRefresh");
    const now = Date.now();

    if (!lastRefresh || now - parseInt(lastRefresh) > REFRESH_INTERVAL) {
      // Store new refresh time
      localStorage.setItem("lastAppRefresh", now.toString());

      // Force refresh the page
      window.location.reload();
    }

    if (auth?.token) {
      console.log("User authenticated");
      analyticsClient.identify(auth.email, {
        email: auth.email
      });
    }
  }, [auth?.token]);

  const isAuthenticated = auth?.token !== undefined;
  return (
    <>
      {isAuthenticated && <AutoLogout />}
     
      <div className="main-content">
        <Routing />
      </div>
      {isAuthenticated && <SupportChat auth={auth} />}{" "}
      {/* Use the ChatBot component */}
    </>
  );
};

const App = () => {
  return (
    <AuthProvider authType={"localstorage"} authName={"sparkaichatbot"}>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
