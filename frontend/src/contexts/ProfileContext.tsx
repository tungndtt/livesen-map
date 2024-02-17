import {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import { useNotificationContext } from "./NotificationContext";
import { useAuthenticationContext } from "./AuthenticationContext";
import { UserProfile, parseUserProfile } from "../types/profile";

type ProfileContextType = {
  user: UserProfile | undefined;
  updateUser: (options: UserProfile) => void;
  onEvent: (action: string, payload: any) => void;
};

const ProfileContext = createContext<ProfileContextType>({
  user: undefined,
  updateUser: () => {},
  onEvent: () => {},
});

export default function ProfileProvider(props: { children: ReactNode }) {
  const notify = useNotificationContext();
  const { authenticationToken, doRequest } = useAuthenticationContext();
  const [user, setUser] = useState<UserProfile | undefined>(undefined);

  useEffect(() => {
    doRequest("user", "GET")
      .then(async (response) => {
        const responseBody = await response.json();
        const userProfile = parseUserProfile(responseBody);
        setUser(userProfile);
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

  const updateUser = (options: UserProfile) => {
    doRequest("user/upgister", "PUT", options)
      .then(async (response) => {
        const message = (await response.json())["data"];
        notify({ message: message, isError: false });
      })
      .catch((error) => notify({ message: error, isError: true }));
  };

  const onEvent = (action: string, payload: any) => {
    if (action === "update") setUser(parseUserProfile(payload));
  };

  return (
    <ProfileContext.Provider value={{ user, updateUser, onEvent }}>
      {props.children}
    </ProfileContext.Provider>
  );
}

export function useProfileContext() {
  return useContext(ProfileContext);
}
