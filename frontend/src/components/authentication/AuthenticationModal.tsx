import { useState } from "react";
import {
  Box,
  Button,
  Divider,
  Modal,
  Link,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import LoginIcon from "@mui/icons-material/Login";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useNotificationContext } from "../../contexts/NotificationContext";
import { useAuthenticationContext } from "../../contexts/AuthenticationContext";
import { UserProfile, UserProfileField } from "../../types/profile";

const fields = [
  { name: "name", label: "Name" },
  { name: "address", label: "Address" },
  { name: "company_name", label: "Company Name" },
  { name: "company_size", label: "Company Size", isNumber: true },
];

export default function AuthenticationModal() {
  const notify = useNotificationContext();
  const { authenticationToken, signIn, signUp } = useAuthenticationContext();
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [options, setOptions] = useState<UserProfile>({});
  const [registrationToken, setRegistrationToken] = useState("");

  const reset = () => {
    setEmail("");
    setPassword("");
    setOptions({});
  };

  const onChangeOptions = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOptions((prevOptions) => {
      const name = e.target.name;
      const value =
        e.target.type === "number" ? +e.target.value : e.target.value;
      return { ...prevOptions, [name]: value };
    });
  };

  const activateRegistration = () => {
    const serverUrl = process.env.REACT_APP_SERVER_URL;
    fetch(`${serverUrl}/authentication/activation`, {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify({ activation_token: registrationToken }),
    })
      .then(async (response) => {
        const message = (await response.json())["data"];
        if (response.ok) {
          setRegistrationToken("");
          notify({ message, isError: false });
        } else {
          notify({ message, isError: true });
        }
      })
      .catch((error) => notify({ message: error, isError: true }));
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
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {!isSignIn && (
            <IconButton onClick={() => setIsSignIn(true)}>
              <ChevronLeftIcon />
            </IconButton>
          )}
          <Typography variant="body1" ml={isSignIn ? "45%" : "30%"}>
            <b>{isSignIn ? "Login" : "Registration"}</b>
          </Typography>
        </Box>
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
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Button
            fullWidth
            size="small"
            variant="outlined"
            disabled={!email || !password}
            endIcon={isSignIn ? <LoginIcon /> : <SendIcon />}
            onClick={() => {
              const promise = isSignIn
                ? signIn(email, password)
                : signUp(email, password, options);
              promise
                .then((message) => {
                  reset();
                  notify({ message: message, isError: false });
                })
                .catch((error) => notify({ message: error, isError: true }));
            }}
          >
            {isSignIn ? "Login" : "Register"}
          </Button>
          {!isSignIn && (
            <Button
              sx={{ width: "30%" }}
              size="small"
              variant="outlined"
              color="error"
              endIcon={<CloseIcon />}
              onClick={reset}
            >
              Reset
            </Button>
          )}
        </Box>
        {isSignIn && (
          <Link href="#" fontSize="12px" onClick={() => setIsSignIn(false)}>
            No account? Go to registration
          </Link>
        )}
        {!isSignIn && (
          <>
            <Divider
              variant="fullWidth"
              sx={{
                width: "100%",
                color: "#b3b3b3",
                fontSize: "12px",
              }}
            >
              Activation
            </Divider>
            <TextField
              fullWidth
              size="small"
              multiline
              rows={2}
              label="Registration Token"
              value={registrationToken}
              onChange={(e) => setRegistrationToken(e.target.value.trim())}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      disabled={!registrationToken}
                      onClick={activateRegistration}
                      color="primary"
                    >
                      <SendIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </>
        )}
      </Box>
    </Modal>
  );
}
