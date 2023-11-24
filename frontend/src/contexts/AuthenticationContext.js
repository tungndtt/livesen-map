import { createContext, useState, useContext } from "react";

const AuthenticationContext = createContext({
  authenticationToken: "",
  signIn: (_email, _password) => new Promise({}),
  signUp: (_email, _password, _name, _address, _company_name, _company_size) =>
    new Promise({}),
  signOut: () => {},
});

export default function AuthenticationProvider({ children }) {
  const [authenticationToken, setAuthenticationToken] = useState(
    localStorage.getItem("authentication_token") ?? "test"
  );
  const serverUrl = process.env.REACT_APP_SERVER_URL;

  const signIn = (
    email,
    password,
    name,
    address,
    company_name,
    company_size
  ) => {
    new Promise((resolve, reject) => {
      fetch(`${serverUrl}/authentication/sign_in`, {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          name,
          address,
          company_name,
          company_size,
        }),
      })
        .then(async (response) => {
          const responseBody = await response.json();
          const data = responseBody["data"];
          if (response.ok) {
            setAuthenticationToken(data);
            resolve("Successfully login");
          } else {
            reject(data);
          }
        })
        .catch((error) => reject(error));
    });
  };

  const signUp = (email, password) => {
    new Promise((resolve, reject) => {
      fetch(`${serverUrl}/authentication/sign_up`, {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: { email, password },
      })
        .then(async (response) => {
          const responseBody = await response.json();
          const data = responseBody["data"];
          if (response.ok) {
            resolve(data);
          } else {
            reject(data);
          }
        })
        .catch((error) => reject(error));
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
      {children}
    </AuthenticationContext.Provider>
  );
}

export function useAuthenticationContext() {
  return useContext(AuthenticationContext);
}
