import { Box } from "@mui/material";
import { useResizeContext } from "./contexts/ResizeContext";
import AuthenticationModal from "./components/authentication/AuthenticationModal";
import GeoMap from "./components/map/GeoMap";
import Information from "./components/information/Information";

export default function App() {
  const { layout, sidebar } = useResizeContext();
  return (
    <>
      <AuthenticationModal />
      <Box
        sx={{
          display: "flex",
          flexDirection: layout,
          justifyContent: "space-between",
          height: "100vh",
          width: `calc(100vw - var(--sidebar-${sidebar}))`,
        }}
      >
        <GeoMap />
        <Information />
      </Box>
    </>
  );
}
