import React, { FC } from 'react'
import { themeType } from './Themes';
import { toggleDarkModeType } from './useDarkMode';
import Button from './Button';

const Toggle: FC<{ theme: themeType, toggleTheme: toggleDarkModeType }> = ({ toggleTheme }) => {
  return (
    <Button onClick={toggleTheme} >
      Switch Theme
    </Button>
  );
};

export default Toggle;
