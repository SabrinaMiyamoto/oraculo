import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import '@fontsource/montserrat';
import '@fontsource/playfair-display';
// Adicione esta linha!
import { BrowserRouter } from 'react-router-dom';
// Importe o CSS do react-datepicker se ainda não o fez aqui
import 'react-datepicker/dist/react-datepicker.css';


const theme = createTheme({
  palette: {
    primary: {
      main: '#960018',
    },
    secondary: {
      main: '#FFD700',
    },
    background: {
      default: '#171a44ff',
      paper: 'linear-gradient(to right, #0b1244ff, #040610ff)',
    },
    text: {
      primary: 'rgba(255, 255, 255, 0.9)',
    },
  },
  typography: {
    fontFamily: '"Montserrat", sans-serif',
    allVariants: {
      color: 'rgba(255, 255, 255, 0.9)',
    },
    h1: {
      fontFamily: '"Playfair Display", serif',
      fontSize: '3rem',

    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
      fontWeight: 400,
    },
  },
});


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Agora BrowserRouter estará definido */}
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);