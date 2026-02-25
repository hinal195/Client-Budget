import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const SsoCallback = () => {
  const navigate = useNavigate();
  const { handleRedirectCallback } = useAuth();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [error, setError] = useState('');

  useEffect(() => {
    const completeAuth = async () => {
      try {
        setStatus('loading');
        await handleRedirectCallback();
        setStatus('success');
        
        // Small delay to show success state
        setTimeout(() => {
          navigate('/language');
        }, 1000);
      } catch (error) {
        console.error('Error handling redirect callback:', error);
        setStatus('error');
        setError('Authentication failed. Please try again.');
        
        // Redirect to sign-in after error
        setTimeout(() => {
          navigate('/sign-in');
        }, 3000);
      }
    };

    completeAuth();
  }, [handleRedirectCallback, navigate]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-6"
            >
              <Loader2 className="w-full h-full text-blue-500" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">Completing Authentication</h2>
            <p className="text-gray-400">Please wait while we complete your sign-in...</p>
          </div>
        );
      
      case 'success':
        return (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 mx-auto mb-6"
            >
              <CheckCircle className="w-full h-full text-green-500" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">Authentication Successful!</h2>
            <p className="text-gray-400">Redirecting you to the dashboard...</p>
          </div>
        );
      
      case 'error':
        return (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 mx-auto mb-6"
            >
              <AlertCircle className="w-full h-full text-red-500" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">Authentication Failed</h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Redirecting to sign-in page...</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-12 max-w-md w-full">
        {renderContent()}
      </div>
    </div>
  );
};

export default SsoCallback;
