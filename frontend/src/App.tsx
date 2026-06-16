import React from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './screens/Login'
import Dashboard from './screens/Dashboard'
import Clients from './screens/Clients'
import ClientDetail from './screens/ClientDetail'
import Properties from './screens/Properties'
import PropertyDetail from './screens/PropertyDetail'
import Deals from './screens/Deals'
import Selections from './screens/Selections'
import PublicSelection from './screens/PublicSelection'
import InstagramPage from './screens/Instagram'

function Guard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/s/:token" element={<PublicSelection />} />
          <Route
            path="/*"
            element={
              <Guard>
                <Layout>
                  <Routes>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="clients" element={<Clients />} />
                    <Route path="clients/:id" element={<ClientDetail />} />
                    <Route path="properties" element={<Properties />} />
                    <Route path="properties/:id" element={<PropertyDetail />} />
                    <Route path="deals" element={<Deals />} />
                    <Route path="selections" element={<Selections />} />
                    <Route path="instagram" element={<InstagramPage />} />
                  </Routes>
                </Layout>
              </Guard>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
