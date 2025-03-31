import { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { useParams } from "react-router-dom";

const API_URL = "https://localhost:7094";

const Chat = ({ userId }) => {
  const { id: friendId } = useParams();
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [connection, setConnection] = useState(null);
  const messagesEndRef = useRef(null);

  // Fetch friends and selected friend from local storage
  useEffect(() => {
    if (!userId) return;

    const fetchFriends = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/api/friends/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setFriends(data);
          setSelectedFriend(data.find((f) => f.id === friendId) || null);
        } else {
          console.error("Failed to fetch friends.");
        }
      } catch (error) {
        console.error("Error fetching friends:", error);
      }
    };

    fetchFriends();
  }, [userId, friendId]);

  // Retrieve messages from the backend
  useEffect(() => {
    if (!selectedFriend || !userId) return;

    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${API_URL}/api/messages/${userId}/${selectedFriend.id}?page=1&pageSize=50`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setMessages(data.reverse());
        } else {
          console.error("Failed to fetch messages.");
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [selectedFriend, userId]);

  // Connect to SignalR for real-time messaging
  useEffect(() => {
    if (!selectedFriend || !userId) return;

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/chatHub`)
      .withAutomaticReconnect()
      .build();

    newConnection.start()
      .then(() => console.log("Connected to chat"))
      .catch((err) => console.error("Connection failed", err));

    newConnection.on("ReceiveMessage", (senderId, message, timestamp) => {
      if (senderId !== userId) {
        setMessages((prev) => [...prev, { senderId, message, timestamp, status: "delivered" }]);
      }
    });

    newConnection.on("UserTyping", (typingUserId) => {
      if (typingUserId !== userId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }
    });

    setConnection(newConnection);

    return () => newConnection.stop();
  }, [selectedFriend, userId]);

  const sendMessage = async () => {
    if (message.trim() === "" || !connection || !selectedFriend) return;

    const timestamp = new Date().toISOString();
    const newMessage = { senderId: userId, message, timestamp, status: "sent" };
    setMessages((prev) => [...prev, newMessage]);
    setMessage("");

    try {
      // Send message via SignalR to broadcast to the receiver
      await connection.invoke("SendMessage", userId, selectedFriend.id, message);

      // Save the message to the backend database
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          senderId: userId,
          receiverId: selectedFriend.id,
          content: message,
        }),
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Arial, sans-serif" }}>
      {/* Friends Sidebar */}
      <div style={{ width: "250px", borderRight: "1px solid #ccc", padding: "10px", background: "#f8f9fa" }}>
        <h3>Friends</h3>
        <ul style={{ listStyleType: "none", padding: 0 }}>
          {friends.length > 0 ? (
            friends.map((friend) => (
              <li
                key={friend.id}
                onClick={() => setSelectedFriend(friend)}
                style={{
                  padding: "10px",
                  cursor: "pointer",
                  background: selectedFriend?.id === friend.id ? "#007bff" : "transparent",
                  color: selectedFriend?.id === friend.id ? "white" : "black",
                  borderRadius: "5px",
                  marginBottom: "5px",
                }}
              >
                {friend.userName}
              </li>
            ))
          ) : (
            <p>No friends yet.</p>
          )}
        </ul>
      </div>

      {/* Chat Section */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "10px" }}>
        {selectedFriend ? (
          <>
            <h2>Chat with {selectedFriend.userName}</h2>
            <div
              style={{
                flex: 1,
                maxHeight: "400px",
                overflowY: "auto",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "5px",
                background: "#fff",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: msg.senderId === userId ? "flex-end" : "flex-start",
                    marginBottom: "5px",
                  }}
                >
                  <div
                    style={{
                      background: msg.senderId === userId ? "#DCF8C6" : "#ECECEC",
                      padding: "10px",
                      borderRadius: "10px",
                      maxWidth: "70%",
                      textAlign: "left",
                    }}
                  >
                    <p>
                      <strong>{msg.senderId === userId ? "You" : selectedFriend.userName}:</strong> {msg.message}
                    </p>
                    <small>{new Date(msg.timestamp).toLocaleTimeString()} - {msg.status}</small>
                  </div>
                </div>
              ))}
              {isTyping && <p style={{ fontStyle: "italic" }}>{selectedFriend.userName} is typing...</p>}
              <div ref={messagesEndRef}></div>
            </div>

            {/* Input Section */}
            <div style={{ display: "flex", marginTop: "10px" }}>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                style={{ flex: 1, padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
              />
              <button
                onClick={sendMessage}
                style={{
                  padding: "10px 15px",
                  marginLeft: "5px",
                  borderRadius: "5px",
                  border: "none",
                  background: "#007bff",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <h2>Select a friend to chat</h2>
        )}
      </div>
    </div>
  );
};

export default Chat;
