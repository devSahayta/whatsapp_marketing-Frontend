// pages/ChatPage.jsx
"use client";

import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom"; // ← added
import ChatList from "../components/ChatList";
import ChatWindow from "../components/ChatWindow";
import "../styles/chat.css";
import useAuthUser from "../hooks/useAuthUser";

export default function ChatPage() {
  const { userId } = useAuthUser();
  const location = useLocation(); // ← added
  const [activeChat, setActiveChat] = useState(null);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [chatMode, setChatMode] = useState("AI");
  const [isMobile, setIsMobile] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Existing mobile check
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Auto-open chat from notification click ──────────── // ← added
  useEffect(() => {
    const openChatId = location.state?.openChatId;
    if (!openChatId || !userId) return;

    const fetchAndOpen = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/chats?user_id=${userId}&limit=100&offset=0`,
        );
        const data = await res.json();
        if (!data.ok) return;

        const chat = data.chats.find((c) => c.chat_id === openChatId);
        if (chat) {
          setActiveChat(chat.chat_id);
          setActiveChatUser(chat);
          setChatMode((chat.mode || "AI").toUpperCase().trim());
          if (isMobile) setShowChat(true);
        }
      } catch (e) {
        console.error("auto-open chat failed:", e);
      }
    };

    fetchAndOpen();
  }, [location.state?.openChatId, userId]); // eslint-disable-line

  const handleSelect = (chatId, userData) => {
    setActiveChat(chatId);
    setActiveChatUser(userData);
    setChatMode((userData?.mode || "AI").toUpperCase().trim());
    if (isMobile) setShowChat(true);
  };

  return (
    <div className="wa-container">
      <div className={`wa-chatlist ${isMobile && showChat ? "hidden" : ""}`}>
        <ChatList userId={userId} onSelectChat={handleSelect} />
      </div>

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
