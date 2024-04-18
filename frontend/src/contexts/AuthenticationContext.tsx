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
  resetPassword: (email: string, password: string) => Promise<string>;
  verify: (
    verificationToken: string,
    type: "sign_up" | "reset_password"
  ) => Promise<string>;
  doRequest: (
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    payload?: any,
    isBlob?: boolean
  ) => Promise<Response>;
};

const AuthenticationContext = createContext<AuthenticationContextType>({
  authenticationToken: "",
  signIn: async () => "",
  signUp: async () => "",
  signOut: () => {},
  resetPassword: async () => "",
  verify: async () => "",
  doRequest: async () => new Response(),
});

export default function AuthenticationProvider(props: { children: ReactNode }) {
  const [authenticationToken, setAuthenticationToken] = useState(
    localStorage.getItem("authentication_token")
      ? (localStorage.getItem("authentication_token") as string)
      : process.env.REACT_APP_IS_TESTING?.toLowerCase() === "true"
      ? "test"
      : ""
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
        .catch((error) => reject(error));
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
        .catch((error) => reject(error));
    });
  };

  const signOut = () => {
    setAuthenticationToken("");
    localStorage.setItem("authentication_token", "");
  };

  const resetPassword = (email: string, password: string) => {
    return new Promise<string>((resolve, reject) => {
      fetch(`${serverUrl}/authentication/reset_password`, {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify({ email, password }),
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

  const verify = (
    verificationToken: string,
    type: "sign_up" | "reset_password"
  ) => {
    return new Promise<string>((resolve, reject) => {
      fetch(`${serverUrl}/authentication/verification`, {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify({ verification_token: verificationToken, type }),
      })
        .then(async (response) => {
          const data = (await response.json())["data"];
          if (response.ok) resolve(data);
          else reject(data);
        })
        .catch((error) => reject(error));
    });
  };

  const doRequest = (
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    payload?: any,
    isBlob?: boolean
  ) => {
    let headers = { "Auth-Token": authenticationToken } as Record<
      string,
      string
    >;
    return new Promise<Response>((resolve, reject) => {
      if (!authenticationToken)
        reject("No authentication token to communicate with server");
      let body = undefined as BodyInit | undefined;
      if (payload) {
        if (isBlob) {
          body = payload;
        } else {
          headers["Content-Type"] = "application/json";
          body = JSON.stringify(payload);
        }
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
        .catch((error) => reject(error));
    });
  };

  return (
    <AuthenticationContext.Provider
      value={{
        authenticationToken,
        signIn,
        signUp,
        signOut,
        resetPassword,
        verify,
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
