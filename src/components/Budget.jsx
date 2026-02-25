import React, { useState, useEffect } from 'react';
import { X, Plus, BarChart3,LayoutDashboard, Calculator, CreditCard, FolderOpen, Brain, ArrowLeft, TrendingUp, AlertTriangle } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const BudgetTracker = () => {
    const navigate = useNavigate();
    const { user, isLoaded } = useUser();
    const clerkUserId = user?.id;

    const [budgets, setBudgets] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [budgetAmount, setBudgetAmount] = useState('');
    const [notification, setNotification] = useState('');
    const [loading, setLoading] = useState(false);

    // Default categories with icons
    const defaultCategories = [
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
        { name: 'Gifts', icon: '🎁', color: 'bg-gradient-to-br from-violet-500 to-violet-600' }
    ];

    // Get current month info for display
    const getCurrentMonthInfo = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const monthName = now.toLocaleString('default', { month: 'long' });
        
        return {
            year,
            month: month + 1,
            monthName,
            displayText: `${monthName}, ${year}`
        };
    };

    // Fetch budgets for user
    const fetchBudgets = async (clerkUserId) => {
        if (!clerkUserId) {
            console.log('No clerkUserId provided, skipping fetch');
            return;
        }
        
        setLoading(true);
        try {
            console.log('Fetching budgets for user:', clerkUserId);
            
            const response = await fetch('https://serverbudget.onrender.com/budgetGet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ clerkUserId })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error:', errorText);
                throw new Error(`Failed to fetch budgets: ${response.status} ${errorText}`);
            }
            
            const data = await response.json();
            console.log('Received data:', data);
            
            setBudgets(data.budget || []);
        } catch (error) {
            console.error('Failed to fetch budgets:', error);
            setBudgets([]);
            setNotification(`Failed to load budgets: ${error.message}`);
            setTimeout(() => setNotification(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    // Load budgets when component mounts and user is loaded
    useEffect(() => {
        if (isLoaded && clerkUserId) {
            console.log('User loaded, fetching budgets...');
            fetchBudgets(clerkUserId);
        } else if (isLoaded && !clerkUserId) {
            console.log('User loaded but no clerkUserId found');
            setNotification('User not authenticated');
        }
    }, [isLoaded, clerkUserId]);

    // Delete budget function
    const deleteBudget = async (clerkUserId, category) => {
        try {
            setLoading(true);
            const response = await fetch('https://serverbudget.onrender.com/budgetdelete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ clerkUserId, category })
            });
            console.log('clerkuserid and category:', clerkUserId, category);
            if (!response.ok) throw new Error('Failed to delete budget');
            
            setBudgets(prev => prev.filter(budget => budget.category !== category));
            setNotification(`Budget for ${category} deleted successfully`);
            setTimeout(() => setNotification(''), 3000);
        } catch (error) {
            console.error('Failed to delete budget:', error);
            setNotification('Failed to delete budget. Please try again.');
            setTimeout(() => setNotification(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    // Get unbudgeted categories
    const unbudgetedCategories = defaultCategories.filter(
        cat => !budgets.some(budget => budget.category === cat.name)
    );

    // Calculate totals
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.budget, 0);
    const totalSpent = budgets.reduce((sum, budget) => sum + budget.CurrentAmount, 0);
    const remainingBudget = totalBudget - totalSpent;
    const spendingPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    // Add budget function
    const addBudget = async (clerkUserId, category, budget, CurrentAmount = 0) => {
        const response = await fetch('https://serverbudget.onrender.com/budget', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ clerkUserId, category, budget, CurrentAmount })
        });
        if (!response.ok) throw new Error('Failed to add budget');
        return await response.json();
    };

    // Handle setting budget
    const handleSetBudget = async () => {
        if (!selectedCategory || !budgetAmount || !clerkUserId) return;

        const newBudget = {
            category: selectedCategory,
            budget: parseFloat(budgetAmount),
            CurrentAmount: 0,
            icon: defaultCategories.find(cat => cat.name === selectedCategory)?.icon || '📦'
        };

        try {
            setLoading(true);
            await addBudget(clerkUserId, selectedCategory, parseFloat(budgetAmount), 0);
            
            setBudgets(prev => [...prev, newBudget]);
            setShowPopup(false);
            setSelectedCategory('');
            setBudgetAmount('');
            
            setNotification(`Budget set for ${selectedCategory}: ₹${budgetAmount}`);
            setTimeout(() => setNotification(''), 3000);
        } catch (error) {
            console.error('Failed to add budget:', error);
            setNotification('Failed to save budget. Please try again.');
            setTimeout(() => setNotification(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    // Show loading if user data is not loaded yet
    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                    <p className="mt-2 text-slate-600">Loading user data...</p>
                </div>
            </div>
        );
    }

    // Show error if user is not authenticated
    if (isLoaded && !clerkUserId) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600">User not authenticated. Please log in.</p>
                    <button 
                        onClick={() => navigate('/sign-in')}
                        className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                    >
                        Go to Login
                    </button>
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
                            <Calculator className="w-4 h-4 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Budget Tracker
                        </h1>
                    </div>
                    <p className="text-center text-slate-600 font-medium text-sm">
                        {getCurrentMonthInfo().displayText}
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="pt-24 pb-24 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-2xl p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-slate-800">Total Budget</h3>
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-slate-800">
                                {loading ? '...' : `₹${totalBudget.toFixed(2)}`}
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-2xl p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-slate-800">Total Spent</h3>
                                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-red-600">
                                {loading ? '...' : `₹${totalSpent.toFixed(2)}`}
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-2xl p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-slate-800">Remaining</h3>
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                    <Calculator className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <p className={`text-2xl font-bold ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {loading ? '...' : `₹${remainingBudget.toFixed(2)}`}
                            </p>
                        </motion.div>
                    </div>

                    {/* Progress Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-2xl p-6 mb-8"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-800">Spending Progress</h3>
                            <span className="text-sm font-medium text-slate-600">
                                {spendingPercentage.toFixed(1)}% used
                            </span>
                        </div>
                        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                    spendingPercentage > 100 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                                    spendingPercentage > 80 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                                    'bg-gradient-to-r from-green-500 to-green-600'
                                }`}
                                style={{ width: `${Math.min(spendingPercentage, 100)}%` }}
                            />
                        </div>
                    </motion.div>

                    {/* Notification */}
                    {notification && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-blue-100 border border-blue-400 text-blue-700 px-6 py-4 rounded-xl mb-6 flex items-center space-x-3"
                        >
                            <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 text-xs">i</span>
                            </div>
                            <span>{notification}</span>
                        </motion.div>
                    )}

                    {/* Loading indicator */}
                    {loading && (
                        <div className="text-center py-8">
                            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                            <p className="mt-2 text-slate-600">Loading budgets...</p>
                        </div>
                    )}

                    {/* Budgeted Categories */}
                    {!loading && budgets.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-2xl p-6 mb-8"
                        >
                            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="w-4 h-4 text-white" />
                                </div>
                                <span>Budgeted Categories</span>
                            </h2>
                            <div className="space-y-4">
                                {budgets.map((budget, index) => {
                                    const categoryInfo = defaultCategories.find(cat => cat.name === budget.category);
                                    const percentage = (budget.CurrentAmount / budget.budget) * 100;
                                    const isOverBudget = budget.CurrentAmount > budget.budget;
                                    
                                    return (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 * index }}
                                            className="bg-slate-50/50 rounded-xl p-4 border border-slate-200/50 hover:shadow-md transition-all duration-200"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className={`w-14 h-14 rounded-xl ${categoryInfo?.color || 'bg-gradient-to-br from-slate-500 to-slate-600'} flex items-center justify-center text-white text-2xl shadow-lg`}>
                                                        {budget.icon}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-slate-800 text-lg">{budget.category}</p>
                                                        <p className="text-slate-600">
                                                            ₹{budget.CurrentAmount.toFixed(2)} / ₹{budget.budget.toFixed(2)}
                                                            {isOverBudget && (
                                                                <span className="text-red-600 ml-2 font-medium">EXCEEDED!</span>
                                                            )}
                                                        </p>
                                                        <div className="w-full h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                                                            <div 
                                                                className={`h-2 rounded-full transition-all duration-500 ${
                                                                    isOverBudget ? 'bg-gradient-to-r from-red-500 to-red-600' :
                                                                    percentage > 80 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                                                                    'bg-gradient-to-r from-green-500 to-green-600'
                                                                }`}
                                                                style={{ width: `${Math.min(percentage, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button
                                                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm"
                                                        disabled={loading}
                                                    >
                                                        ₹{budget.CurrentAmount.toFixed(2)}
                                                    </button>
                                                    <button
                                                        onClick={() => deleteBudget(clerkUserId, budget.category)}
                                                        className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm"
                                                        disabled={loading}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* Unbudgeted Categories */}
                    {!loading && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-2xl p-6"
                        >
                            <h2 className="text-xl font-bold text-slate-800 mb-6">
                                {budgets.length === 0 ? (
                                    <div className="text-center">
                                        <p className="text-lg">Currently, no budget is applied for this month.</p>
                                        <p className="text-slate-600 mt-2">
                                            Set budget-limits for this month, or copy your budget-limits from past months.
                                        </p>
                                    </div>
                                ) : (
                                    <span>Not Budgeted This Month</span>
                                )}
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {unbudgetedCategories.map((category, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.1 * index }}
                                        className="bg-slate-50/50 rounded-xl p-4 border border-slate-200/50 hover:shadow-md transition-all duration-200"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-12 h-12 rounded-xl ${category.color} flex items-center justify-center text-white text-xl shadow-lg`}>
                                                    {category.icon}
                                                </div>
                                                <span className="font-semibold text-slate-800">{category.name}</span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setSelectedCategory(category.name);
                                                    setShowPopup(true);
                                                }}
                                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-sm"
                                                disabled={loading}
                                            >
                                                Set Budget
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Add New Category Button */}
            <motion.button 
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowPopup(true)}
                className="fixed bottom-24 right-6 w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-2xl hover:shadow-3xl transition-all duration-200 z-20"
                disabled={loading}
            >
                <Plus className="w-8 h-8 text-white" />
            </motion.button>

            {/* Budget Setting Popup */}
            {showPopup && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-2xl p-8 w-full max-w-md"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-800">
                                Set Budget - {getCurrentMonthInfo().monthName} {getCurrentMonthInfo().year}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowPopup(false);
                                    setSelectedCategory('');
                                    setBudgetAmount('');
                                }}
                                className="text-slate-500 hover:text-slate-700 transition-colors"
                                disabled={loading}
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {!selectedCategory && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                                        Select Category
                                    </label>
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
                                        disabled={loading}
                                    >
                                        <option value="">Choose a category</option>
                                        {unbudgetedCategories.map(category => (
                                            <option key={category.name} value={category.name}>
                                                {category.icon} {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {selectedCategory && (
                                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
                                    <div className={`w-12 h-12 rounded-xl ${defaultCategories.find(cat => cat.name === selectedCategory)?.color} flex items-center justify-center text-white text-xl shadow-lg`}>
                                        {defaultCategories.find(cat => cat.name === selectedCategory)?.icon}
                                    </div>
                                    <span className="font-semibold text-slate-800 text-lg">{selectedCategory}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-3">
                                    Budget Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    value={budgetAmount}
                                    onChange={(e) => setBudgetAmount(e.target.value)}
                                    placeholder="Enter budget amount"
                                    className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
                                    disabled={loading}
                                />
                            </div>

                            <div className="flex space-x-4 pt-4">
                                <button
                                    onClick={() => {
                                        setShowPopup(false);
                                        setSelectedCategory('');
                                        setBudgetAmount('');
                                    }}
                                    className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200 font-medium"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSetBudget}
                                    disabled={!selectedCategory || !budgetAmount || loading}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm"
                                >
                                    {loading ? 'Saving...' : 'Save Budget'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
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
                        <button onClick={() => navigate('/budget')} className="flex flex-col items-center gap-1 py-2 text-blue-600 hover:text-blue-700 transition-colors">
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
        </div>
    );
};

export default BudgetTracker;