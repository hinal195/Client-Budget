import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, LayoutDashboard,ChevronRight, Menu, Search, Plus, BarChart3, Calculator, CreditCard, FolderOpen, Tag, Loader2, Brain, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const MyMoneyApp = () => {
    const navigate = useNavigate();
    const { user } = useUser();
    const clerkUserId = user?.id;

    // Helper function to get user's budget data
    const getUserBudget = async (clerkUserId) => {
        try {
            const response = await fetch('http://loaclhost:5005/budgetGet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ clerkUserId }),
            });

            if (response.ok) {
                const data = await response.json();
                return data.budget || [];
            }
            return [];
        } catch (error) {
            console.warn('Failed to fetch user budget:', error);
            return [];
        }
    };

    // Helper function to update budget current amount
    const updateBudgetAmount = async (clerkUserId, category, expenseAmount, currentBudget) => {
        try {
            // Find the budget item for this category
            const budgetItem = currentBudget.find(b => b.category === category);
            if (!budgetItem) {
                console.log(`No budget found for category: ${category}`);
                return;
            }

            // Calculate new current amount (add expense to current amount)
            const newCurrentAmount = (budgetItem.CurrentAmount || 0) + expenseAmount;

            const response = await fetch('https://serverbudget.onrender.com/budgetupdate', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clerkUserId,
                    category,
                    budget: budgetItem.budget, // Keep the same budget limit
                    CurrentAmount: newCurrentAmount
                }),
            });

            if (response.ok) {
                console.log(`Budget updated for ${category}: +${expenseAmount} (Total: ${newCurrentAmount})`);
            } else {
                console.warn(`Failed to update budget for ${category}`);
            }
        } catch (error) {
            console.warn(`Error updating budget for ${category}:`, error);
        }
    };

    // API function to fetch transactions for entire month
    const getTransactionsForMonth = async (clerkUserId, year, month) => {
        try {
            // Get user's budget data first
            const userBudget = await getUserBudget(clerkUserId);
            console.log('User budget data:', userBudget);

            // Get first day of the month
            const firstDay = new Date(year, month, 1);
            const firstDayString = firstDay.toISOString().split('T')[0];
            
            // Get last day of the month
            const lastDay = new Date(year, month + 1, 0); // 0th day of next month = last day of current month
            const lastDayString = lastDay.toISOString().split('T')[0];
            
            console.log(`Fetching transactions from ${firstDayString} to ${lastDayString}`);
            
            // Fetch transactions for each day in the month
            const allTransactions = [];
            const currentDate = new Date(firstDay);
            
            while (currentDate <= lastDay) {
                const dateString = currentDate.toISOString().split('T')[0];
                console.log(`Fetching transactions for ${dateString}`);
                console.log(`Clerk User ID: ${clerkUserId}`);
                try {
                    const response = await fetch('https://serverbudget.onrender.com/transactions/getforUserUsingDate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ clerkUserId, date: dateString }),
                    });

                    if (response.status === 400) {
                        console.log('Bad Request: Missing or invalid parameters');
                    } else if (response.status === 404) {
                        console.log('Endpoint not found:', response.url);
                    }

                    if (response.ok) {
                        const data = await response.json();
                        
                        // Normalize the response to an array of transactions
                        let transactions = [];
                        if (Array.isArray(data)) {
                            transactions = data;
                        } else if (data.transactions && Array.isArray(data.transactions)) {
                            transactions = data.transactions;
                        } else if (data.data && Array.isArray(data.data)) {
                            transactions = data.data;
                        }
                        
                        // Add normalized transactions to the collection
                        const normalizedTransactions = transactions
                            .filter(t => t && typeof t === 'object')
                            .map((t, index) => ({
                                id: t.id || `temp-id-${dateString}-${index}`,
                                type: (t.type || 'EXPENSE').toLowerCase(),
                                amount: parseFloat(t.amount) || 0,
                                category: t.category || 'Other',
                                account: t.account || 'Cash',
                                notes: t.notes || '',
                                date: t.date?.split('T')[0] || dateString,
                                icon: t.icon || '📦',
                            }));
                        
                        // Update budget for expense transactions
                        for (const transaction of normalizedTransactions) {
                            if (transaction.type === 'expense' && userBudget.length > 0) {
                                await updateBudgetAmount(
                                    clerkUserId, 
                                    transaction.category, 
                                    transaction.amount, 
                                    userBudget
                                );
                            }
                        }
                        
                        allTransactions.push(...normalizedTransactions);
                    }
                } catch (dayError) {
                    console.warn(`Failed to fetch transactions for ${dateString}:`, dayError.message);
                    // Continue with other days even if one day fails
                }
                
                // Move to next day
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            console.log(`Total transactions fetched for ${year}-${month + 1}:`, allTransactions.length);
            return allTransactions;
            
        } catch (error) {
            console.error('Error fetching monthly transactions:', error);
            throw error;
        }
    };

    // Alternative optimized approach - if your backend supports date range queries
    const getTransactionsForMonthOptimized = async (clerkUserId, year, month) => {
        try {
            // Get user's budget data first
            const userBudget = await getUserBudget(clerkUserId);

            // If your backend supports fetching by month or date range, use this approach
            const monthString = `${year}-${String(month + 1).padStart(2, '0')}`;
            
            const response = await fetch('https://serverbudget.onrender.com/getforUserUsingMonth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ clerkUserId, month: monthString }),
            });
            
            if (!response.ok) {
                // Fallback to day-by-day fetching if month endpoint doesn't exist
                return await getTransactionsForMonth(clerkUserId, year, month);
            }
            
            const data = await response.json();
            
            // Same normalization logic
            let transactions = [];
            if (Array.isArray(data)) {
                transactions = data;
            } else if (data.transactions && Array.isArray(data.transactions)) {
                transactions = data.transactions;
            } else if (data.data && Array.isArray(data.data)) {
                transactions = data.data;
            }
            
            const normalizedTransactions = transactions
                .filter(t => t && typeof t === 'object')
                .map((t, index) => ({
                    id: t.id || `temp-id-${index}`,
                    type: (t.type || 'EXPENSE').toLowerCase(),
                    amount: parseFloat(t.amount) || 0,
                    category: t.category || 'Other',
                    account: t.account || 'Cash',
                    notes: t.notes || '',
                    date: t.date?.split('T')[0],
                    icon: t.icon || '📦',
                }));

            // Update budget for expense transactions
            for (const transaction of normalizedTransactions) {
                if (transaction.type === 'expense' && userBudget.length > 0) {
                    await updateBudgetAmount(
                        clerkUserId, 
                        transaction.category, 
                        transaction.amount, 
                        userBudget
                    );
                }
            }
            
            return normalizedTransactions;
        } catch (error) {
            // Fallback to day-by-day fetching
            return await getTransactionsForMonth(clerkUserId, year, month);
        }
    };

    // State management
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeView, setActiveView] = useState('expense');
    const [currentDate, setCurrentDate] = useState(new Date());

    // Format current date for display
    const currentMonth = currentDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
    });

    // Fetch transactions when component mounts or date changes
    useEffect(() => {
        const fetchTransactions = async () => {
            setLoading(true);
            setError(null);
            try {
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth(); // 0-based month
                
                // Try optimized approach first, fallback to day-by-day
                const fetchedTransactions = await getTransactionsForMonth(clerkUserId, year, month);
                setTransactions(fetchedTransactions);
                
                console.log(`Loaded ${fetchedTransactions.length} transactions for ${currentMonth}`);
            } catch (err) {
                setError(err.message);
                console.error('Failed to fetch transactions:', err);
            } finally {
                setLoading(false);
            }
        };

        if (clerkUserId) {
            fetchTransactions();
        }
    }, [clerkUserId, currentDate.getFullYear(), currentDate.getMonth()]);

    // Navigation functions
    const navigateMonth = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + direction);
        setCurrentDate(newDate);
    };

    // Calculate totals and category breakdowns
    const summary = useMemo(() => {
        const expenses = transactions.filter(t => t.type === 'expense');
        const income = transactions.filter(t => t.type === 'income');

        const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
        const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);

        // Group by category
        const expensesByCategory = expenses.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});

        const incomeByCategory = income.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});

        return {
            totalExpense,
            totalIncome,
            total: totalIncome - totalExpense,
            expensesByCategory,
            incomeByCategory
        };
    }, [transactions]);

    // Get category data for current view
    const currentCategoryData = activeView === 'expense' ? summary.expensesByCategory : summary.incomeByCategory;
    const currentTransactions = transactions.filter(t => t.type === activeView);

    // Generate colors for pie chart
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f59e0b'];

    // Calculate pie chart segments
    const total = Object.values(currentCategoryData).reduce((sum, amount) => sum + amount, 0);
    const categoryEntries = Object.entries(currentCategoryData).map(([category, amount], index) => ({
        category,
        amount,
        percentage: (amount / total) * 100,
        color: colors[index % colors.length]
    }));

    // Simple pie chart component
    const PieChart = ({ data, size = 200 }) => {
        let cumulativePercentage = 0;

        return (
            <div className="relative flex items-center justify-center">
                <svg width={size} height={size} className="transform -rotate-90">
                    <circle
                        cx={size/2}
                        cy={size/2}
                        r={size/2 - 20}
                        fill="none"
                        stroke="#f1f5f9"
                        strokeWidth="40"
                    />
                    {data.map((item, index) => {
                        const circumference = 2 * Math.PI * (size/2 - 20);
                        const strokeDasharray = circumference;
                        const strokeDashoffset = circumference - (item.percentage / 100) * circumference;
                        const rotation = (cumulativePercentage / 100) * 360;

                        cumulativePercentage += item.percentage;

                        return (
                            <circle
                                key={index}
                                cx={size/2}
                                cy={size/2}
                                r={size/2 - 20}
                                fill="none"
                                stroke={item.color}
                                strokeWidth="40"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                style={{
                                    transformOrigin: `${size/2}px ${size/2}px`,
                                    transform: `rotate(${rotation}deg)`
                                }}
                            />
                        );
                    })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-sm font-medium text-slate-600 capitalize">{activeView}s</div>
                        <div className="text-lg font-bold text-slate-800">
                            ₹{total.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-b border-slate-200/50 z-10 shadow-lg">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                            <BarChart3 className="w-4 h-4 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Analytics
                        </h1>
                    </div>
                    <p className="text-center text-slate-600 font-medium text-sm">
                        Financial insights and spending analysis
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="pt-24 pb-24 px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Month Navigation */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between mb-8 bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-2xl p-6"
                    >
                        <button
                            onClick={() => navigateMonth(-1)}
                            className="w-12 h-12 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center transition-all duration-200"
                        >
                            <ChevronLeft className="w-6 h-6 text-slate-600" />
                        </button>
                        <h2 className="text-2xl font-bold text-slate-800">{currentMonth}</h2>
                        <button
                            onClick={() => navigateMonth(1)}
                            className="w-12 h-12 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center transition-all duration-200"
                        >
                            <ChevronRight className="w-6 h-6 text-slate-600" />
                        </button>
                    </motion.div>

                    {/* Loading State */}
                    {loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center justify-center py-20"
                        >
                            <div className="text-center">
                                <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                                <p className="mt-3 text-slate-600">Loading {currentMonth} transactions...</p>
                            </div>
                        </motion.div>
                    )}

                    {/* Error State */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8"
                        >
                            <div className="text-red-800 font-semibold text-lg mb-2">Error loading transactions</div>
                            <div className="text-red-600 mb-4">{error}</div>
                            <button 
                                onClick={() => window.location.reload()} 
                                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm hover:from-red-600 hover:to-red-700 transition-all duration-200"
                            >
                                Retry
                            </button>
                        </motion.div>
                    )}

                    {/* Main Content - Only show when not loading and no error */}
                    {!loading && !error && (
                        <>
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
                                    <p className="text-2xl font-bold text-red-600">₹{summary.totalExpense.toFixed(2)}</p>
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
                                    <p className="text-2xl font-bold text-green-600">₹{summary.totalIncome.toFixed(2)}</p>
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
                                    <p className={`text-2xl font-bold ${summary.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        ₹{summary.total.toFixed(2)}
                                    </p>
                                </motion.div>
                            </div>

                            {/* Toggle Buttons */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="flex gap-4 mb-8 justify-center"
                            >
                                <button
                                    onClick={() => setActiveView('expense')}
                                    className={`py-4 px-8 rounded-xl text-base font-semibold transition-all duration-200 ${
                                        activeView === 'expense'
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                                            : 'bg-white/80 backdrop-blur-sm text-slate-600 border border-slate-200/50 hover:bg-white/90'
                                    }`}
                                >
                                    Expense Overview
                                </button>
                                <button
                                    onClick={() => setActiveView('income')}
                                    className={`py-4 px-8 rounded-xl text-base font-semibold transition-all duration-200 ${
                                        activeView === 'income'
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                                            : 'bg-white/80 backdrop-blur-sm text-slate-600 border border-slate-200/50 hover:bg-white/90'
                                    }`}
                                >
                                    Income Overview
                                </button>
                            </motion.div>

                            {/* No Data State */}
                            {categoryEntries.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="text-center py-20 bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-2xl"
                                >
                                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <BarChart3 className="w-10 h-10 text-slate-400" />
                                    </div>
                                    <div className="text-slate-400 text-lg mb-2">
                                        No {activeView} transactions found
                                    </div>
                                    <div className="text-slate-500 text-sm">
                                        Try selecting a different month or add some transactions
                                    </div>
                                </motion.div>
                            ) : (
                                /* Content Grid */
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Pie Chart Section */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 }}
                                        className="bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-2xl p-8"
                                    >
                                        <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">
                                            {activeView === 'expense' ? 'Spending' : 'Income'} Distribution
                                        </h3>
                                        <div className="flex justify-center mb-8">
                                            <PieChart data={categoryEntries} size={300} />
                                        </div>
                                        
                                        {/* Legend */}
                                        <div className="grid grid-cols-2 gap-4">
                                            {categoryEntries.map((item, index) => (
                                                <div key={index} className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl">
                                                    <div className="w-4 h-4 rounded-sm shadow-sm" style={{ backgroundColor: item.color }}></div>
                                                    <span className="text-sm font-medium text-slate-700">{item.category}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>

                                    {/* Transaction List Section */}
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.6 }}
                                        className="bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-2xl p-8"
                                    >
                                        <h3 className="text-xl font-bold text-slate-800 mb-6 capitalize">
                                            {activeView} Breakdown
                                        </h3>
                                        <div className="space-y-4">
                                            {categoryEntries.map((item, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.1 * index }}
                                                    className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-xl hover:bg-slate-100/50 transition-all duration-200"
                                                >
                                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: item.color + '20' }}>
                                                        <Tag className="w-6 h-6" style={{ color: item.color }} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-slate-800 text-lg">{item.category}</div>
                                                        <div className="text-sm text-slate-500">{item.percentage.toFixed(1)}% of total</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`font-bold text-lg ${activeView === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                                                            {activeView === 'expense' ? '-' : '+'}₹{item.amount.toFixed(2)}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </>
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
            <button onClick={() => navigate('/analytics')} className="flex flex-col items-center gap-1 py-2 text-blue-600 hover:text-slate-600 transition-colors">
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
            <button onClick={() => navigate('/ai')} className="flex flex-col items-center gap-1 py-2 text-slate-400  hover:text-blue-700 transition-colors">
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

export default MyMoneyApp;