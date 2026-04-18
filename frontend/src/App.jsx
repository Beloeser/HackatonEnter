import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom'
import HomeScreen from './pages/HomeScreen'
import LoginScreen from './pages/LoginScreen'
import CaseDetailsScreen from './pages/CaseDetailsScreen'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/dashboard" element={<HomeScreen />} />
        <Route path="/dashboard/process/:caseId" element={<CaseDetailsScreen />} />
      </Routes>
    </Router>
  )
}

export default App
