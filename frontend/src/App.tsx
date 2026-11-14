import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ThemeToggle from './components/ThemeToggle'
import { Spinner } from './components/ui'
import { useAuth } from './lib/auth'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Join from './pages/Join'
import JoinSuccess from './pages/JoinSuccess'
import WhyJoin from './pages/WhyJoin'
import About from './pages/About'
import Contact from './pages/Contact'
import ContactManagement from './pages/ContactManagement'
import Dashboard from './pages/Dashboard'
import Tree from './pages/Tree'
// Products feature temporarily disabled
// import Products from './pages/Products'
import Transactions from './pages/Transactions'
import Leaderboard from './pages/Leaderboard'
import Payouts from './pages/Payouts'
import PointsCalculator from './pages/PointsCalculator'
import Users from './pages/Users'
import Profile from './pages/Profile'
import ChangePassword from './pages/ChangePassword'

function Protected() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-md items-center px-4">
        <div className="w-full"><Spinner label="Checking session…" /></div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <Layout />
}

export default function App() {
  return (
    <>
      <ThemeToggle />
      <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/why-join" element={<WhyJoin />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/join" element={<Join />} />
      <Route path="/join-success" element={<JoinSuccess />} />

      <Route element={<Protected />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tree" element={<Tree />} />
        {/* Products feature temporarily disabled */}
        {/* <Route path="/products" element={<Products />} /> */}
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/payouts" element={<Payouts />} />
        <Route path="/calculator" element={<PointsCalculator />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/users" element={<Users />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/contact-management" element={<ContactManagement />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  )
}
