import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Search, ArrowRight, Check, Globe, DollarSign } from 'lucide-react';

// Currency and Language lists
const CURRENCIES = [
  { name: 'US Dollar', code: 'USD' },
  { name: 'Euro', code: 'EUR' },
  { name: 'British Pound', code: 'GBP' },
  { name: 'Indian Rupee', code: 'INR' },
  { name: 'Japanese Yen', code: 'JPY' },
  { name: 'Canadian Dollar', code: 'CAD' },
  { name: 'Australian Dollar', code: 'AUD' },
  { name: 'Swiss Franc', code: 'CHF' },
  { name: 'Chinese Yuan', code: 'CNY' },
  { name: 'South Korean Won', code: 'KRW' },
  { name: 'Singapore Dollar', code: 'SGD' },
  { name: 'Brazilian Real', code: 'BRL' },
  { name: 'Mexican Peso', code: 'MXN' },
  { name: 'Russian Ruble', code: 'RUB' },
  { name: 'South African Rand', code: 'ZAR' },
  { name: 'Turkish Lira', code: 'TRY' },
  { name: 'Swedish Krona', code: 'SEK' },
  { name: 'Norwegian Krone', code: 'NOK' },
  { name: 'Danish Krone', code: 'DKK' },
  { name: 'Polish Złoty', code: 'PLN' },
];

const LANGUAGES = [
  { name: 'English', code: 'en' },
  { name: 'Spanish', code: 'es' },
  { name: 'French', code: 'fr' },
  { name: 'German', code: 'de' },
  { name: 'Italian', code: 'it' },
  { name: 'Portuguese', code: 'pt' },
  { name: 'Chinese (Simplified)', code: 'zh-CN' },
  { name: 'Chinese (Traditional)', code: 'zh-TW' },
  { name: 'Japanese', code: 'ja' },
  { name: 'Korean', code: 'ko' },
  { name: 'Hindi', code: 'hi' },
  { name: 'Arabic', code: 'ar' },
  { name: 'Russian', code: 'ru' },
  { name: 'Dutch', code: 'nl' },
  { name: 'Swedish', code: 'sv' },
  { name: 'Norwegian', code: 'no' },
  { name: 'Danish', code: 'da' },
  { name: 'Finnish', code: 'fi' },
  { name: 'Polish', code: 'pl' },
  { name: 'Turkish', code: 'tr' },
  { name: 'Greek', code: 'el' },
  { name: 'Hebrew', code: 'he' },
  { name: 'Thai', code: 'th' },
  { name: 'Vietnamese', code: 'vi' },
  { name: 'Indonesian', code: 'id' },
  { name: 'Malay', code: 'ms' },
  { name: 'Filipino', code: 'fil' },
  { name: 'Bengali', code: 'bn' },
  { name: 'Urdu', code: 'ur' },
  { name: 'Persian', code: 'fa' },
  { name: 'Czech', code: 'cs' },
  { name: 'Hungarian', code: 'hu' },
  { name: 'Romanian', code: 'ro' },
  { name: 'Bulgarian', code: 'bg' },
  { name: 'Croatian', code: 'hr' },
  { name: 'Serbian', code: 'sr' },
  { name: 'Slovak', code: 'sk' },
  { name: 'Slovenian', code: 'sl' },
  { name: 'Estonian', code: 'et' },
  { name: 'Latvian', code: 'lv' },
  { name: 'Lithuanian', code: 'lt' },
];

