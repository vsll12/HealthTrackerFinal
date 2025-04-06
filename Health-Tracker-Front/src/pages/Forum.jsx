import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MdAttachFile, MdKeyboardBackspace } from "react-icons/md";
import * as signalR from "@microsoft/signalr";

const API_URL = "https://localhost:7094";
const FRONTEND_URL = "http://localhost:5173"; // Verify this matches your frontend port

const Forum = ({ userId }) => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connection, setConnection] = useState(null);
  const postsEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    const fetchPosts = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(`${API_URL}/api/forum/posts`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch forum posts: ${response.status}`);
        }

        const data = await response.json();
        setPosts(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchPosts();

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/chatHub`, {
        accessTokenFactory: () => localStorage.getItem("token"),
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    newConnection.onclose((err) => console.error("Connection closed:", err));

    newConnection
      .start()
      .then(() => {
        console.log("Connected to forum hub:", newConnection.state);
        setConnection(newConnection);
      })
      .catch((err) => {
        console.error("Connection failed:", err);
        setError("Failed to connect to the forum. Please try again later.");
      });

    newConnection.on("ReceiveForumPost", (post) => {
      console.log("Received post:", post);
      setPosts((prev) => {
        if (!prev.some((p) => p.id === post.id)) {
          return [...prev, post];
        }
        return prev;
      });
    });

    return () => {
      if (newConnection) {
        newConnection.stop().then(() => console.log("Connection stopped"));
      }
    };
  }, [userId, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type.startsWith("image/") || file.type === "application/pdf")) {
      setSelectedFile(file);
    } else {
      alert("Please select an image or PDF file.");
      e.target.value = null;
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const submitPost = async () => {
    if (newPost.trim() === "" && !selectedFile) {
      setError("Please enter a message or attach a file.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found.");
        navigate("/login");
        return;
      }

      if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
        console.error("SignalR not connected. Attempting to reconnect...");
        await connection.start();
      }

      let fileUrl = null;
      if (selectedFile) {
        const formData = new FormData();
        formData.append("userId", userId);
        formData.append("content", newPost || "");
        formData.append("file", selectedFile);

        const response = await fetch(`${API_URL}/api/forum/posts`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to submit post: ${response.status} - ${errorText}`);
        }

        const postedData = await response.json();
        fileUrl = postedData.fileUrl;
        console.log("File uploaded, URL:", fileUrl);
      } else {
        // Text-only post, no need to hit the controller
        fileUrl = null;
      }

      const postData = { userId, content: newPost || "", fileUrl };
      console.log("Sending forum post:", postData);
      await connection.invoke("SendForumPost", userId, newPost || "", fileUrl);

      setNewPost("");
      setSelectedFile(null);
      fileInputRef.current.value = null;
      setError(null);
    } catch (error) {
      console.error("Error submitting post:", error.message);
      setError("Failed to submit post: " + error.message);
    }
  };

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  useEffect(() => {
    postsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [posts]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        fontFamily: "'Segoe UI', sans-serif",
        background: "#121212",
      }}
    >
      <div
        style={{
          padding: "10px 20px",
          background: "#1f2a44",
          color: "#e9ecef",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
          position: "sticky",
          top: 0,
          zIndex: 1,
        }}
      >
        <h2 style={{ fontSize: "18px", fontWeight: "normal", margin: 0 }}>
          Health Community Forum
        </h2>
        <button
          onClick={goToDashboard}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "#d9534f",
            color: "#fff",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseOver={(e) => (e.target.style.background = "#c9302c")}
          onMouseOut={(e) => (e.target.style.background = "#d9534f")}
        >
          <MdKeyboardBackspace size={20} />
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
        {loading ? (
          <p style={{ color: "#8696a0", textAlign: "center" }}>Loading posts...</p>
        ) : error ? (
          <p style={{ color: "#d9534f", textAlign: "center" }}>{error}</p>
        ) : posts.length === 0 ? (
          <p style={{ color: "#8696a0", textAlign: "center" }}>
            No posts yet. Be the first to share!
          </p>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              style={{
                background: "#2a2f32",
                padding: "12px 16px",
                borderRadius: "7.5px",
                marginBottom: "12px",
                boxShadow: "0 1px 0.5px rgba(0, 0, 0, 0.3)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
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
                  {post.userName[0]}
                </div>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "15px",
                      color: "#e9ecef",
                      fontWeight: "bold",
                    }}
                  >
                    {post.userName}
                  </p>
                  <small style={{ fontSize: "11px", color: "#8696a0" }}>
                    {new Date(post.timestamp).toLocaleString()}
                  </small>
                </div>
              </div>
              <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#e9ecef" }}>
                {post.content}
              </p>
              {post.fileUrl && (
                <div>
                  {post.fileUrl.endsWith(".pdf") ? (
                    <a
                      href={post.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#00bfa5", textDecoration: "underline" }}
                    >
                      View PDF
                    </a>
                  ) : (
                    <img
                      src={post.fileUrl}
                      alt="Post attachment"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "300px",
                        borderRadius: "4px",
                        marginTop: "8px",
                      }}
                      onError={(e) => console.error("Failed to load image:", post.fileUrl)}
                    />
                  )}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={postsEndRef}></div>
      </div>
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
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="Share something with the community..."
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
            if (e.key === "Enter") submitPost();
          }}
        />
        <button
          onClick={triggerFileInput}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "#2a2f32",
            color: selectedFile ? "#00bfa5" : "#8696a0",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            marginRight: "10px",
            transition: "background 0.2s",
          }}
          onMouseOver={(e) => (e.target.style.background = "#3e4a5b")}
          onMouseOut={(e) => (e.target.style.background = "#2a2f32")}
          title="Attach a file"
        >
          <MdAttachFile size={20} />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,application/pdf"
          style={{ display: "none" }}
        />
        <button
          onClick={submitPost}
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
    </div>
  );
};

export default Forum;