import { useEffect, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  TextField,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useAuthenticationContext } from "../../contexts/AuthenticationContext";
import { useNotificationContext } from "./NotificationContext";

const fields = [
  { name: "name", label: "Name" },
  { name: "address", label: "Address" },
  { name: "company_name", label: "Company Name" },
  { name: "company_size", lael: "Company Size", isNumber: true },
];

export default function Profile() {
  const { authenticationToken, signOut } = useAuthenticationContext();
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
            setUser({ ...options, ...responseBody });
            notify({
              message: "Successfully retrieve the user information",
              isError: false,
            });
          } else {
            notify({ message: responseBody["data"], isError: true });
          }
        })
        .catch((error) => notify({ message: error, isError: true }));
    } else setUser(undefined);
  }, [authenticationToken]);

  const updateUser = () => {
    fields.forEach(({ name, isNumber }) => {
      if (isNumber && name in options) {
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
          setUser({ ...options, ...responseBody });
          notify({
            message: "Successfully update the user information",
            isError: false,
          });
        } else {
          notify({ message: responseBody["data"], isError: true });
        }
      })
      .catch((error) => notify({ message: error, isError: true }));
  };

  const onChangeOptions = (e) => {
    setOptions((prevOptions) => {
      const option = e.target.name;
      const value = e.target.value;
      const options = { ...prevOptions };
      if (value) options[option] = value;
      else delete options?.[option];
      return options;
    });
  };

  return (
    <Box>
      <TextField fullWidth disabled label="Email" value={options?.["email"]} />
      <TextField
        fullWidth
        InputProps={{
          endAdornment: (
            <InputAdornment>
              <IconButton onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        password={!showPassword}
        name="password"
        label="Password"
        value={options?.["password"]}
        onChange={onChangeOptions}
      />
      {fields.map(({ name, label, isNumber }) => (
        <TextField
          fullWidth
          key={name}
          name={name}
          label={label}
          value={options?.[name] ?? ""}
          onChange={onChangeOptions}
          error={
            isNumber && name in options && !(options[name] instanceof Number)
          }
        />
      ))}
      <Button
        disabled={
          fields.every(({ name }) => options?.[name] === user?.[name]) ||
          fields.filter(
            ({ name, isNumber }) =>
              isNumber && name in options && !(options[name] instanceof Number)
          )
        }
        onClick={updateUser}
      >
        Update profile
      </Button>
      <Button onClick={() => signOut()}>Logout</Button>
    </Box>
  );
}
