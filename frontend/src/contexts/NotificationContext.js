import { createContext, useContext, useState } from "react";
import { Alert, Snackbar } from "@mui/material";

const NotificationContext = createContext((_notification) => {});

export default function NotificationProvider({ children }) {
  const [notification, setNotification] = useState(null);

  const onClose = (_, reason) => {
    if (reason === "clickaway") return;
    setNotification(null);
  };

  return (
    <NotificationContext.Provider value={setNotification}>
      {children}
      <Snackbar
        open={Boolean(notification)}
        autoHideDuration={1500}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ zIndex: 9999 }}
        onClose={onClose}
      >
        <Alert
          onClose={onClose}
          severity={notification?.isError ? "error" : "success"}
          sx={{ width: "100%" }}
        >
          {notification?.message ?? ""}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}

export const useNotificationContext = () => {
  return useContext(NotificationContext);
};
