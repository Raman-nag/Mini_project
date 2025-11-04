import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Buffer } from 'buffer'
import App from './App.jsx'
import './styles/globals.css'
import './styles/variables.css'
import './styles/animations.css'
import './styles/components/cards.css'
import './styles/components/dashboard.css'
import './styles/components/forms.css'

// Polyfill for buffer (needed for ethers.js)
window.Buffer = Buffer
globalThis.Buffer = Buffer

// Context providers
import { ThemeProvider } from './contexts/ThemeContext'
import { Web3Provider } from './contexts/Web3Context'
import { AuthProvider } from './contexts/AuthContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
        <Web3Provider>
          {/* Router must wrap any provider that uses useNavigate/useLocation */}
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </Web3Provider>
      </ThemeProvider>
  </React.StrictMode>,
)
