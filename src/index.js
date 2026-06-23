import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './components/ThemeContext';
<<<<<<< HEAD
import { ToastProvider, ToastContainer } from './components/Usetoast';
=======
import { ToastProvider } from './components/Usetoast';
>>>>>>> 656ff502cab1f2fdbb0bf4277e7fcba04fabeae8

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <ThemeProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ThemeProvider>
  </BrowserRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
