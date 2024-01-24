import { ReactNode, createContext, useState, useContext } from "react";
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
};

const AuthenticationContext = createContext<AuthenticationContextType>({
  authenticationToken: "",
  signIn: (_email: string, _password: string) => new Promise<string>(() => {}),
  signUp: (_email: string, _password: string, _options: UserProfile) =>
    new Promise<string>(() => {}),
  signOut: () => {},
});

export default function AuthenticationProvider(props: { children: ReactNode }) {
  const [authenticationToken, setAuthenticationToken] = useState(
    localStorage.getItem("authentication_token") ??
      process.env.REACT_APP_IS_TESTING?.toLowerCase() === "true"
      ? "test"
      : ""
  );
  const serverUrl = process.env.REACT_APP_SERVER_URL + "/authentication";

  const signIn = (email: string, password: string) => {
    return new Promise<string>((resolve, reject) => {
      fetch(`${serverUrl}/sign_in`, {
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
      fetch(`${serverUrl}/sign_up`, {
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

  const signOut = () => setAuthenticationToken("");

  return (
    <AuthenticationContext.Provider
      value={{
        authenticationToken,
        signIn,
        signUp,
        signOut,
      }}
    >
      {props.children}
    </AuthenticationContext.Provider>
  );
}

export function useAuthenticationContext() {
  return useContext(AuthenticationContext);
}
