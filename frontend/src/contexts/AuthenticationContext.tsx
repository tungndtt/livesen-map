import { ReactNode, createContext, useState, useContext } from "react";
import { useNotificationContext } from "./NotificationContext";
import { UserProfile } from "../types/profile";

type AuthenticationContextType = {
  authenticationToken: string;
  signIn: (email: string, password: string) => Promise<string>;
  signUp: (
    email: string,
    password: string,
    options: UserProfile
  ) => Promise<string>;
  signOut: () => void;
  doRequest: (
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    payload?: any
  ) => Promise<Response>;
};

const AuthenticationContext = createContext<AuthenticationContextType>({
  authenticationToken: "",
  signIn: (_email: string, _password: string) => new Promise<string>(() => {}),
  signUp: (_email: string, _password: string, _options: UserProfile) =>
    new Promise<string>(() => {}),
  signOut: () => {},
  doRequest: (
    _endpoint: string,
    _method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    _payload?: any
  ) => new Promise<Response>(() => {}),
});

export default function AuthenticationProvider(props: { children: ReactNode }) {
  const notify = useNotificationContext();
  const [authenticationToken, setAuthenticationToken] = useState(
    localStorage.getItem("authentication_token") ??
      (process.env.REACT_APP_IS_TESTING?.toLowerCase() === "true" ? "test" : "")
  );
  const serverUrl = process.env.REACT_APP_SERVER_URL;

  const signIn = (email: string, password: string) => {
    return new Promise<string>((resolve, reject) => {
      fetch(`${serverUrl}/authentication/sign_in`, {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify({ email, password }),
      })
        .then(async (response) => {
          const responseBody = await response.json();
          const data = responseBody["data"];
          if (response.ok) {
            setAuthenticationToken(data);
            localStorage.setItem("authentication_token", data);
            resolve("Successfully login");
          } else {
            reject(data);
          }
        })
        .catch((error) => reject(error.message));
    });
  };

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
        .catch((error) => reject(error.message));
    });
  };

  const signOut = () => {
    setAuthenticationToken("");
    localStorage.setItem("authentication_token", "");
  };

  const doRequest = (
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    payload?: any
  ) => {
    let headers = { "Auth-Token": authenticationToken } as Record<
      string,
      string
    >;
    return new Promise<Response>((resolve, reject) => {
      if (!authenticationToken) reject(undefined);
      let body = undefined as BodyInit | undefined;
      if (payload) {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(payload);
      }
      fetch(`${serverUrl}/${endpoint}`, { headers, method, body })
        .then(async (response) => {
          if (response.ok) {
            resolve(response);
          } else {
            let errorMessage = undefined;
            try {
              errorMessage = (await response.json())?.["data"];
            } catch (e) {}
            if (response.status === 401) {
              signOut();
              errorMessage = "Access token is outdated";
            }
            reject(errorMessage);
          }
        })
        .catch((error) => reject(error.message));
    });
  };

  return (
    <AuthenticationContext.Provider
      value={{
        authenticationToken,
        signIn,
        signUp,
        signOut,
        doRequest,
      }}
    >
      {props.children}
    </AuthenticationContext.Provider>
  );
}

export function useAuthenticationContext() {
  return useContext(AuthenticationContext);
}
