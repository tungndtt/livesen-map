import { useState } from "react";
import {
  Box,
  Button,
  Modal,
  Link,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { useAuthenticationContext } from "../../contexts/AuthenticationContext";
import { useNotificationContext } from "../../contexts/NotificationContext";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { UserProfile, UserProfileField } from "../../types/profile";

const fields = [
  { name: "name", label: "Name" },
  { name: "address", label: "Address" },
  { name: "company_name", label: "Company Name" },
  { name: "company_size", label: "Company Size", isNumber: true },
];

export default function AuthenticationModal() {
  const { authenticationToken, signIn, signUp } = useAuthenticationContext();
  const notify = useNotificationContext();
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [options, setOptions] = useState<UserProfile>({});

  const onChangeOptions = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOptions((prevOptions) => {
      const name = e.target.name;
      const value =
        e.target.type === "number" ? +e.target.value : e.target.value;
      return { ...prevOptions, [name]: value };
    });
  };

  return (
    <Modal
      open={!authenticationToken}
      sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
    >
      <Box
        sx={{
          width: "400px",
          height: "fit-content",
          p: 2,
          borderRadius: 2,
          backgroundColor: "white",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Typography variant="body1">
          <b>{isSignIn ? "Login" : "Registration"}</b>
        </Typography>
        <TextField
          fullWidth
          size="small"
          required
          id="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          fullWidth
          size="small"
          required
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          type={showPassword ? "text" : "password"}
          id="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {!isSignIn &&
          fields.map(({ name, label, isNumber }) => (
            <TextField
              key={name}
              fullWidth
              size="small"
              type={isNumber ? "number" : "text"}
              name={name}
              label={label}
              value={options?.[name as UserProfileField] ?? ""}
              onChange={onChangeOptions}
            />
          ))}
        <Button
          fullWidth
          size="small"
          variant="outlined"
          disabled={!email || !password}
          onClick={() => {
            const promise = isSignIn
              ? signIn(email, password)
              : signUp(email, password, options);
            promise
              .then((message) => {
                setEmail("");
                setPassword("");
                setOptions({});
                notify({ message: message, isError: false });
              })
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
