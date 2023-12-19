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
import InsightsIcon from "@mui/icons-material/Insights";
import PublicIcon from "@mui/icons-material/Public";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuthenticationContext } from "../../contexts/AuthenticationContext";
import RegionInterest from "./RegionInterest";
import FieldSeason from "./field-season/FieldSeason";
import Profile from "./Profile";

const tabs = [
  {
    name: "Region Interest",
    icon: <PublicIcon />,
  },
  {
    name: "Fields & Seasons",
    icon: <InsightsIcon />,
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
        right: 0,
        width: "45%",
      }}
    >
      <Box width="calc(100% - 225px)">
        <Box display={tab === 0 ? "flex" : "none"}>
          <RegionInterest />
        </Box>
        <Box display={tab === 1 ? "flex" : "none"}>
          <FieldSeason />
        </Box>
        <Box display={tab === 2 ? "flex" : "none"}>
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
