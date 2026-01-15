// import React, { useState } from "react";
// import ChatList from "../components/ChatList";
// import ChatWindow from "../components/ChatWindow";
// import "../styles/chat.css";

// export default function ChatPage() {
//   const [activeChat, setActiveChat] = useState(null);
//   const [activeChatUser, setActiveChatUser] = useState(null);

//   return (
//     <div className="wa-container">
//       <ChatList
//         onSelectChat={(chat, user) => {
//           setActiveChat(chat);
//           setActiveChatUser(user);
//         }}
//       />

//       <ChatWindow chatId={activeChat} userInfo={activeChatUser} />
//     </div>
//   );
// }
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
      {/* ▄▄▄ NAVBAR AREA ENDS — DROPDOWN BELOW IT ON LEFT ▄▄▄ */}
      <div className="event-dropdown-wrapper">
        <EventChatSelector
          onEventSelect={(eventId) => {
            setSelectedEvent(eventId);
            setActiveChat(null);
            setActiveChatUser(null);
          }}
        />
      </div>

      {/* If no event selected → guide message */}
      {!selectedEvent ? (
        <p className="select-event-message">
          👈 Please select an event to view chats.
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

      {/* Show Chat Window only when chat clicked */}
      {activeChat && (
  <ChatWindow
    chatId={activeChat}
    userInfo={activeChatUser}
    chatMode={chatMode}
    setChatMode={setChatMode}
  />
)}

    </div>
  );
}

// // ----------------------------connection--------------------

// "use client";

// import React, { useState } from "react";
// import EventChatSelector from "../components/EventChatSelector";
// import ChatList from "../components/ChatList";
// import ChatWindow from "../components/ChatWindow";
// import "../styles/chat.css";

// export default function ChatPage() {
//   const [eventId, setEventId] = useState(null);
//   const [activeChat, setActiveChat] = useState(null);
//   const [activeChatUser, setActiveChatUser] = useState(null);

//   return (
//     <div className="wa-container">
//       <div style={{ padding: "20px" }}>
//         <h1>Event Chat Dashboard</h1>

//         <EventChatSelector onSelectEvent={(id) => setEventId(id)} />
//       </div>

//       {/* Only show chats after selecting event */}
//       {eventId && (
//         <ChatList
//           eventId={eventId}
//           onSelectChat={(chat, user) => {
//             setActiveChat(chat);
//             setActiveChatUser(user);
//           }}
//         />
//       )}

//       <ChatWindow chatId={activeChat} userInfo={activeChatUser} />
//     </div>
//   );
// }
