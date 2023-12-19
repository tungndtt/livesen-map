import { useState } from "react";
import {
  Box,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import PublicIcon from "@mui/icons-material/Public";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import StorageIcon from "@mui/icons-material/Storage";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuthenticationContext } from "../../contexts/AuthenticationContext";
import RegionInterest from "./RegionInterest";
import SeasonInterest from "./SeasonInterest";
import RegisteredData from "./registered-data/RegisteredData";
import Profile from "./Profile";

const tabs = [
  {
    name: "Region Interest",
    icon: <PublicIcon />,
  },
  {
    name: "Season Interest",
    icon: <AgricultureIcon />,
  },
  {
    name: "Registered Data",
    icon: <StorageIcon />,
  },
  {
    name: "Profile",
    icon: <PersonIcon />,
  },
];

export default function Information() {
  const { signOut } = useAuthenticationContext();
  const [tab, setTab] = useState(0);

  return (
    <Box
      sx={{
        position: "absolute",
        height: "100%",
        right: 0,
        width: "45%",
      }}
    >
      <Box
        width="calc(100% - 225px)"
        height="100%"
        display="flex"
        flexDirection="column"
      >
        <Box
          sx={{
            display: tab === 0 ? "flex" : "none",
            overflow: "hidden",
            overflowY: "auto",
          }}
        >
          <RegionInterest />
        </Box>
        <Box
          sx={{
            display: tab === 1 ? "flex" : "none",
            overflow: "hidden",
            overflowY: "auto",
          }}
        >
          <SeasonInterest />
        </Box>
        <Box
          sx={{
            display: tab === 2 ? "flex" : "none",
            overflow: "hidden",
            overflowY: "auto",
          }}
        >
          <RegisteredData />
        </Box>
        <Box
          sx={{
            display: tab === 3 ? "flex" : "none",
            overflow: "hidden",
            overflowY: "auto",
          }}
        >
          <Profile />
        </Box>
      </Box>
      <Drawer
        PaperProps={{
          sx: {
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            width: "225px",
            backgroundColor: "#f1ebeb",
            borderLeft: 0,
          },
        }}
        variant="persistent"
        anchor="right"
        open
      >
        <img src="livesen-map-logo.png" alt="logo" width={80} />
        <List>
          {tabs.map(({ name, icon }, i) => (
            <ListItem key={name}>
              <ListItemButton
                onClick={() => setTab(i)}
                selected={tab === i}
                sx={{ borderRadius: 2 }}
              >
                <ListItemIcon>{icon}</ListItemIcon>
                <ListItemText
                  primary={name}
                  primaryTypographyProps={{
                    fontSize: "12px",
                    fontWeight: tab === i ? 600 : 300,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Button
          sx={{ width: "85%", m: 2 }}
          size="small"
          variant="outlined"
          color="error"
          onClick={() => signOut()}
          endIcon={<LogoutIcon />}
        >
          Logout
        </Button>
      </Drawer>
    </Box>
  );
}
