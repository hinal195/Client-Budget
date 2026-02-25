import React, { useState, useEffect } from 'react';
import { Users, LayoutDashboard,Plus, Calculator, Send, Clock, User, DollarSign } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

import {  BarChart3, CreditCard, FolderOpen, Brain,Menu,Search} from 'lucide-react';
const SplitWiseApp = () => {
  const { user: clerkUser } = useUser(); // Renamed to avoid conflict
  const [currentUser, setCurrentUser] = useState(null); // App user data from backend
  const [userName, setUserName] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  
  // Expense form state
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amount: '',
    description: '',
    sharedWith: []
  });

  // Fixed API base URL to match backend
  const API_BASE = 'https://splitwisebackend-ewt9.onrender.com';

  useEffect(() => {
    if (clerkUser) {
      checkUser();
      fetchUsers();
    }
  }, [clerkUser]);

  const checkUser = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/users/${clerkUser.id}`);
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
        fetchExpenses();
      } else {
        setIsNewUser(true);
      }
    } catch (error) {
      console.log('User not found, showing registration');
      setIsNewUser(true);
    }
  };

  const registerUser = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: clerkUser.id,
          name: userName
        })
      });
      
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
        setIsNewUser(false);
        fetchExpenses();
      }
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/users`);
      if (response.ok) {
        const users = await response.json();
        setAllUsers(users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/expenses`);
      if (response.ok) {
        const expensesData = await response.json();
        setExpenses(expensesData);
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    }
  };

  const addExpense = async () => {
    if (!expenseForm.title || !expenseForm.amount) return;

    try {
      const response = await fetch(`${API_BASE}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: expenseForm.title,
          amount: parseFloat(expenseForm.amount),
          description: expenseForm.description,
          paidBy: currentUser._id, // Use _id from MongoDB
          sharedWith: expenseForm.sharedWith.includes('all') ? 
            allUsers.map(u => u._id) : // Use _id from MongoDB
            [...expenseForm.sharedWith, currentUser._id]
        })
      });

      if (response.ok) {
        setExpenseForm({ title: '', amount: '', description: '', sharedWith: [] });
        setShowAddExpense(false);
        fetchExpenses();
      }
    } catch (error) {
      console.error('Failed to add expense:', error);
    }
  };

  const calculateSettlements = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/settlements`);
      if (response.ok) {
        const settlementsData = await response.json();
        setSettlements(settlementsData);
      }
    } catch (error) {
      console.error('Failed to calculate settlements:', error);
    }
  };

  const toggleUserInSharedWith = (userId) => {
    setExpenseForm(prev => ({
      ...prev,
      sharedWith: prev.sharedWith.includes(userId)
        ? prev.sharedWith.filter(id => id !== userId)
        : [...prev.sharedWith, userId]
    }));
  };
    const navigate = useNavigate();
  // Show loading while waiting for Clerk user
  if (!clerkUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Registration Screen
  if (isNewUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to MyMoney</h1>
            <p className="text-gray-600">Please enter your name to get started</p>
          </div>
          
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter your full name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={registerUser}
              disabled={!userName.trim()}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Join MyMoney
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while current user is being fetched
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your account...</p>
        </div>
      </div>
    );
  }

  // Main App
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-b border-slate-200/50 z-10 shadow-lg">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  SplitWise
                </h1>
                <p className="text-xs text-slate-600">Split expenses with friends</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-800">Welcome, {currentUser?.name}</p>
                <p className="text-xs text-slate-500">Ready to split expenses</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-20 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="text-center">
                <h3 className="text-gray-600 text-sm font-medium mb-2">TOTAL EXPENSES</h3>
                <p className="text-2xl font-bold text-red-500">
                  ₹{expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="text-center">
                <h3 className="text-gray-600 text-sm font-medium mb-2">YOUR SHARE</h3>
                <p className="text-2xl font-bold text-orange-500">
                  ₹{expenses.reduce((sum, exp) => {
                    const shareCount = exp.sharedWith?.length || 1;
                    return sum + (exp.amount / shareCount);
                  }, 0).toFixed(2)}
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="text-center">
                <h3 className="text-gray-600 text-sm font-medium mb-2">BALANCE</h3>
                <p className="text-2xl font-bold text-green-500">
                  ₹{(expenses.reduce((sum, exp) => {
                    if (exp.paidBy.toString() === currentUser._id.toString()) return sum + exp.amount;
                    const shareCount = exp.sharedWith?.length || 1;
                    return sum - (exp.amount / shareCount);
                  }, 0)).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-8">
            <button
              onClick={() => setShowAddExpense(true)}
              className="bg-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
            
            <button
              onClick={calculateSettlements}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Calculator className="w-4 h-4" />
              <span>Calculate Settlements</span>
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Expenses List */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-teal-600" />
                Recent Expenses
              </h2>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {expenses.map((expense) => (
                  <div key={expense._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-800">{expense.title}</h3>
                      <span className="text-lg font-bold text-red-500">₹{expense.amount}</span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-2">{expense.description}</p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          Paid by: {expense.paidByName || 'Unknown'}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          Split: {expense.sharedWith?.length || 1} people
                        </span>
                      </div>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(expense.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
                
                {expenses.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No expenses yet. Add your first expense!</p>
                )}
              </div>
            </div>

            {/* Settlements */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-blue-600" />
                Settlements
              </h2>
              
              <div className="space-y-4">
                {settlements.map((settlement, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {settlement.from} owes {settlement.to}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-red-500">₹{settlement.amount}</span>
                    </div>
                  </div>
                ))}
                
                {settlements.length === 0 && (
                  <p className="text-gray-500 text-center py-8">
                    Click "Calculate Settlements" to see who owes whom
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Expense</h2>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Expense title"
                value={expenseForm.title}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              
              <input
                type="number"
                placeholder="Amount (₹)"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              
              <textarea
                placeholder="Description (optional)"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                rows="3"
              />
              
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Share with:</p>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={expenseForm.sharedWith.includes('all')}
                      onChange={() => toggleUserInSharedWith('all')}
                      className="mr-2"
                    />
                    <span>Everyone</span>
                  </label>
                  
                  {allUsers.filter(u => u._id !== currentUser._id).map(u => (
                    <label key={u._id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={expenseForm.sharedWith.includes(u._id)}
                        onChange={() => toggleUserInSharedWith(u._id)}
                        disabled={expenseForm.sharedWith.includes('all')}
                        className="mr-2"
                      />
                      <span>{u.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddExpense(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addExpense}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Add Expense</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
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
            <button onClick={() => navigate('/splitwise')} className="flex flex-col items-center gap-1 py-2 text-blue-600 hover:text-blue-700 transition-colors">
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
    </div>
  );
};

export default SplitWiseApp;