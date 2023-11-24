import { useState } from "react";
import { Box, IconButton } from "@mui/material";
import AuthModal from "./components/auth/AuthModal";
import GeoMap from "./components/map/GeoMap";
import InfoDrawer from "./components/info/InfoDrawer";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuthContext } from "./contexts/AuthContext";

export default function App() {
  const { signOut } = useAuthContext();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <Box
        sx={{
          position: "absolute",
          top: 5,
          right: 5,
          float: "right",
          zIndex: 2000,
        }}
      >
        <IconButton onClick={signOut}>
          <LogoutIcon />
        </IconButton>
        <IconButton onClick={() => setShowInfo(!showInfo)}>
          <MenuIcon />
        </IconButton>
      </Box>
      <AuthModal />
      <GeoMap />
      <InfoDrawer open={showInfo} />
    </>
  );
}
