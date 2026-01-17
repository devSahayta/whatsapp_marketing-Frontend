"use client";

import React, { useState } from "react";
import EventChatSelector from "../components/EventChatSelector";
import ChatList from "../components/ChatList";
import ChatWindow from "../components/ChatWindow";
import "../styles/chat.css";

export default function ChatPage() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [chatMode, setChatMode] = useState("AUTO");

  return (
    <div className="wa-container">
      {/* LEFT PANEL: Event Selector + Chat List */}
      <div className="wa-chatlist">
        {/* Event Selector at Top */}
        <div className="event-dropdown-wrapper">
          <EventChatSelector
            onEventSelect={(eventId) => {
              setSelectedEvent(eventId);
              setActiveChat(null);
              setActiveChatUser(null);
            }}
          />
        </div>

        {/* Chat List */}
        {!selectedEvent ? (
          <p className="select-event-message">
            👆 Please select an event to view chats.
          </p>
        ) : (
          <ChatList
            eventId={selectedEvent}
            onSelectChat={(chatId, userData) => {
              setActiveChat(chatId);
              setActiveChatUser(userData);
              setChatMode((userData.mode || "AI").toUpperCase().trim());
            }}
          />
        )}
      </div>

      {/* RIGHT PANEL: Chat Window */}
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
            <p>Choose a conversation from the list to view messages</p>
          </div>
        )}
      </div>
    </div>
  );
}