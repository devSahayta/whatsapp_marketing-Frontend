// pages/ChatPage.jsx
"use client";

import React, { useState, useEffect } from "react";
import ChatList from "../components/ChatList";
import ChatWindow from "../components/ChatWindow";
import "../styles/chat.css";
import useAuthUser from "../hooks/useAuthUser";

export default function ChatPage() {
  const { userId } = useAuthUser();
  const [activeChat, setActiveChat] = useState(null);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [chatMode, setChatMode] = useState("AI");
  const [isMobile, setIsMobile] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleSelect = (chatId, userData) => {
    setActiveChat(chatId);
    setActiveChatUser(userData);
    setChatMode((userData?.mode || "AI").toUpperCase().trim());
    if (isMobile) setShowChat(true);
  };

  return (
    <div className="wa-container">
      {/* Sidebar */}
      <div className={`wa-chatlist ${isMobile && showChat ? "hidden" : ""}`}>
        <ChatList userId={userId} onSelectChat={handleSelect} />
      </div>

      {/* Main panel */}
      <div
        className={`wa-chat-container ${isMobile && showChat ? "visible" : ""}`}
      >
        {activeChat ? (
          <ChatWindow
            chatId={activeChat}
            userInfo={activeChatUser}
            chatMode={chatMode}
            setChatMode={setChatMode}
            onBack={() => {
              if (isMobile) setShowChat(false);
            }}
          />
        ) : (
          <div className="wa-empty-state">
            <div className="wa-empty-icon">💬</div>
            <h3>Select a conversation</h3>
            <p>
              Choose a chat from the sidebar to start messaging your customers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
