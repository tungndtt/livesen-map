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
  const { authenticationToken, signIn } = useAuthenticationContext();
  const [mode, setMode] = useState<"sign_in" | "sign_up" | "reset_password">(
    "sign_in"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [options, setOptions] = useState<UserProfile>({});
  const [registrationToken, setRegistrationToken] = useState("");

  const serverUrl = process.env.REACT_APP_SERVER_URL;

  const signUp = (email: string, password: string, options: UserProfile) => {
    return new Promise<string>((resolve, reject) => {
      fetch(`${serverUrl}/authentication/sign_up`, {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify({ email, password, ...options }),
      })
        .then(async (response) => {
          const responseBody = await response.json();
          const data = responseBody["data"];
          if (response.ok) resolve(data);
          else reject(data);
        })
        .catch((error) => reject(error));
    });
  };

  const resetPassword = (email: string) => {
    return new Promise<string>((resolve, reject) => {
      fetch(`${serverUrl}/authentication/reset_password`, {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify({ email }),
      })
        .then(async (response) => {
          const responseBody = await response.json();
          const data = responseBody["data"];
          if (response.ok) resolve(data);
          else reject(data);
        })
        .catch((error) => reject(error));
    });
  };

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
          {mode !== "sign_in" && (
            <IconButton onClick={() => setMode("sign_in")}>
              <ChevronLeftIcon />
            </IconButton>
          )}
          <Typography
            variant="body1"
            ml={mode === "sign_in" ? "45%" : mode === "sign_up" ? "30%" : "25%"}
          >
            <b>
              {mode === "sign_in"
                ? "Login"
                : mode === "sign_up"
                ? "Registration"
                : "Reset Password"}
            </b>
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
        {mode !== "reset_password" && (
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
        )}

        {mode === "sign_up" &&
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
            disabled={!email || (mode !== "reset_password" && !password)}
            endIcon={mode === "sign_in" ? <LoginIcon /> : <SendIcon />}
            onClick={() => {
              const promise =
                mode === "sign_in"
                  ? signIn(email, password)
                  : mode === "sign_up"
                  ? signUp(email, password, options)
                  : resetPassword(email);
              promise
                .then((message) => {
                  reset();
                  notify({ message: message, isError: false });
                })
                .catch((error) => notify({ message: error, isError: true }));
            }}
          >
            {mode === "sign_in"
              ? "Login"
              : mode === "sign_up"
              ? "Register"
              : "Reset"}
          </Button>
          {mode === "sign_up" && (
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
        {mode === "sign_in" && (
          <Box
            width="100%"
            height="20px"
            display="flex"
            flexDirection="row"
            justifyContent="space-evenly"
            alignItems="center"
            gap={2}
          >
            <Link href="#" fontSize="12px" onClick={() => setMode("sign_up")}>
              Register an account
            </Link>
            <Divider
              orientation="vertical"
              sx={{
                height: "100%",
                fontSize: "12px",
              }}
            />
            <Link
              href="#"
              fontSize="12px"
              onClick={() => setMode("reset_password")}
            >
              Forget password?
            </Link>
          </Box>
        )}
        {mode === "sign_up" && (
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
