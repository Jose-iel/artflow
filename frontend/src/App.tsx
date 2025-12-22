import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Layout } from '@/components/Layout'
import { DashboardRouter } from '@/components/DashboardRouter'
import { UsersManagement } from '@/components/UsersManagement'
import { Profile } from '@/components/Profile'
import { CreatePostPage } from '@/components/CreatePostPage'
import { EditPostPage } from '@/components/EditPostPage'
import { LoginForm } from '@/components/LoginForm'
import { RegisterForm } from '@/components/RegisterForm'

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        
        {/* Protected routes with persistent Layout using Outlet */}
        <Route element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="/" element={<DashboardRouter />} />
          <Route path="/dashboard" element={<DashboardRouter />} />
          <Route path="/admin/users" element={<UsersManagement />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/posts/create" element={<CreatePostPage />} />
          <Route path="/posts/edit/:id" element={<EditPostPage />} />
          <Route 
            path="*" 
            element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900">404</h1>
                  <p className="mt-2 text-gray-600">Página não encontrada</p>
                </div>
              </div>
            } 
          />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
