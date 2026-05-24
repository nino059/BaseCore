import React, { createContext, useContext, useState } from 'react';

const AuthModalContext = createContext(null);

export const AuthModalProvider = ({ children }) => {
  const [show, setShow] = useState(false);
  const [tab, setTab]   = useState('login');

  const openLogin    = () => { setTab('login');    setShow(true); };
  const openRegister = () => { setTab('register'); setShow(true); };
  const close        = () => setShow(false);

  return (
    <AuthModalContext.Provider value={{ show, tab, setTab, openLogin, openRegister, close }}>
      {children}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => useContext(AuthModalContext);
