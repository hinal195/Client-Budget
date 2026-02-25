import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Bot, User, TrendingUp, TrendingDown, DollarSign,
  BarChart3, Brain, Sparkles, AlertCircle, MessageSquare, Zap, Target, PiggyBank,
  LayoutDashboard
} from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Calculator, CreditCard, FolderOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyBHSqIYcjAu1IfQfbT7W2-shVsu2vkwx1M';

const renderMarkdown = (text) => {
  if (!text) return '';

  // Convert **bold** to <strong>
  let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert *italic* to <em>
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // Handle tables
  const tableRegex = /\|.*\|[\r\n]*\|[-:|]+\|[\r\n]*(\|.*\|[\r\n]*)*/g;
  html = html.replace(tableRegex, (match) => {
    const rows = match.trim().split('\n');
    const headerRow = rows[0];
    const separatorRow = rows[1];
    const dataRows = rows.slice(2);

    // Build table HTML
    let tableHtml = '<table class="min-w-full border-collapse mb-4">';
    
    // Table headers
    tableHtml += '<thead><tr>';
    headerRow.split('|').slice(1, -1).forEach(cell => {
      tableHtml += `<th class="border border-slate-300 px-3 py-2 bg-slate-50">${cell.trim()}</th>`;
    });
    tableHtml += '</tr></thead>';

    // Table body
    tableHtml += '<tbody>';
    dataRows.forEach(row => {
      tableHtml += '<tr>';
      row.split('|').slice(1, -1).forEach(cell => {
        tableHtml += `<td class="border border-slate-300 px-3 py-2">${cell.trim()}</td>`;
      });
      tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table>';
    
    return tableHtml;
  });

  return html;
};

const FinancialAIChatbot = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const clerkUserId = user?.id;

  const [financialData, setFinancialData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showInitialAnalysis, setShowInitialAnalysis] = useState(true);
  const [error, setError] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Process daily transactions into income/expenses
  const processTransactions = (dailyTransactions = []) => {
    const allTransactions = dailyTransactions.flatMap(day => 
      Array.isArray(day.transactions) ? day.transactions : []
    );
    
    return {
      all: allTransactions,
      income: allTransactions.filter(t => t.type === 'INCOME'),
      expenses: allTransactions.filter(t => t.type === 'EXPENSE')
    };
  };

  // Fetch financial data
  useEffect(() => {
    const fetchFinancialData = async () => {
      if (!clerkUserId) {
        setIsLoadingData(false);
        return;
      }

      try {
        const response = await fetch('https://serverbudget.onrender.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ clerkUserId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const userData = await response.json();
        
        // Validate and normalize data
        const normalizedData = {
          ...userData,
          dailyTransactions: Array.isArray(userData.dailyTransactions) 
            ? userData.dailyTransactions 
            : [],
          budget: Array.isArray(userData.budget) 
            ? userData.budget 
            : []
        };

        setFinancialData(normalizedData);
        console.log('Processed financial data:', normalizedData);
        setError('');
      } catch (error) {
        console.error('Error fetching financial data:', error);
        setError(error.message || 'Failed to load financial data. Please try again.');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchFinancialData();
  }, [clerkUserId]);

  // Generate financial context for AI
  const generateFinancialContext = () => {
    if (!financialData) return '';
    
    // Process transactions
    const { income, expenses } = processTransactions(financialData.dailyTransactions);
    
    // Calculate totals
    const totalIncome = income.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + (t.amount || 0), 0);
    const budgetItems = Array.isArray(financialData.budget) ? financialData.budget : [];

    // Format budget data
    const budgetSummary = budgetItems.map(b => 
      `- ${b.category}: ₹${b.budget} (Current: ₹${b.CurrentAmount || 0})`
    ).join('\n');

    // Format recent transactions
    const recentTransactions = [...income, ...expenses]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)
      .map(t => 
        `${new Date(t.date).toLocaleDateString()}: ${t.category} - ₹${t.amount} (${t.type})`
      ).join('\n');

    return `
You are a financial advisor AI. Analyze the following data and answer the user's question accurately and concisely.

USER PROFILE:
- Name: ${financialData.name || 'User'}
- Email: ${financialData.email || 'Not provided'}

FINANCIAL SUMMARY:
- Total Income: ₹${totalIncome}
- Total Expenses: ₹${totalExpenses}
- Net Balance: ₹${totalIncome - totalExpenses}

BUDGET CATEGORIES:
${budgetSummary || 'No budgets found'}

RECENT TRANSACTIONS:
${recentTransactions || 'No transactions found'}

Answer the user's question based on this data. Be conversational, supportive, and practical.
`;
  };

  // Call Gemini API
  const callAIAPI = async (userMessage) => {
    const financialContext = generateFinancialContext();
    const fullPrompt = `${financialContext}\n\nUser Question: ${userMessage}`;

    try {
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: fullPrompt
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Invalid response format from AI API');
      }
    } catch (error) {
      console.error('Error calling AI API:', error);
      throw error;
    }
  };

  // Generate initial insights
  const generateInitialInsights = () => {
    if (!financialData) return [];

    const { income, expenses } = processTransactions(financialData.dailyTransactions);
    const totalIncome = income.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + (t.amount || 0), 0);
    const netBalance = totalIncome - totalExpenses;

    const insights = [];

    // Spending pattern insight
    if (totalExpenses > 0) {
      const topCategory = expenses.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});
      const maxCategory = Object.entries(topCategory).sort(([,a], [,b]) => b - a)[0];
      
      insights.push({
        icon: <Target className="w-5 h-5 text-blue-600" />,
        title: 'Top Spending Category',
        description: `Your highest expense is ${maxCategory[0]} at ₹${maxCategory[1].toLocaleString()}`
      });
    }

    // Savings insight
    if (netBalance > 0) {
      insights.push({
        icon: <PiggyBank className="w-5 h-5 text-green-600" />,
        title: 'Positive Cash Flow',
        description: `Great job! You're saving ₹${netBalance.toLocaleString()} this month`
      });
    } else if (netBalance < 0) {
      insights.push({
        icon: <AlertCircle className="w-5 h-5 text-red-600" />,
        title: 'Negative Cash Flow',
        description: `You're spending ₹${Math.abs(netBalance).toLocaleString()} more than you earn`
      });
    }

    // Income insight
    if (totalIncome > 0) {
      insights.push({
        icon: <TrendingUp className="w-5 h-5 text-green-600" />,
        title: 'Income Tracking',
        description: `You've recorded ₹${totalIncome.toLocaleString()} in income this month`
      });
    }

    return insights;
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // Add user message
    setMessages(prev => [...prev, {
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    setIsLoading(true);

    try {
      const aiResponse = await callAIAPI(userMessage);
      
      setMessages(prev => [...prev, {
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setMessages(prev => [...prev, {
        type: 'ai',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Start chat with initial message
  const startChat = () => {
    setShowInitialAnalysis(false);
    const { income, expenses } = processTransactions(financialData.dailyTransactions);
    const totalIncome = income.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    setMessages([
      {
        type: 'ai',
        content: `Hello ${financialData?.name || 'there'}! I've analyzed your financial data. You've earned ₹${totalIncome.toLocaleString()} and spent ₹${totalExpenses.toLocaleString()} this month. I can help you understand spending patterns, suggest savings strategies, or answer any questions about your finances. What would you like to explore?`,
        timestamp: new Date()
      }
    ]);
  };

  // Loading state
  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your financial data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !financialData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl transition-all duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-b border-slate-200/50 z-10 shadow-lg">
        <div className="px-6 py-2">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              AI Financial Assistant
            </h1>
          </div>
          <p className="text-center text-slate-600 font-medium text-sm">
            Get personalized financial insights and advice
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-18 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          {showInitialAnalysis ? (
            /* Initial Analysis View */
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-2xl p-8"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-slate-800 mb-4">AI Analysis Complete</h2>
                <p className="text-slate-600 mb-8 text-lg">
                  I've analyzed your financial data and found some interesting insights
                </p>
                
                {/* Key Stats */}
                {financialData && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">Total Income</h3>
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        ₹{(processTransactions(financialData.dailyTransactions).income
                          .reduce((sum, t) => sum + (t.amount || 0), 0)).toLocaleString()}
                      </div>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">Total Expenses</h3>
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                          <TrendingDown className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-red-600">
                        ₹{(processTransactions(financialData.dailyTransactions).expenses
                          .reduce((sum, t) => sum + (t.amount || 0), 0)).toLocaleString()}
                      </div>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">Net Balance</h3>
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        ₹{((processTransactions(financialData.dailyTransactions).income
                          .reduce((sum, t) => sum + (t.amount || 0), 0)) - 
                          (processTransactions(financialData.dailyTransactions).expenses
                          .reduce((sum, t) => sum + (t.amount || 0), 0))).toLocaleString()}
                      </div>
                    </motion.div>
                  </div>
                )}
                
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startChat}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg"
                >
                  <MessageSquare className="w-5 h-5 inline mr-2" />
                  Chat with AI Assistant
                </motion.button>
              </motion.div>
              
              {/* Financial Insights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-2xl p-8"
              >
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <span>Financial Insights</span>
                </h3>
                <div className="space-y-4">
                  {generateInitialInsights().map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-start gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-200/50 hover:shadow-md transition-all duration-200"
                    >
                      <div className="p-3 bg-white rounded-xl shadow-sm">
                        {insight.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-800 text-lg mb-2">{insight.title}</h4>
                        <p className="text-slate-600">{insight.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            /* Chat Interface */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-2xl h-[600px] flex flex-col"
            >
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start gap-3 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                        message.type === 'user' 
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                          : message.isError 
                            ? 'bg-gradient-to-br from-red-500 to-red-600' 
                            : 'bg-gradient-to-br from-slate-500 to-slate-600'
                      }`}>
                        {message.type === 'user' ? 
                          <User className="w-5 h-5 text-white" /> : 
                          message.isError ? 
                          <AlertCircle className="w-5 h-5 text-white" /> :
                          <Bot className="w-5 h-5 text-white" />
                        }
                      </div>
                      <div className={`px-4 py-3 rounded-xl shadow-sm ${
                        message.type === 'user' 
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' 
                          : message.isError
                            ? 'bg-red-50 text-red-800 border border-red-200'
                            : 'bg-slate-50 text-slate-800 border border-slate-200'
                      }`}>
                        {/* Render AI message with markdown support */}
                        {message.type !== 'user' ? (
                          <div 
                            className="text-sm prose max-w-none" 
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }} 
                          />
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        )}
                        <div className={`text-xs mt-2 opacity-70`}>
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input Area */}
              <div className="border-t border-slate-200/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 relative">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me about your spending patterns, savings tips, or any financial questions..."
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
                      rows="2"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:bg-slate-300 text-white p-3 rounded-xl transition-all duration-200 shadow-lg"
                  >
                    <Send className="w-5 h-5" />
                  </motion.button>
                </div>
                
                {/* Quick Suggestions */}
                <div className="flex flex-wrap gap-2">
                  {['Analyze my spending', 'How can I save more?', 'Budget optimization tips', 'Expense tracking advice'].map((suggestion) => (
                    <motion.button
                      key={suggestion}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setInputMessage(suggestion)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-xl transition-all duration-200 border border-slate-200"
                    >
                      {suggestion}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200/50 shadow-2xl z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-6 py-3">
            <button onClick={() => navigate('/transaction')} className="flex flex-col items-center gap-1 py-2 text-slate-400 hover:text-slate-600 transition-colors">
              <FolderOpen className="w-5 h-5" />
              <span className="text-xs font-medium">Records</span>
            </button>
            <button onClick={() => navigate('/analytics')} className="flex flex-col items-center gap-1 py-2 text-slate-400 hover:text-slate-600 transition-colors">
              <BarChart3 className="w-5 h-5" />
              <span className="text-xs font-medium">Analysis</span>
            </button>
            <button onClick={() => navigate('/budget')} className="flex flex-col items-center gap-1 py-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Calculator className="w-5 h-5" />
              <span className="text-xs font-medium">Budgets</span>
            </button>
            <button onClick={() => navigate('/splitwise')} className="flex flex-col items-center gap-1 py-2 text-slate-400 hover:text-slate-600 transition-colors">
              <CreditCard className="w-5 h-5" />
              <span className="text-xs font-medium">SplitWise</span>
            </button>
            <button onClick={() => navigate('/ai')} className="flex flex-col items-center gap-1 py-2 text-blue-600 hover:text-blue-700 transition-colors">
              <Brain className="w-5 h-5" />
              <span className="text-xs font-medium">AI</span>
            </button>
            <button onClick={() => navigate('/')} className="flex flex-col items-center gap-1 py-2 text-slate-400 hover:text-blue-700 transition-colors">
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-xs font-medium">Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialAIChatbot;