import { useState } from "react";
import {
  Box,
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
import RegionInterest from "./RegionInterest";
import FieldSeason from "./field-season/FieldSeason";
import Profile from "./Profile";

const tabs = [
  {
    name: "Region Interest",
    icon: <PublicIcon />,
    component: <RegionInterest />,
  },
  {
    name: "Fields & Seasons",
    icon: <InsightsIcon />,
    component: <FieldSeason />,
  },
  {
    name: "Profile",
    icon: <PersonIcon />,
    component: <Profile />,
  },
];

export default function Information() {
  const [tab, setTab] = useState(0);

  return (
    <Box
      sx={{
        position: "absolute",
        right: 0,
        width: "30%",
      }}
    >
      {tabs.map(({ name, component }, i) => (
        <Box key={name} hidden={tab !== i}>
          {component}
        </Box>
      ))}
      <Drawer variant="persistent" anchor="right" open>
        <List>
          {tabs.map(({ name, icon }, i) => (
            <ListItem key={name} disablePadding>
              <ListItemButton onClick={() => setTab(i)}>
                <ListItemIcon>{icon}</ListItemIcon>
                <ListItemText primary={name} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
    </Box>
  );
}
