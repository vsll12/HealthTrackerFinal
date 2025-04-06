import { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { useParams, useNavigate } from "react-router-dom"; // Added useNavigate
import { MdDelete } from "react-icons/md";
import { BiSolidMessageAltEdit } from "react-icons/bi";
import { MdKeyboardBackspace } from "react-icons/md";

const API_URL = "https://localhost:7094";

const Chat = ({ userId }) => {
  const { id: friendId } = useParams();
  const navigate = useNavigate(); // Hook for navigation
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [connection, setConnection] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    const fetchFriends = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found, redirecting to login...");
          return;
        }

        console.log(`Fetching friends for user ${userId}...`);
        const response = await fetch(`${API_URL}/api/friends/friends/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Fetch friends response status:", response.status);
        if (response.ok) {
          const data = await response.json();
          console.log("Friends data:", data);
          setFriends(data);
          setSelectedFriend(data.find((f) => f.id === friendId) || null);
          if (data.length > 0) {
            console.log("First friend's name:", data[0]?.name);
          } else {
            console.log("No friends returned.");
          }
        } else {
          console.error("Failed to fetch friends, status:", response.status);
        }
      } catch (error) {
        console.error("Error fetching friends:", error);
      }
    };

    fetchFriends();
  }, [userId, friendId]);

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
          setMessages(
            data.reverse().map((msg) => ({
              id: msg.id,
              senderId: msg.senderId,
              message: msg.content,
              timestamp: msg.timestamp,
              status: msg.status,
            }))
          );
        } else {
          console.error("Failed to fetch messages, status:", response.status);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/chatHub`, {
        accessTokenFactory: () => localStorage.getItem("token"),
      })
      .withAutomaticReconnect()
      .build();

    newConnection
      .start()
      .then(() => console.log("Connected to chat"))
      .catch((err) => console.error("Connection failed", err));

    newConnection.on("ReceiveMessage", (senderId, message, timestamp, status, id) => {
      setMessages((prev) => {
        if (!prev.some((msg) => msg.id === id)) {
          return [...prev, { id, senderId, message, timestamp, status }];
        }
        return prev;
      });
    });

    newConnection.on("MessageUpdated", (messageId, newContent, timestamp) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, message: newContent, timestamp } : msg
        )
      );
    });

    newConnection.on("MessageDeleted", (messageId) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
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

    try {
      await connection.invoke("SendMessage", userId, selectedFriend.id, message);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleTyping = async () => {
    if (!connection || !selectedFriend) return;
    try {
      await connection.invoke("NotifyTyping", userId, selectedFriend.id);
    } catch (error) {
      console.error("Error notifying typing:", error);
    }
  };

  const startEditing = (msg) => {
    if (msg.senderId === userId) {
      setEditingMessageId(msg.id);
      setEditedContent(msg.message);
    }
  };

  const updateMessage = async () => {
    if (!connection || !editingMessageId || editedContent.trim() === "") return;

    try {
      await connection.invoke("UpdateMessage", editingMessageId, editedContent);
      setEditingMessageId(null);
      setEditedContent("");
    } catch (error) {
      console.error("Error updating message:", error);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!connection) return;

    try {
      await connection.invoke("DeleteMessage", messageId);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const goToDashboard = () => {
    navigate("/dashboard"); // Adjust this path to match your dashboard route
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "'Segoe UI', sans-serif",
        background: "#121212",
      }}
    >
      {/* Friends Sidebar */}
      <div
        style={{
          width: "350px",
          background: "#1f2a44",
          borderRight: "1px solid #2a2f32",
          padding: "10px",
          overflowY: "auto",
        }}
      >
        <h3
          style={{
            fontSize: "16px",
            fontWeight: "bold",
            color: "#00bfa5",
            padding: "10px",
            margin: "0",
          }}
        >
          Chats
        </h3>
        <ul style={{ listStyleType: "none", padding: "0" }}>
          {friends.length > 0 ? (
            friends.map((friend) => (
              <li
                key={friend.id}
                onClick={() => setSelectedFriend(friend)}
                style={{
                  padding: "15px",
                  cursor: "pointer",
                  background:
                    selectedFriend?.id === friend.id ? "#2a2f32" : "transparent",
                  borderBottom: "1px solid #2a2f32",
                  display: "flex",
                  alignItems: "center",
                  transition: "background 0.2s",
                }}
                onMouseOver={(e) =>
                  selectedFriend?.id !== friend.id &&
                  (e.target.style.background = "#252d47")
                }
                onMouseOut={(e) =>
                  selectedFriend?.id !== friend.id &&
                  (e.target.style.background = "transparent")
                }
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    background: "#00bfa5",
                    borderRadius: "50%",
                    marginRight: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "18px",
                  }}
                >
                  {friend.name[0]}
                </div>
                <span style={{ fontSize: "15px", color: "#e9ecef" }}>
                  {friend.name}
                </span>
              </li>
            ))
          ) : (
            <p style={{ color: "#8696a0", fontSize: "14px", padding: "15px" }}>
              No friends yet.
            </p>
          )}
        </ul>
      </div>

      {/* Chat Section */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "#121212",
        }}
      >
        {selectedFriend ? (
          <>
            <div
              style={{
                padding: "10px 20px",
                background: "#1f2a44",
                color: "#e9ecef",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between", // Space out elements
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    background: "#00bfa5",
                    borderRadius: "50%",
                    marginRight: "15px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "18px",
                  }}
                >
                  {selectedFriend.name[0]}
                </div>
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: "normal",
                    margin: 0,
                  }}
                >
                  {selectedFriend.name}
                </h2>
              </div>
              <button
                onClick={goToDashboard}
                style={{
                  padding: "8px 16px",
                  background: "#d9534f",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "background 0.2s",
                }}
                onMouseOver={(e) => (e.target.style.background = "#c9302c")}
                onMouseOut={(e) => (e.target.style.background = "#d9534f")}
              >
                <MdKeyboardBackspace />
              </button>
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px",
                background: "#121212",
              }}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    justifyContent:
                      msg.senderId === userId ? "flex-end" : "flex-start",
                    marginBottom: "8px",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      background:
                        msg.senderId === userId ? "#005c4b" : "#2a2f32",
                      padding: "8px 12px",
                      borderRadius: "7.5px",
                      maxWidth: "70%",
                      boxShadow: "0 1px 0.5px rgba(0, 0, 0, 0.3)",
                      position: "relative",
                    }}
                  >
                    {editingMessageId === msg.id ? (
                      <div>
                        <input
                          type="text"
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "5px",
                            borderRadius: "4px",
                            border: "1px solid #3e4a5b",
                            fontSize: "14px",
                            background: "#1f2a44",
                            color: "#e9ecef",
                          }}
                        />
                        <div style={{ marginTop: "5px", textAlign: "right" }}>
                          <button
                            onClick={updateMessage}
                            style={{
                              padding: "4px 8px",
                              background: "#00bfa5",
                              color: "#fff",
                              border: "none",
                              borderRadius: "4px",
                              marginRight: "5px",
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingMessageId(null)}
                            style={{
                              padding: "4px 8px",
                              background: "#d9534f",
                              color: "#fff",
                              border: "none",
                              borderRadius: "4px",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "14px",
                            color: "#e9ecef",
                          }}
                        >
                          {msg.message}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: "2px",
                          }}
                        >
                          <small
                            style={{
                              fontSize: "11px",
                              color: "#8696a0",
                            }}
                          >
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </small>
                          {msg.senderId === userId && (
                            <div
                              style={{
                                display: "flex",
                                gap: "8px",
                              }}
                            >
                              <button
                                onClick={() => startEditing(msg)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  color: "#ffffff",
                                  fontSize: "16px",
                                  padding: 0,
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <BiSolidMessageAltEdit size={18} />
                              </button>
                              <button
                                onClick={() => deleteMessage(msg.id)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  color: "#ffffff",
                                  fontSize: "16px",
                                  padding: 0,
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <MdDelete size={18} />
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <p
                  style={{
                    fontStyle: "italic",
                    color: "#8696a0",
                    fontSize: "13px",
                    margin: "10px 0",
                  }}
                >
                  {selectedFriend.name} is typing...
                </p>
              )}
              <div ref={messagesEndRef}></div>
            </div>

            {/* Input Section */}
            <div
              style={{
                padding: "10px",
                background: "#1f2a44",
                display: "flex",
                alignItems: "center",
                boxShadow: "0 -1px 3px rgba(0, 0, 0, 0.3)",
              }}
            >
              <input
                type="text"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Type a message"
                style={{
                  flex: 1,
                  padding: "10px 15px",
                  borderRadius: "20px",
                  border: "none",
                  background: "#2a2f32",
                  fontSize: "14px",
                  marginRight: "10px",
                  color: "#e9ecef",
                  boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.1)",
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
              />
              <button
                onClick={sendMessage}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "#00bfa5",
                  color: "#fff",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: "20px" }}>➤</span>
              </button>
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#121212",
            }}
          >
            <p
              style={{ fontSize: "16px", color: "#8696a0", fontStyle: "italic" }}
            >
              Select a friend to start chatting
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;