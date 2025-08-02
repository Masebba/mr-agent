// src/context/ConfigContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

const ConfigContext = createContext();

export function ConfigProvider({ children }) {
  const [districts, setDistricts] = useState([]);
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    const unsubD = onSnapshot(
      collection(db, "config/districts/list"),
      (snap) => setDistricts(snap.docs.map(d => ({ id: d.id, name: d.data().name })))
    );
    const unsubP = onSnapshot(
      collection(db, "config/positions/list"),
      (snap) => setPositions(snap.docs.map(d => d.data().name))
    );
    return () => { unsubD(); unsubP(); };
  }, []);

  return (
    <ConfigContext.Provider value={{ districts, positions }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}
