import { useEffect, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  TextField,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useAuthenticationContext } from "../../contexts/AuthenticationContext";
import { useNotificationContext } from "../../contexts/NotificationContext";

const fields = [
  { name: "name", label: "Name" },
  { name: "address", label: "Address" },
  { name: "company_name", label: "Company Name" },
  { name: "company_size", label: "Company Size", isNumber: true },
];

export default function Profile() {
  const { authenticationToken } = useAuthenticationContext();
  const notify = useNotificationContext();
  const [user, setUser] = useState(undefined);
  const [options, setOptions] = useState(user);
  const [showPassword, setShowPassword] = useState(false);
  const serverUrl = process.env.REACT_APP_SERVER_URL + "/user";

  useEffect(() => {
    if (authenticationToken) {
      fetch(serverUrl, {
        headers: { "Auth-Token": authenticationToken },
        method: "GET",
      })
        .then(async (response) => {
          const responseBody = await response.json();
          if (response.ok) {
            setUser(responseBody);
            setOptions(responseBody);
            notify({
              message: "Successfully retrieve the user information",
              isError: false,
            });
          } else {
            notify({ message: responseBody["data"], isError: true });
          }
        })
        .catch((error) => notify({ message: error.message, isError: true }));
    } else setUser(undefined);
  }, [authenticationToken]);

  const updateUser = () => {
    fields.forEach(({ name, isNumber }) => {
      if (options?.[name] !== undefined && isNumber) {
        options[name] = +options[name];
      }
    });
    fetch(`${serverUrl}/upgister`, {
      headers: {
        "Content-Type": "application/json",
        "Auth-Token": authenticationToken,
      },
      method: "PUT",
      body: JSON.stringify(options),
    })
      .then(async (response) => {
        const responseBody = await response.json();
        if (response.ok) {
          setUser(responseBody);
          notify({
            message: "Successfully update the user information",
            isError: false,
          });
        } else {
          notify({ message: responseBody["data"], isError: true });
        }
      })
      .catch((error) => notify({ message: error.message, isError: true }));
  };

  const onChangeOptions = (e) => {
    setOptions((prevOptions) => {
      const name = e.target.name;
      const value =
        e.target.type === "number" ? +e.target.value : e.target.value;
      return { ...prevOptions, [name]: value };
    });
  };

  return (
    <Box className="general-container">
      <TextField
        size="small"
        fullWidth
        disabled
        label="Email"
        value={options?.["email"] ?? ""}
      />
      {fields.map(({ name, label, isNumber }) => (
        <TextField
          size="small"
          fullWidth
          type={isNumber ? "number" : "text"}
          key={name}
          name={name}
          label={label}
          value={options?.[name] ?? ""}
          onChange={onChangeOptions}
        />
      ))}
      <TextField
        size="small"
        fullWidth
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
        name="password"
        label="New Password"
        value={options?.["password"] ?? ""}
        onChange={onChangeOptions}
      />
      <Button
        fullWidth
        size="small"
        variant="outlined"
        color="warning"
        endIcon={<SendIcon />}
        disabled={fields.every(({ name }) => options?.[name] === user?.[name])}
        onClick={updateUser}
      >
        Update profile
      </Button>
    </Box>
  );
}
