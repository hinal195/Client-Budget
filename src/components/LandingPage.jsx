import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Spline from '@splinetool/react-spline';
import { 
  Heart, 
  ArrowRight, 
  Mail, 
  Shield, 
  Zap, 
  Users, 
  User, 
  TrendingUp, 
  DollarSign, 
  PieChart,
  Smartphone,
  Globe,
  Lock,
  Star
} from 'lucide-react';
import { SignInButton, SignOutButton, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

// Feature Card Component
const FeatureCard = ({ icon: Icon, title, description, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    viewport={{ once: true }}
    className="group relative overflow-hidden bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="relative">
      <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2 text-center">{title}</h3>
      <p className="text-gray-300 text-center text-sm leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

// Stats Component
const StatCard = ({ number, label, icon: Icon }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    whileInView={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    viewport={{ once: true }}
    className="text-center"
  >
    <div className="flex items-center justify-center mb-2">
      <Icon className="w-6 h-6 text-blue-400 mr-2" />
      <span className="text-3xl font-bold text-white">{number}</span>
    </div>
    <p className="text-gray-400 text-sm">{label}</p>
  </motion.div>
);

const LandingPage = () => {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    // Redirect signed-in users to language selection
    if (isSignedIn) {
      navigate('/');
    }
  }, [isSignedIn, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQ4MCIgaGVpZ2h0PSI2NTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+ICAgIDxwYXRoIGQ9Ik03MzEuMjA3IDY0OS44MDJDOTM1LjQ4NCA2NDkuODAyIDExMDIuMzggNTA1LjQyNSAxMTAyLjM4IDMyOC4wMDFDMTEwMi4zOCAxNTAuNTc4IDkzNS40ODQgNi4yMDAsNjg3MzEuMjA3IDYuMjAwNjhDNTI2LjkzIDYuMjAwNjhDMzYwLjAzNCAxNTAuNTc4IDM2MC4wMzQgMzI4LjAwMTM2MC4wMzQgNTA1LjQyNSA1MjYuOTMgNjQ5LjgwMiA3MzEuMjA3IDY0OS44MDJaIiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPiAgICA8cGF0aCBkPSJNNTkyLjIwNyA2NDkuODAyQzY5Ni40ODQgNjQ5LjgwMiA4NjMuMzggNTA1LjQyNSA4NjMuMzggMzI4LjAwMUM4NjMuMzggMTUwLjU3OCA2OTYuNDg0IDYuMjAwNjg0OTIuMjA3IDYuMjAwNjhDMjg3LjkzIDYuMjAwNjgxMjEuMDM0IDE1MC41NzggMTIxLjAzNCAzMjguMDAxQzEyMS4wMzQgNTA1LjQyNSAyODcuOTMgNjQ5LjgwMiA0OTIuMjA3IDY0OS44MDJaIiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')] bg-cover opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center p-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-3"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            MyMoney
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-4"
        >
          {!isSignedIn ? (
            <SignInButton mode="modal">
              <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg">
                Sign In
              </button>
            </SignInButton>
          ) : (
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => navigate('/language')}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Dashboard
              </button>
              <SignOutButton>
                <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all duration-300">
                  Sign Out
                </button>
              </SignOutButton>
            </div>
          )}
        </motion.div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-8"
            >
              <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm mb-6">
                <Star className="w-4 h-4 mr-2" />
                Trusted by 10,000+ users worldwide
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
            >
              Your AI-Powered
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Financial Companion
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl text-gray-300 mb-8 leading-relaxed"
            >
              Experience the future of personal finance with AI-driven insights, 
              secure transactions, and intelligent budgeting that adapts to your lifestyle.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              {!isSignedIn ? (
                <SignInButton mode="modal">
                  <button className="group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl">
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                    <div className="relative flex items-center space-x-2">
                      <User className="w-5 h-5" />
                      <span className="text-lg font-semibold">Get Started Free</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </button>
                </SignInButton>
              ) : (
                <button 
                  onClick={() => navigate('/language')}
                  className="group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 transform hover:scale-105 shadow-xl"
                >
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                  <div className="relative flex items-center space-x-2">
                    <span className="text-lg font-semibold">Go to Dashboard</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </button>
              )}
              
              <button className="px-8 py-4 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-all duration-300 transform hover:scale-105">
                <span className="text-lg font-semibold">By Tanay</span>
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="grid grid-cols-3 gap-6 mt-12"
            >
              <StatCard number="10K+" label="Active Users" icon={Users} />
              <StatCard number="99.9%" label="Uptime" icon={Shield} />
              <StatCard number="24/7" label="Support" icon={Globe} />
            </motion.div>
          </motion.div>

          {/* Right Spline 3D Scene */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="h-96 lg:h-[500px] relative overflow-hidden rounded-2xl spline-container"
            style={{
              background: 'transparent'
            }}
          >
            <div 
              className="w-full h-full spline-container"
              style={{
                background: 'transparent',
                borderRadius: '1rem',
                overflow: 'hidden',
                clipPath: 'inset(0 0 80px 0)'
              }}
              
            >
              <Spline 
                scene="https://prod.spline.design/1jjCpBDo0ZRVRRag/scene.splinecode"
                className="spline-container"
                style={{
                  background: 'transparent',
                  width: '100%',
                  height: '100%',
                  borderRadius: '1rem',
                  overflow: 'hidden'
                }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Why Choose <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">MyMoney</span>?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Discover the features that make MyMoney the ultimate financial management platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={Zap}
              title="AI-Powered Insights"
              description="Get intelligent financial recommendations and spending analysis powered by advanced AI algorithms."
              color="from-blue-500 to-blue-600"
              delay={0.1}
            />
            <FeatureCard
              icon={Shield}
              title="Bank-Level Security"
              description="Your data is protected with enterprise-grade encryption and multi-factor authentication."
              color="from-green-500 to-green-600"
              delay={0.2}
            />
            <FeatureCard
              icon={TrendingUp}
              title="Smart Analytics"
              description="Visualize your financial health with interactive charts and real-time performance tracking."
              color="from-purple-500 to-purple-600"
              delay={0.3}
            />
            <FeatureCard
              icon={DollarSign}
              title="Budget Management"
              description="Create and track budgets with automatic categorization and spending alerts."
              color="from-emerald-500 to-emerald-600"
              delay={0.4}
            />
            <FeatureCard
              icon={Smartphone}
              title="Mobile First"
              description="Access your finances anywhere with our responsive mobile-optimized interface."
              color="from-pink-500 to-pink-600"
              delay={0.5}
            />
            <FeatureCard
              icon={Lock}
              title="Privacy Focused"
              description="Your financial data stays private with end-to-end encryption and zero-knowledge architecture."
              color="from-indigo-500 to-indigo-600"
              delay={0.6}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-white/20 rounded-3xl p-12"
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Financial Life?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of users who have already taken control of their finances with MyMoney.
            </p>
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button className="group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl">
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                  <div className="relative flex items-center space-x-2">
                    <span className="text-lg font-semibold">Start Your Journey Today</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </button>
              </SignInButton>
            ) : (
              <button 
                onClick={() => navigate('/')}
                className="group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                <div className="relative flex items-center space-x-2">
                  <span className="text-lg font-semibold">Continue to Dashboard</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </button>
            )}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              MyMoney
            </div>
          </div>
          <p className="text-gray-400 mb-4">
            © 2024 MyMoney. All rights reserved. Your financial future starts here.
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors duration-300">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors duration-300">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors duration-300">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 