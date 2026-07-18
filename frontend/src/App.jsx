import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ConnectorsPage from './pages/ConnectorsPage'
import ModelsPage from './pages/ModelsPage'
import JobsPage from './pages/JobsPage'
import LogMonitorPage from './pages/LogMonitorPage'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/connectors" replace />} />
        <Route path="/connectors" element={<ConnectorsPage />} />
        <Route path="/models" element={<ModelsPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/:jobId/logs" element={<LogMonitorPage />} />
      </Routes>
    </Layout>
  )
}
