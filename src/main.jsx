import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'taipei-sans-tc';
import 'taipei-sans-tc/dist/Light/TaipeiSansTCBeta-Light.css';
import 'taipei-sans-tc/dist/Bold/TaipeiSansTCBeta-Bold.css';
import './custom.scss'
import './index.css'

import { ThemeProvider } from './context/ThemeContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
) 