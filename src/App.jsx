import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./assets/database/authcontext";
import ProtectedRoute from "./assets/components/ProtectedRoute"; 
import Login from './assets/components/Login'
import Encabezado from "./assets/components/Encabezado";
import Inicio from "./assets/components/Inicio";

import './App.css'

function App() {

  return (
    <>
      <AuthProvider>
        <Router>
          <div className="App">
            <Encabezado />
            <main>
              <Routes>
                
                <Route path="/" element={<Login />} />
                <Route path="/inicio" element={<ProtectedRoute element={<Inicio />} />} />

              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </>
  )
}

export default App
