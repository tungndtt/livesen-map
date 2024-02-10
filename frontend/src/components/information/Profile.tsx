import { useEffect, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  TextField,
} from "@mui/material";
import UpgradeIcon from "@mui/icons-material/Upgrade";
import ClearIcon from "@mui/icons-material/Clear";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useAuthenticationContext } from "../../contexts/AuthenticationContext";
import { useNotificationContext } from "../../contexts/NotificationContext";
import {
  UserProfile,
  UserProfileField,
  parseUserProfile,
} from "../../types/profile";

const fields = [
  { name: "name", label: "Name" },
  { name: "address", label: "Address" },
  { name: "companyName", label: "Company Name" },
  { name: "companySize", label: "Company Size", isNumber: true },
];

export default function Profile() {
  const { authenticationToken, doRequest } = useAuthenticationContext();
  const notify = useNotificationContext();
  const [user, setUser] = useState<UserProfile | undefined>(undefined);
  const [options, setOptions] = useState<UserProfile>({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    doRequest("user", "GET")
      .then(async (response) => {
        const responseBody = await response.json();
        const userProfile = parseUserProfile(responseBody);
        setUser(userProfile);
        setOptions(userProfile);
        notify({
          message: "Successfully retrieve the user information",
          isError: false,
        });
      })
      .catch((error) => {
        setUser(undefined);
        notify({ message: error, isError: true });
      });
  }, [authenticationToken]);

  const updateUser = () => {
    doRequest("user/upgister", "PUT", options)
      .then(async (response) => {
        const responseBody = await response.json();
        setUser(parseUserProfile(responseBody));
        notify({
          message: "Successfully update the user information",
          isError: false,
        });
      })
      .catch((error) => notify({ message: error, isError: true }));
  };

  const onChangeOptions = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOptions((prevOptions) => {
      const name = e.target.name;
      const value =
        e.target.type === "number" ? +e.target.value : e.target.value;
      return { ...prevOptions, [name]: value };
    });
  };

  return (
    <Box className="information-container">
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
          value={options?.[name as UserProfileField] ?? ""}
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
      <Box className="button-row-container">
        <Button
          fullWidth
          size="small"
          variant="outlined"
          color="warning"
          endIcon={<UpgradeIcon />}
          disabled={fields.every(
            ({ name }) =>
              options?.[name as UserProfileField] ===
              user?.[name as UserProfileField]
          )}
          onClick={updateUser}
        >
          Update profile
        </Button>
        <Button
          fullWidth
          size="small"
          variant="outlined"
          color="secondary"
          endIcon={<ClearIcon />}
          onClick={() => setOptions(user ?? {})}
        >
          Reset
        </Button>
      </Box>
    </Box>
  );
}
