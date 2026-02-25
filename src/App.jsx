import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

import Analytics from './components/Analytics';
import CurrencyLanguageSelector from "./components/Language"
import Notifications from "./components/Notifications"
import Transaction from "./components/Transaction"
import Budget from './components/Budget';
import Ai from './components/Ai';
import Loading from './sign/Loading';
import AuthComponent from './sign/AuthComponent';
import SsoCallback from './sign/Ssocallback';
import SplitWiseApp from './components/Splitwise';
import LandingPage from './components/LandingPage';
// const genAI = new GoogleGenerativeAI("AIzaSyCuSzw7t7WNhe3qkJEvEq9ltIbSdTPklpI")
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
};

function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/sign-in" element={<AuthComponent />} />
          <Route path="/sign-up" element={<AuthComponent />} />
          <Route path="/sso-callback" element={<SsoCallback />} />
          <Route path="/loading" element={<Loading />} />
          
          {/* Protected routes */}
          <Route path="/language" element={
            <ProtectedRoute>
              <CurrencyLanguageSelector />
            </ProtectedRoute>
          } />
          
          <Route path="/analytics" element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          } />
          
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } />
          
          <Route path="/transaction" element={
            <ProtectedRoute>
              <Transaction />
            </ProtectedRoute>
          } />
          
          <Route path="/budget" element={
            <ProtectedRoute>
              <Budget />
            </ProtectedRoute>
          } />
          
          <Route path="/splitwise" element={
            <ProtectedRoute>
              <SplitWiseApp />
            </ProtectedRoute>
          } />
          
          <Route path="/ai" element={
            <ProtectedRoute>
              <Ai />
            </ProtectedRoute>
          } />
          
          {/* Default redirects */}
          <Route path="*" element={<Navigate to="/language" replace />} />
        </Routes>
      </Router>
    </ClerkProvider>
  );
}

export default App;
