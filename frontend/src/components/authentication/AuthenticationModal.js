import { useState } from "react";
import { Box, Button, Modal, Link, TextField, Typography } from "@mui/material";
import { useAuthenticationContext } from "../../contexts/AuthenticationContext";
import { useNotificationContext } from "../../contexts/NotificationContext";

const fields = [
  { name: "name", label: "Name" },
  { name: "address", label: "Address" },
  { name: "company_name", label: "Company Name" },
  { name: "company_size", lael: "Company Size", isNumber: true },
];

export default function AuthenticationModal() {
  const { authToken, signIn, signUp } = useAuthenticationContext();
  const notify = useNotificationContext();
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [options, setOptions] = useState({});

  const onChangeOptions = (e) => {
    setOptions((prevOptions) => {
      const option = e.target.name;
      const value = e.target.value;
      if (value) prevOptions[option] = value;
      else delete prevOptions?.[option];
      return { ...prevOptions };
    });
  };

  return (
    <Modal open={!authToken}>
      <Box>
        <Typography variant="body1">
          {isSignIn ? "Login" : "Registration"}
        </Typography>
        <TextField
          fullWidth
          required
          id="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          fullWidth
          required
          password
          id="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {!isSignIn &&
          fields.map(({ name, label, isNumber }) => (
            <TextField
              fullWidth
              key={name}
              name={name}
              label={label}
              value={options?.[name] ?? ""}
              error={
                isNumber &&
                name in options &&
                !(options[name] instanceof Number)
              }
              onChange={onChangeOptions}
            />
          ))}
        <Button
          disabled={
            !email ||
            !password ||
            (!isSignIn &&
              fields.filter(
                ({ name, isNumber }) =>
                  isNumber &&
                  name in options &&
                  !(options[name] instanceof Number)
              ))
          }
          onClick={() => {
            if (!isSignIn) {
              fields.forEach(({ name, isNumber }) => {
                if (name in options && isNumber) options[name] = +options[name];
              });
            }
            const promise = isSignIn
              ? signIn(email, password)
              : signUp(email, password, options);
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
