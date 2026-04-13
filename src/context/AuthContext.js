import React, { createContext, useState, useEffect } from "react";
import { auth, firestore } from "../firebase";

// Create context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // holds user data including role
  const [loading, setLoading] = useState(true); // for initial auth check

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await firestore.collection("users").doc(firebaseUser.uid).get();
          if (userDoc.exists) {
            setUser({ uid: firebaseUser.uid, ...userDoc.data() });
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
