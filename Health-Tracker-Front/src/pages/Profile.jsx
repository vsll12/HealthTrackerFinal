import { useState, useEffect } from "react";
import axios from "axios";
import Header from "../partials/Header";
import Sidebar from "../partials/Sidebar";
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Grid,
  Button,
  Container,
  CircularProgress,
} from "@mui/material";
import { logout } from "../services/authService";

const Profile = () => {
  const [user, setUser] = useState(null);
  const token = localStorage.getItem("token");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get("https://localhost:7094/api/Profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
      } catch (error) {
        console.error("Profil yüklenirken hata oluştu:", error);
      }
    };

    if (token) fetchProfile();
  }, [token]);

  if (!user)
    return (
      <CircularProgress style={{ margin: "50px auto", display: "block" }} />
    );

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            <Container maxWidth="sm" style={{ marginTop: "30px" }}>
              <Card
                sx={{
                  p: 3,
                  borderRadius: 3,
                  boxShadow: 3,
                  textAlign: "center",
                  background: "#fff",
                }}
              >
                <Avatar
                  src={`https://localhost:7094/uploads/${user.profileImagePath}`}
                  alt={user.name}
                  sx={{
                    width: 100,
                    height: 100,
                    margin: "auto",
                    boxShadow: 2,
                  }}
                />
                <CardContent>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {user.name}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    <b>Age:</b> {user.age}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    <b>Weight:</b> {user.weight} kg
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    <b>Height:</b> {user.height} cm
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    <b>Gender:</b> {user.gender}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    <b>Email:</b> {user.email}
                  </Typography>
                </CardContent>
                <Button
                  variant="contained"
                  sx={{ mt: 2 }}
                  color="primary"
                >
                  Edit Profile
                </Button>
              </Card>
            </Container>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
