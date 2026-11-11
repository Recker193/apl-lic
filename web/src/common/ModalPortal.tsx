import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Randează conținutul (modale, overlay-uri) direct în <body>, în afara arborelui
 * paginii curente. Astfel `position: fixed` se raportează la viewport și nu mai
 * este influențat de strămoși cu `transform`, `filter` sau `contain`
 * (animații de intrare, carduri cu hover, containere derulate etc.), care ar
 * deveni "containing block" și ar muta modalul în afara ecranului.
 */
export const ModalPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(children, document.body);
};
