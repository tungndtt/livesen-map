import { useState } from "react";
import { Box, Button, Modal, Link, TextField, Typography } from "@mui/material";
import { useAuthContext } from "../../contexts/AuthContext";
import { useNotiContext } from "../../contexts/NotiContext";

export default function AuthenticationModal() {
  const { authToken, signIn, signUp } = useAuthContext();
  const notify = useNotiContext();
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <Modal open={!authToken}>
      <Box>
        <Typography variant="body1">
          {isSignIn ? "Login" : "Registration"}
        </Typography>
        <TextField
          required
          id="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          required
          password
          id="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          onClick={() => {
            if (!email || !password) return;
            const promise = isSignIn
              ? signIn(email, password)
              : signUp(email, password);
            promise
              .then((message) => notify({ message: message, isError: false }))
              .catch((error) => notify({ message: error, isError: true }));
          }}
        >
          {isSignIn ? "Login" : "Register"}
        </Button>
        <Link href="#" underline="none" onClick={() => setIsSignIn(!isSignIn)}>
          {isSignIn
            ? "No account? Go to registration"
            : "Already have an account? Go to login"}
        </Link>
      </Box>
    </Modal>
  );
}
