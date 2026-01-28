"use client";

import React, { useState } from "react";
import ChatList from "../components/ChatList";
import ChatWindow from "../components/ChatWindow";
import "../styles/chat.css";
import useAuthUser from "../hooks/useAuthUser";

export default function ChatPage() {
  const { userId } = useAuthUser();

  const [activeChat, setActiveChat] = useState(null);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [chatMode, setChatMode] = useState("AUTO");

  return (
    <div className="wa-container">
      <div className="wa-chatlist">
        <ChatList
          userId={userId}
          onSelectChat={(chatId, userData) => {
            setActiveChat(chatId);
            setActiveChatUser(userData);
            setChatMode((userData.mode || "AI").toUpperCase().trim());
          }}
        />
      </div>

      <div className="wa-chat-container">
        {activeChat ? (
          <ChatWindow
            chatId={activeChat}
            userInfo={activeChatUser}
            chatMode={chatMode}
            setChatMode={setChatMode}
          />
        ) : (
          <div className="wa-empty-state">
            <div className="wa-empty-icon">💬</div>
            <h3>Select a chat to start messaging</h3>
            <p>Choose a conversation from the list</p>
          </div>
        )}
      </div>
    </div>
  );
}
