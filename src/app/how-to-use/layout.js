import React from 'react';
import HowToUseHeader from './howToUseHeader';

function HowToUseLayout({ children }) {
  return (
    <>
      <HowToUseHeader />
      {children}
    </>
  );
}

export default HowToUseLayout;

