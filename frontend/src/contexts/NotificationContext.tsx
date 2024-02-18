import { ReactNode, createContext, useContext, useState } from "react";
import { Alert, Snackbar } from "@mui/material";

type Notification = {
  message: string;
  isError: boolean;
};

const NotificationContext = createContext<
  (_notification: Notification) => void
>(() => {});

export default function NotificationProvider(props: { children: ReactNode }) {
  const [notification, setNotification] = useState<Notification | undefined>(
    undefined
  );

  const onClose = (_: any, reason?: string) => {
    if (reason === "clickaway") return;
    setNotification(undefined);
  };

  return (
    <NotificationContext.Provider value={setNotification}>
      {props.children}
      <Snackbar
        open={Boolean(notification)}
        autoHideDuration={2500}
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