// Backend update function
const updateUser = async (clerkUserId, updateData) => {
  const response = await fetch(`https://serverbudget.onrender.com/users/${clerkUserId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) throw new Error('Failed to update user');

  return await response.json();
};

const CurrencyLanguageSelector = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoaded) {
      console.log('User is still loading...');
      return;
    }

    if (!user) {
      console.log('No authenticated user');
      return;
    }
    
    const createUserIfNotExists = async () => {
      const clerkUserId = user?.id;
      console.log('Clerk User ID:', clerkUserId);
      
      try {
        const response = await fetch('https://serverbudget.onrender.com/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ clerkUserId }),
        });

        const data = await response.json();

        if (response.status === 201) {
          console.log('User created:', data);
        } else if (response.status === 400 && data.error === 'User already exists') {
          console.log('User already exists, skipping...');
        } else {
          console.error('Unexpected error:', data);
        }
      } catch (error) {
        console.error('Network error:', error);
      }
    };

    createUserIfNotExists();
  }, [user, isLoaded]);

  // State
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentStep, setCurrentStep] = useState('currency');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredItems =
    currentStep === 'currency'
      ? CURRENCIES.filter(
          (item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.code.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : LANGUAGES.filter(
          (item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.code.toLowerCase().includes(searchTerm.toLowerCase())
        );

  const selectedItem = currentStep === 'currency' ? selectedCurrency : selectedLanguage;

  // Save preferences handler
  const handleSavePreferences = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    const updateData = {};
    if (selectedCurrency) updateData.currency = selectedCurrency;
    if (selectedLanguage) updateData.language = selectedLanguage;

    setIsLoading(true);
    try {
      await updateUser(user.id, updateData);
      navigate('/notifications');
    } catch (err) {
      console.error('Failed to update user preferences:', err);
      setError('Failed to save preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Error Display */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl z-20 shadow-lg"
        >
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-xs">!</span>
            </div>
            <span>{error}</span>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-b border-slate-200/50 z-10 shadow-lg">
        <div className="px-6 py-4">
          {/* Progress Indicator */}
          <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-4">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all duration-300 ${
                  currentStep === 'currency'
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg'
                    : selectedCurrency
                    ? 'bg-blue-100 text-blue-600 border-2 border-blue-200'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                1
              </div>
              <div
                className={`w-12 h-1 rounded-full transition-all duration-300 ${
                  selectedCurrency ? 'bg-gradient-to-r from-blue-200 to-indigo-200' : 'bg-slate-200'
                }`}
              ></div>
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all duration-300 ${
                  currentStep === 'language'
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg'
                    : selectedLanguage
                    ? 'bg-blue-100 text-blue-600 border-2 border-blue-200'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                2
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-2">
              {currentStep === 'currency' ? (
                <DollarSign className="w-6 h-6 text-blue-600" />
              ) : (
                <Globe className="w-6 h-6 text-blue-600" />
              )}
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Welcome
              </h1>
            </div>
            <p className="text-sm text-slate-600 font-medium">
              {currentStep === 'currency'
                ? 'Choose your preferred currency'
                : 'Select your language preference'}
            </p>
          </div>

          {/* Search Input */}
          <div className="relative max-w-md mx-auto mt-4">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder={`Search ${currentStep}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
                         placeholder-slate-400 text-slate-700 shadow-sm transition-all duration-200
                         hover:bg-white/90 hover:shadow-md"
            />
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="pt-48 pb-24 px-4">
        <div className="max-w-2xl mx-auto">
          {filteredItems.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="text-slate-400 text-lg">
                No {currentStep === 'currency' ? 'currencies' : 'languages'} found matching "{searchTerm}"
              </div>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.code}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`group relative cursor-pointer transition-all duration-200 ${
                    selectedItem === item.code
                      ? 'transform scale-[1.02]'
                      : 'hover:transform hover:scale-[1.01]'
                  }`}
                  onClick={() =>
                    currentStep === 'currency'
                      ? setSelectedCurrency(item.code)
                      : setSelectedLanguage(item.code)
                  }
                >
                  <div
                    className={`relative px-6 py-5 rounded-xl border transition-all duration-200 ${
                      selectedItem === item.code
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg ring-2 ring-blue-500/20'
                        : 'bg-white/80 backdrop-blur-sm border-slate-200/50 hover:bg-white/90 hover:border-slate-300/60 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                              selectedItem === item.code
                                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg'
                                : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 group-hover:from-slate-200 group-hover:to-slate-300'
                            }`}
                          >
                            {item.code.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3
                              className={`font-semibold text-lg transition-colors ${
                                selectedItem === item.code ? 'text-blue-800' : 'text-slate-700'
                              }`}
                            >
                              {item.name}
                            </h3>
                            <p
                              className={`text-sm transition-colors ${
                                selectedItem === item.code ? 'text-blue-600' : 'text-slate-500'
                              }`}
                            >
                              {item.code}
                            </p>
                          </div>
                        </div>
                      </div>
                      {selectedItem === item.code && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg"
                        >
                          <Check className="w-5 h-5 text-white" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Info Note */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 flex items-center justify-center space-x-3 text-slate-500 text-sm bg-white/60 backdrop-blur-sm rounded-xl px-6 py-4 border border-slate-200/50"
          >
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-xs">i</span>
            </div>
            <span>You can change your {currentStep} selection anytime later</span>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200/50 z-10 shadow-2xl">
        <div className="px-6 py-6">
          <div className="max-w-2xl mx-auto flex justify-between items-center">
            {currentStep === 'language' && (
              <button
                onClick={() => setCurrentStep('currency')}
                className="px-6 py-3 text-slate-600 hover:text-slate-800 flex items-center space-x-2 transition-colors font-medium"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                <span>Back</span>
              </button>
            )}
            <div className="text-sm text-slate-600">
              {currentStep === 'currency' ? (
                selectedCurrency ? (
                  <span className="font-medium text-blue-600">
                    Selected: {CURRENCIES.find(c => c.code === selectedCurrency)?.name}
                  </span>
                ) : (
                  'Please select a currency to continue'
                )
              ) : selectedLanguage ? (
                <span className="font-medium text-blue-600">
                  Selected: {LANGUAGES.find(l => l.code === selectedLanguage)?.name}
                </span>
              ) : (
                'Please select a language to continue'
              )}
            </div>
            <button
              onClick={
                currentStep === 'currency'
                  ? () => setCurrentStep('language')
                  : handleSavePreferences
              }
              disabled={
                (currentStep === 'currency' && !selectedCurrency) ||
                (currentStep === 'language' && !selectedLanguage) ||
                isLoading
              }
              className={`
                px-8 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all duration-200
                ${(currentStep === 'currency' && selectedCurrency) || (currentStep === 'language' && selectedLanguage)
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>{currentStep === 'currency' ? 'Continue' : 'Save Preferences'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencyLanguageSelector;