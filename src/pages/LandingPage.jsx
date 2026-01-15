import React, { useEffect } from "react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const { login, register, isAuthenticated, user, logout, getToken } =
    useKindeAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const token = await getToken();
        console.log("🔥 Kinde Access Token:", token);
      } catch (err) {
        console.error("Failed to get token:", err);
      }
    };

    if (isAuthenticated) {
      fetchToken();
    }
  }, [isAuthenticated, getToken]);

  return (
    <div className="flex flex-col items-center justify-center h-[80vh] text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to RSVP AI 🎉</h1>
      <p className="mb-6 text-gray-600">Manage events and track RSVPs with AI.</p>

      {!isAuthenticated ? (
        <div className="space-x-4">
          <button onClick={() => login()} className="auth-button">
            Login
          </button>
          <button onClick={() => register()} className="auth-button">
            Sign Up
          </button>
        </div>
      ) : (
        <div className="space-x-4">
          <button
            onClick={() => navigate("/createEvent")}
            className="auth-button"
          >
            Create Event
          </button>
          <button onClick={() => logout()} className="auth-button bg-red-500">
            Logout
          </button>
        </div>
      )}

      {isAuthenticated && (
        <p className="mt-4 text-gray-500">
          Logged in as <span className="font-medium">{user?.email}</span>
        </p>
      )}
    </div>
  );
};

export default LandingPage;
