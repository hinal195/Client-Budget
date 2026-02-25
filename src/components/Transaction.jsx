import React, { useState, useEffect } from 'react';
import { Search,LayoutDashboard, Menu, ChevronLeft, ChevronRight, Filter, Plus, X, Check, Brain, TrendingUp, TrendingDown, DollarSign, Calendar, Calculator as CalcIcon, Tag, BarChart3, Calculator, CreditCard, FolderOpen } from 'lucide-react';
import { evaluate } from 'https://cdn.jsdelivr.net/npm/mathjs@11.8.0/+esm';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
// API Functions

const getTransactionsByDate = async (clerkUserId, date) => {
  try {
    const response = await fetch('https://serverbudget.onrender.com/transactions/getforUserUsingDate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clerkUserId, date }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Raw Fetched Data:', data); // Log raw response for debugging

    // Normalize the response to an array of transactions
    let transactions = [];
    if (Array.isArray(data)) {
      transactions = data; // Handle flat array response
    } else if (data.transactions && Array.isArray(data.transactions)) {
      transactions = data.transactions; // Handle { transactions: [...] }
    } else if (data.data && Array.isArray(data.data)) {
      transactions = data.data; // Handle { data: [...] }
    } else {
      console.warn('Unexpected response structure:', data);
    }

    // Normalize and filter valid transactions
    const normalizedTransactions = transactions
      .filter(t => t && typeof t === 'object') // Exclude null, undefined, non-objects
      .map((t, index) => ({
        id: t.id || `temp-id-${index}`, // Fallback ID
        type: t.type || 'EXPENSE', // Fallback to EXPENSE
        amount: parseFloat(t.amount) || 0, // Ensure number
        category: t.category || 'Other', // Fallback category
        account: t.account || 'Cash', // Fallback account
        notes: t.notes || '', // Empty string if no notes
        date: t.date?.split('T')[0] || date, // Normalize date to YYYY-MM-DD
        icon: t.icon || '📦', // Fallback icon
      }));

    console.log('Normalized Transactions:', normalizedTransactions);
    return normalizedTransactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

const addTransaction = async (clerkUserId, date, transaction) => {
  try {
    const response = await fetch('https://serverbudget.onrender.com/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clerkUserId, date, transaction }),
    });

    if (!response.ok) {
      throw new Error(`Failed to add transaction: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Posted Transaction Response:', data); // Log raw response

    // Normalize the returned transaction
    let savedTransaction = null;
    if (data.transaction && typeof data.transaction === 'object') {
      savedTransaction = data.transaction; // Handle { transaction: {...} }
    } else if (data.data && typeof data.data === 'object') {
      savedTransaction = data.data; // Handle { data: {...} }
    } else if (typeof data === 'object' && data.amount) {
      savedTransaction = data; // Handle flat object
    }

    // Return normalized transaction with fallbacks
    return savedTransaction
      ? {
          id: savedTransaction.id || `temp-id-${Date.now()}`,
          type: savedTransaction.type || transaction.type,
          amount: parseFloat(savedTransaction.amount) || transaction.amount,
          category: savedTransaction.category || transaction.category,
          account: savedTransaction.account || transaction.account,
          notes: savedTransaction.notes || transaction.notes,
          date: savedTransaction.date?.split('T')[0] || date,
          icon: savedTransaction.icon || transaction.icon,
        }
      : transaction; // Fallback to input transaction if response is invalid
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

const ExpenseTracker = () => {
    const navigate=useNavigate();
  const { user } = useUser();
  const clerkUserId = user?.id;
  
  const [currentView, setCurrentView] = useState('records');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [amount, setAmount] = useState('0');
  const [selectedType, setSelectedType] = useState('EXPENSE');
  const [selectedAccount, setSelectedAccount] = useState('Cash');
  const [selectedCategory, setSelectedCategory] = useState('Food');
  const [notes, setNotes] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState([]);
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const accounts = [
    { name: 'Cash', icon: '💵', color: 'bg-gradient-to-br from-green-500 to-green-600' },
    { name: 'Bank', icon: '🏦', color: 'bg-gradient-to-br from-blue-500 to-blue-600' },
    { name: 'Credit Card', icon: '💳', color: 'bg-gradient-to-br from-red-500 to-red-600' },
    { name: 'Savings', icon: '💰', color: 'bg-gradient-to-br from-yellow-500 to-yellow-600' },
  ];

  const categories = {
    EXPENSE: [
      { name: 'Baby', icon: '👶', color: 'bg-gradient-to-br from-amber-500 to-amber-600' },
      { name: 'Beauty', icon: '💄', color: 'bg-gradient-to-br from-pink-500 to-pink-600' },
      { name: 'Bills', icon: '📄', color: 'bg-gradient-to-br from-slate-600 to-slate-700' },
      { name: 'Car', icon: '🚗', color: 'bg-gradient-to-br from-purple-500 to-purple-600' },
      { name: 'Clothing', icon: '👕', color: 'bg-gradient-to-br from-orange-500 to-orange-600' },
      { name: 'Education', icon: '🎓', color: 'bg-gradient-to-br from-blue-500 to-blue-600' },
      { name: 'Food', icon: '🍔', color: 'bg-gradient-to-br from-green-500 to-green-600' },
      { name: 'Entertainment', icon: '🎬', color: 'bg-gradient-to-br from-red-500 to-red-600' },
      { name: 'Health', icon: '🏥', color: 'bg-gradient-to-br from-teal-500 to-teal-600' },
      { name: 'Travel', icon: '✈️', color: 'bg-gradient-to-br from-indigo-500 to-indigo-600' },
      { name: 'Home', icon: '🏠', color: 'bg-gradient-to-br from-emerald-500 to-emerald-600' },
      { name: 'Technology', icon: '💻', color: 'bg-gradient-to-br from-cyan-500 to-cyan-600' },
      { name: 'Sports', icon: '⚽', color: 'bg-gradient-to-br from-lime-500 to-lime-600' },
      { name: 'Pets', icon: '🐕', color: 'bg-gradient-to-br from-rose-500 to-rose-600' },
      { name: 'Gifts', icon: '🎁', color: 'bg-gradient-to-br from-violet-500 to-violet-600' },
      { name: 'Other', icon: '📦', color: 'bg-gradient-to-br from-slate-500 to-slate-600' },
    ],
    INCOME: [
      { name: 'Salary', icon: '💼', color: 'bg-gradient-to-br from-green-500 to-green-600' },
      { name: 'Business', icon: '🏢', color: 'bg-gradient-to-br from-blue-500 to-blue-600' },
      { name: 'Investment', icon: '📈', color: 'bg-gradient-to-br from-purple-500 to-purple-600' },
      { name: 'Gift', icon: '🎁', color: 'bg-gradient-to-br from-pink-500 to-pink-600' },
      { name: 'Freelance', icon: '💻', color: 'bg-gradient-to-br from-cyan-500 to-cyan-600' },
      { name: 'Rental', icon: '🏠', color: 'bg-gradient-to-br from-emerald-500 to-emerald-600' },
      { name: 'Other', icon: '💰', color: 'bg-gradient-to-br from-slate-500 to-slate-600' },
    ],
    TRANSFER: [], // Placeholder for TRANSFER type
  };

  const getCategoryData = (categoryName, type) =>
    categories[type]?.find((cat) => cat.name === categoryName) || {
      name: categoryName,
      icon: '📦',
      color: 'bg-gray-500',
    };

  const getAccountData = (accountName) =>
    accounts.find((acc) => acc.name === accountName) || {
      name: accountName,
      icon: '💵',
      color: 'bg-gray-500',
    };

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!clerkUserId) {
         console.log('User ID is required to save transactions.');
        return;
      }

      setLoading(true);
      try {
        const dateStr = currentDate.toISOString().split('T')[0];
        const fetchedTransactions = await getTransactionsByDate(clerkUserId, dateStr);
        setTransactions(fetchedTransactions);
        setError('');
      } catch (error) {
        console.log("No Transactiosn Available on this date")
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [currentDate, clerkUserId]);

  const handleSaveTransaction = async () => {
    if (parseFloat(amount) <= 0 || isNaN(parseFloat(amount))) {
      setError('Please enter a valid amount.');
      return;
    }
    if (!clerkUserId) {
      console.log('User ID is required to save transactions.');
      return;
    }
    if (selectedType === 'TRANSFER') {
      setError('Transfer transactions are not supported yet.');
      return;
    }

    setSaving(true);
    setError('');
    const categoryData = getCategoryData(selectedCategory, selectedType);
    const newTransaction = {
      type: selectedType,
      amount: parseFloat(amount),
      category: selectedCategory,
      account: selectedAccount,
      notes: notes,
      date: currentDate.toISOString().split('T')[0],
      icon: categoryData?.icon || '📦',
    };

    try {
      const dateStr = currentDate.toISOString().split('T')[0];
      const savedTransaction = await addTransaction(clerkUserId, dateStr, newTransaction);
      if (!savedTransaction || typeof savedTransaction !== 'object') {
        throw new Error('Invalid transaction response from server');
      }
      setTransactions((prev) => [
        { ...savedTransaction, id: savedTransaction.id || Date.now() }, // Fallback ID
        ...prev,
      ]);
      setAmount('0');
      setNotes('');
      setSelectedType('EXPENSE');
      setSelectedAccount('Cash');
      setSelectedCategory('Food');
      alert('Transaction saved successfully!');
    } catch (error) {
      setError('Failed to save transaction. Please try again.');
    } finally {
      setSaving(false);
      setShowAddExpense(false); // Always close the popup
    }
  };

  const formatDate = (date) =>
    date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const todaysTransactions = transactions.filter(
    (t) => t.date === currentDate.toISOString().split('T')[0]
  );

  const calculateTotals = () => {
    const today = currentDate.toISOString().split('T')[0];
    const todayTransactions = transactions.filter((t) => t.date === today);
    const totalExpense = todayTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = todayTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      expense: totalExpense,
      income: totalIncome,
      total: totalIncome - totalExpense,
    };
  };

  const totals = calculateTotals();

  const handleNumberClick = (num) => {
    if (num === '.' && amount.includes('.')) return;
    if (amount === '0' && num !== '.') {
      setAmount(num);
    } else {
      setAmount(amount + num);
    }
  };

  const handleOperatorClick = (op) => {
    if (op === 'clear') {
      setAmount('0');
    } else if (op === 'backspace') {
      setAmount(amount.length === 1 ? '0' : amount.slice(0, -1));
    } else if (op === '=') {
      try {
        const result = evaluate(amount);
        setAmount(result.toFixed(2).toString());
      } catch {
        setError('Invalid calculation');
        setTimeout(() => {
          setError('');
          setAmount('0');
        }, 1000);
      }
    } else {
      const lastChar = amount[amount.length - 1];
      if (['+', '-', '*', '/'].includes(lastChar)) {
        setAmount(amount.slice(0, -1) + op);
      } else {
        setAmount(amount + op);
      }
    }
  };

  const AnalyticsView = () => {
    const monthlyData = transactions.reduce((acc, transaction) => {
      const month = transaction.date.substring(0, 7);
      if (!acc[month]) acc[month] = { income: 0, expense: 0 };
      acc[month][transaction.type.toLowerCase()] += transaction.amount;
      return acc;
    }, {});

    const categoryTotals = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    return (
      <div className="flex-1 bg-yellow-50 p-4">
        <h2 className="text-xl font-bold text-teal-600 mb-6">Analytics</h2>
        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Monthly Overview</h3>
          {Object.entries(monthlyData).map(([month, data]) => (
            <div key={month} className="mb-3">
              <div className="text-sm text-gray-600 mb-1">{month}</div>
              <div className="flex justify-between">
                <span className="text-green-500">Income: ₹{data.income.toFixed(2)}</span>
                <span className="text-red-500">Expense: ₹{data.expense.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Expense by Category</h3>
          {Object.entries(categoryTotals).map(([category, amount]) => {
            const categoryData = getCategoryData(category, 'EXPENSE');
            return (
              <div key={category} className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <span className="text-xl mr-2">{categoryData.icon}</span>
                  <span className="text-gray-700">{category}</span>
                </div>
                <span className="text-red-500 font-medium">₹{amount.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (currentView === 'analytics') {
    return (
      <div className="flex flex-col h-screen">
        <div className="flex justify-between items-center px-4 py-4 bg-white">
          <button onClick={() => setCurrentView('records')}>
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="text-2xl font-bold text-teal-600" style={{ fontFamily: 'cursive' }}>
            MyMoney
          </div>
          <Search className="w-6 h-6 text-teal-600" />
        </div>
        {error && (
          <div className="bg-red-100 text-red-700 p-4 mx-4 rounded-lg">{error}</div>
        )}
        <AnalyticsView />
        <div className="flex bg-white border-t border-gray-200 px-4 py-2">
          <div className="flex-1 flex flex-col items-center py-2">
            <div className="w-6 h-6 bg-gray-400 rounded-sm flex items-center justify-center mb-1">
              <svg className="w-4 h-4 text-white" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
            <button className="text-xs text-gray-400" onClick={() => setCurrentView('records')}>
              Records
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center py-2">
            <div className="w-6 h-6 bg-teal-600 rounded-sm flex items-center justify-center mb-1">
              <svg className="w-4 h-4 text-white" viewBox="0 0 20 20">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-teal-600">Analysis</span>
          </div>
          <div className="flex-1 flex flex-col items-center py-2">
            <svg className="w-6 h-6 text-gray-400 mb-1" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs text-gray-400">Budgets</span>
          </div>
          <div className="flex-1 flex flex-col items-center py-2">
            <svg className="w-6 h-6 text-gray-400 mb-1" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2v4h4V6H4zm6 0v4h4V6h-4zM4 14v-2h4v2H4zm6 0v-2h4v2h-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs text-gray-400">Accounts</span>
          </div>
          <div className="flex-1 flex flex-col items-center py-2">
            <svg className="w-6 h-6 text-gray-400 mb-1" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs text-gray-400">Categories</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-b border-slate-200/50 z-10 shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <FolderOpen className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Transaction Records
            </h1>
          </div>
          <p className="text-center text-slate-600 font-medium text-sm">
            Track your daily income and expenses
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-24 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Date Navigation */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8 bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-2xl p-6"
          >
            <button
              onClick={() => navigateDate(-1)}
              className="w-12 h-12 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center transition-all duration-200"
            >
              <ChevronLeft className="w-6 h-6 text-slate-600" />
            </button>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800">{formatDate(currentDate)}</h2>
              <div className="flex items-center justify-center space-x-2 mt-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-500">Daily Overview</span>
              </div>
            </div>
            <button
              onClick={() => navigateDate(1)}
              className="w-12 h-12 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center transition-all duration-200"
            >
              <ChevronRight className="w-6 h-6 text-slate-600" />
            </button>
          </motion.div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Total Expense</h3>
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-red-600">₹{totals.expense.toFixed(2)}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Total Income</h3>
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-green-600">₹{totals.income.toFixed(2)}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Net Balance</h3>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className={`text-2xl font-bold ${totals.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{totals.total.toFixed(2)}
              </p>
            </motion.div>
          </div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 flex items-center space-x-3"
            >
              <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-xs">!</span>
              </div>
              <span>{error}</span>
            </motion.div>
          )}

          {/* Transactions List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-2xl p-6"
          >
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Tag className="w-4 h-4 text-white" />
              </div>
              <span>Today's Transactions</span>
            </h3>

            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                <p className="mt-3 text-slate-600">Loading transactions...</p>
              </div>
            ) : todaysTransactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="w-10 h-10 text-slate-400" />
                </div>
                <div className="text-slate-400 text-lg mb-2">No transactions for this date</div>
                <div className="text-slate-500 text-sm">Add your first transaction to get started</div>
              </div>
            ) : (
              <div className="space-y-4">
                {todaysTransactions.map((transaction, index) => {
                  const categoryData = getCategoryData(transaction.category, transaction.type);
                  const accountData = getAccountData(transaction.account);
                  return (
                    <motion.div
                      key={transaction.id || `transaction-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="bg-slate-50/50 rounded-xl p-4 border border-slate-200/50 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-14 h-14 rounded-xl ${categoryData.color} flex items-center justify-center text-white text-2xl shadow-lg`}>
                            {transaction.icon}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-slate-800 text-lg">{transaction.category}</div>
                            <div className="flex items-center text-sm text-slate-500 mt-1">
                              <div className={`w-3 h-3 ${accountData.color} rounded-full mr-2`}></div>
                              {transaction.account}
                              {transaction.notes && (
                                <span className="ml-3 text-xs bg-slate-200 px-2 py-1 rounded-full">• {transaction.notes}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={`text-xl font-bold ${transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'INCOME' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Floating Action Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowAddExpense(true)}
        className="fixed bottom-24 right-6 w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-full flex items-center justify-center shadow-2xl hover:shadow-3xl transition-all duration-200 z-20"
      >
        <Plus className="w-8 h-8 text-white" />
      </motion.button>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200/50 shadow-2xl z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-6 py-3">
            <button onClick={() => navigate('/transaction')} className="flex flex-col items-center gap-1 py-2 text-blue-600 hover:text-blue-700 transition-colors">
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
            <button onClick={() => navigate('/ai')} className="flex flex-col items-center gap-1 py-2 text-slate-400 hover:text-slate-600 transition-colors">
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

      {/* Add Transaction Popup */}
      {showAddExpense && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-6 border-b border-slate-200/50">
              <button
                onClick={() => {
                  setShowAddExpense(false);
                  setError('');
                }}
                className="flex items-center text-slate-600 hover:text-slate-800 font-medium transition-colors"
              >
                <X className="w-5 h-5 mr-2" /> Cancel
              </button>
              <button
                onClick={handleSaveTransaction}
                disabled={saving}
                className={`flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors ${
                  saving ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Check className="w-5 h-5 mr-2" /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>

            {/* Transaction Type Selector */}
            <div className="flex justify-center items-center px-6 py-6 space-x-6">
              <button
                className={`text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 ${
                  selectedType === 'INCOME' 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                onClick={() => {
                  setSelectedType('INCOME');
                  setSelectedCategory(categories.INCOME[0].name);
                  setError('');
                }}
              >
                Income
              </button>
              <button
                className={`text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 ${
                  selectedType === 'EXPENSE' 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                onClick={() => {
                  setSelectedType('EXPENSE');
                  setSelectedCategory(categories.EXPENSE[0].name);
                  setError('');
                }}
              >
                Expense
              </button>
              <button
                className="text-sm font-semibold px-4 py-2 rounded-xl text-slate-400 cursor-not-allowed opacity-50"
                disabled
              >
                Transfer
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 mx-6 rounded-xl flex items-center space-x-3">
                <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-xs">!</span>
                </div>
                <span>{error}</span>
              </div>
            )}

            {/* Form Content */}
            <div className="px-6 py-6 space-y-6">
              {/* Account and Category Selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-sm font-semibold text-slate-700 mb-3">Account</div>
                  <button
                    className="w-full p-4 border-2 border-blue-500 rounded-xl bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all duration-200"
                    onClick={() => setShowAccountSelector(true)}
                  >
                    <div className={`w-8 h-8 ${getAccountData(selectedAccount).color} rounded-lg mr-3 flex items-center justify-center text-sm shadow-lg`}>
                      {getAccountData(selectedAccount).icon}
                    </div>
                    <span className="text-blue-600 font-semibold">{selectedAccount}</span>
                  </button>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-slate-700 mb-3">Category</div>
                  <button
                    className="w-full p-4 border-2 border-blue-500 rounded-xl bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all duration-200"
                    onClick={() => setShowCategorySelector(true)}
                  >
                    <div className={`w-8 h-8 ${getCategoryData(selectedCategory, selectedType).color} rounded-lg mr-3 flex items-center justify-center text-sm shadow-lg`}>
                      {getCategoryData(selectedCategory, selectedType).icon}
                    </div>
                    <span className="text-blue-600 font-semibold">{selectedCategory}</span>
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <div className="text-sm font-semibold text-slate-700 mb-3">Notes</div>
                <textarea
                  className="w-full p-4 border-2 border-slate-300 rounded-xl bg-white/80 backdrop-blur-sm text-slate-700 placeholder-slate-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Add notes (optional)"
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Amount Display */}
              <div>
                <div className="text-sm font-semibold text-slate-700 mb-3">Amount</div>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-500 rounded-xl p-6 flex items-center justify-between">
                  <span className="text-4xl font-bold text-blue-700">₹{amount}</span>
                  <button
                    className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg"
                    onClick={() => handleOperatorClick('backspace')}
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Calculator */}
              <div className="grid grid-cols-4 gap-3">
                <button
                  className="h-14 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xl font-semibold rounded-xl flex items-center justify-center hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg"
                  onClick={() => handleOperatorClick('+')}
                >
                  +
                </button>
                <button
                  className="h-14 bg-slate-100 border border-slate-300 text-slate-700 text-xl font-semibold rounded-xl hover:bg-slate-200 transition-all duration-200"
                  onClick={() => handleNumberClick('7')}
                >
                  7
                </button>
                <button
                  className="h-14 bg-slate-100 border border-slate-300 text-slate-700 text-xl font-semibold rounded-xl hover:bg-slate-200 transition-all duration-200"
                  onClick={() => handleNumberClick('8')}
                >
                  8
                </button>
                <button
                  className="h-14 bg-slate-100 border border-slate-300 text-slate-700 text-xl font-semibold rounded-xl hover:bg-slate-200 transition-all duration-200"
                  onClick={() => handleNumberClick('9')}
                >
                  9
                </button>
                <button
                  className="h-14 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xl font-semibold rounded-xl flex items-center justify-center hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg"
                  onClick={() => handleOperatorClick('-')}
                >
                  −
                </button>
                <button
                  className="h-14 bg-slate-100 border border-slate-300 text-slate-700 text-xl font-semibold rounded-xl hover:bg-slate-200 transition-all duration-200"
                  onClick={() => handleNumberClick('4')}
                >
                  4
                </button>
                <button
                  className="h-14 bg-slate-100 border border-slate-300 text-slate-700 text-xl font-semibold rounded-xl hover:bg-slate-200 transition-all duration-200"
                  onClick={() => handleNumberClick('5')}
                >
                  5
                </button>
                <button
                  className="h-14 bg-slate-100 border border-slate-300 text-slate-700 text-xl font-semibold rounded-xl hover:bg-slate-200 transition-all duration-200"
                  onClick={() => handleNumberClick('6')}
                >
                  6
                </button>
                <button
                  className="h-14 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xl font-semibold rounded-xl flex items-center justify-center hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg"
                  onClick={() => handleOperatorClick('*')}
                >
                  ×
                </button>
                <button
                  className="h-14 bg-slate-100 border border-slate-300 text-slate-700 text-xl font-semibold rounded-xl hover:bg-slate-200 transition-all duration-200"
                  onClick={() => handleNumberClick('1')}
                >
                  1
                </button>
                <button
                  className="h-14 bg-slate-100 border border-slate-300 text-slate-700 text-xl font-semibold rounded-xl hover:bg-slate-200 transition-all duration-200"
                  onClick={() => handleNumberClick('2')}
                >
                  2
                </button>
                <button
                  className="h-14 bg-slate-100 border border-slate-300 text-slate-700 text-xl font-semibold rounded-xl hover:bg-slate-200 transition-all duration-200"
                  onClick={() => handleNumberClick('3')}
                >
                  3
                </button>
                <button
                  className="h-14 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xl font-semibold rounded-xl flex items-center justify-center hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg"
                  onClick={() => handleOperatorClick('/')}
                >
                  ÷
                </button>
                <button
                  className="h-14 bg-slate-100 border border-slate-300 text-slate-700 text-xl font-semibold rounded-xl hover:bg-slate-200 transition-all duration-200"
                  onClick={() => handleNumberClick('0')}
                >
                  0
                </button>
                <button
                  className="h-14 bg-slate-100 border border-slate-300 text-slate-700 text-xl font-semibold rounded-xl hover:bg-slate-200 transition-all duration-200"
                  onClick={() => handleNumberClick('.')}
                >
                  .
                </button>
                <button
                  className="h-14 bg-gradient-to-r from-green-500 to-green-600 text-white text-xl font-semibold rounded-xl flex items-center justify-center hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg"
                  onClick={() => handleOperatorClick('=')}
                >
                  =
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Account Selector Popup */}
      {showAccountSelector && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-2xl p-6 w-80 max-w-sm mx-4"
          >
            <h3 className="text-xl font-bold text-slate-800 mb-6">Select Account</h3>
            <div className="space-y-3">
              {accounts.map((account) => (
                <button
                  key={account.name}
                  className="w-full p-4 text-left rounded-xl border border-slate-200 hover:bg-slate-50 transition-all duration-200 flex items-center"
                  onClick={() => {
                    setSelectedAccount(account.name);
                    setShowAccountSelector(false);
                  }}
                >
                  <div className={`w-10 h-10 ${account.color} rounded-lg mr-4 flex items-center justify-center text-lg shadow-lg`}>
                    {account.icon}
                  </div>
                  <span className="font-semibold text-slate-800">{account.name}</span>
                </button>
              ))}
            </div>
            <button
              className="w-full mt-6 p-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all duration-200 font-medium"
              onClick={() => setShowAccountSelector(false)}
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Category Selector Popup */}
      {showCategorySelector && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-2xl p-6 w-80 max-w-sm mx-4 max-h-96 overflow-y-auto"
          >
            <h3 className="text-xl font-bold text-slate-800 mb-6">Select Category</h3>
            <div className="space-y-3">
              {categories[selectedType]?.map((category) => (
                <button
                  key={category.name}
                  className="w-full p-4 text-left rounded-xl border border-slate-200 hover:bg-slate-50 transition-all duration-200 flex items-center"
                  onClick={() => {
                    setSelectedCategory(category.name);
                    setShowCategorySelector(false);
                  }}
                >
                  <div className={`w-10 h-10 ${category.color} rounded-lg mr-4 flex items-center justify-center text-lg shadow-lg`}>
                    {category.icon}
                  </div>
                  <span className="font-semibold text-slate-800">{category.name}</span>
                </button>
              ))}
            </div>
            <button
              className="w-full mt-6 p-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all duration-200 font-medium"
              onClick={() => setShowCategorySelector(false)}
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ExpenseTracker;