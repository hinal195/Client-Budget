import { useEffect, useState } from "react";
import { Bell, ArrowLeft, ArrowRight, Shield, Zap, Users } from "lucide-react";
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Update user function
const updateUser = async (clerkUserId, updateData) => {
  const response = await fetch(`https://serverbudget.onrender.com/users/${clerkUserId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  });

  if (!response.ok) throw new Error('Failed to update user');

  return await response.json();
};

const ReminderSettings = () => {
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const clerkUserId = user?.id;

  // Load initial notification setting when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      if (!clerkUserId) return;

      try {
        const response = await fetch(`https://serverbudget.onrender.com/users/${clerkUserId}`);
        if (!response.ok) throw new Error("Failed to fetch user data");

        const userData = await response.json();
        setIsNotificationEnabled(userData.notificationSetting || false);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [clerkUserId]);

  // Handle toggle change and send to backend
  const handleToggleChange = async (checked) => {
    setIsNotificationEnabled(checked);
    setIsLoading(true);

    try {
      await updateUser(clerkUserId, { notificationSetting: checked });
      console.log("Notification setting updated successfully");
    } catch (err) {
      console.error("Failed to update notification setting", err);
      setIsNotificationEnabled(prev => !prev); // revert on failure
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-b border-slate-200/50 z-10 shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Notifications
            </h1>
          </div>
          <p className="text-center text-slate-600 font-medium text-sm">
            Customize your notification preferences
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-24 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 text-center mb-2">Smart Reminders</h3>
              <p className="text-slate-600 text-sm text-center">Get timely notifications for your daily expenses</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 text-center mb-2">Privacy First</h3>
              <p className="text-slate-600 text-sm text-center">Your data is encrypted and secure</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 text-center mb-2">Community</h3>
              <p className="text-slate-600 text-sm text-center">Join thousands of users worldwide</p>
            </motion.div>
          </div>

          {/* Main Question Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-2xl p-8 mb-8"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Bell className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3">
                Daily Expense Reminders
              </h2>
              <p className="text-slate-600 text-lg">
                Get reminded every day at 9:00 PM to add your expenses
              </p>
            </div>

            {/* Toggle Section */}
            <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-xl border border-slate-200/50">
              <div className="flex-1">
                <label htmlFor="toggle" className="text-lg font-semibold text-slate-800 cursor-pointer">
                  Enable Daily Reminders
                </label>
                <p className="text-slate-600 mt-1">
                  Receive notifications to help you stay on track with your financial goals
                </p>
              </div>
              
              {/* Custom Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer ml-6">
                <input
                  type="checkbox"
                  id="toggle"
                  className="sr-only peer"
                  checked={isNotificationEnabled}
                  onChange={(e) => handleToggleChange(e.target.checked)}
                  disabled={isLoading || !isLoaded}
                />
                <div
                  className={`w-16 h-9 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-indigo-600 shadow-inner ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                ></div>
                {isLoading && (
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-10">
                    <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                )}
              </label>
            </div>
          </motion.div>

          {/* Info Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50 p-6"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-semibold">i</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Why Enable Reminders?</h3>
                <p className="text-slate-700 leading-relaxed">
                  Daily reminders help you maintain consistent financial tracking habits. 
                  You can always change this setting later in your preferences. 
                  Notifications are sent at 9:00 PM to help you reflect on your day's spending.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200/50 z-10 shadow-2xl">
        <div className="px-6 py-6">
          <div className="max-w-2xl mx-auto flex justify-between items-center">
            <button
              className="px-6 py-3 text-slate-600 hover:text-slate-800 font-semibold hover:bg-slate-50 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              onClick={() => navigate(-1)}
              disabled={isLoading}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            
            <button
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              onClick={() => navigate('/transaction')}
              disabled={isLoading}
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReminderSettings;