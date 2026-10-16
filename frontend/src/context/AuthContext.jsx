import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // IMPORTANT:
  // We need to know whether localStorage has already been checked.
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken) {
        setToken(storedToken);
      }

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error(
            "Could not parse stored user:",
            error
          );

          localStorage.removeItem("user");
        }
      }
    } catch (error) {
      console.error(
        "Authentication initialization error:",
        error
      );
    } finally {
      // localStorage check is finished
      setAuthLoading(false);
    }
  }, []);

  const login = (loginToken, loginUser) => {
    localStorage.setItem("token", loginToken);

    if (loginUser) {
      localStorage.setItem(
        "user",
        JSON.stringify(loginUser)
      );
    }

    setToken(loginToken);
    setUser(loginUser || null);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);

    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,

        // Authentication status
        isAuthenticated: Boolean(token),

        // Whether we have finished checking localStorage
        authLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}