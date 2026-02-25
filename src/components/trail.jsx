import React, { useState, useEffect } from 'react';
import { BarChart3, Calculator, CreditCard, FolderOpen, Brain, Tag } from 'lucide-react';

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
          stroke="#f3f4f6"
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
          <div className="text-sm font-medium text-gray-600 capitalize">{activeView}s</div>
        </div>
      </div>
    </div>
  );
};

const Trail = () => {
  const [activeView, setActiveView] = useState('expense');
  const [categoryEntries, setCategoryEntries] = useState([]);

  useEffect(() => {
    // Fetch category entries from the backend
    fetchCategoryEntries();
  }, []);

  const fetchCategoryEntries = async () => {
    try {
      const response = await fetch('/api/category-entries');
      const data = await response.json();
      setCategoryEntries(data);
    } catch (error) {
      console.error('Error fetching category entries:', error);
    }
  };

  return (
    <>
      <div className="max-w-6xl mx-auto px-8">
        {/* Toggle Buttons */}
        <div className="flex gap-4 mb-8 justify-center">
          <button
            onClick={() => setActiveView('expense')}
            className={`py-3 px-8 rounded-lg text-base font-medium transition-colors ${
              activeView === 'expense'
                ? 'bg-teal-600 text-white shadow-lg'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            EXPENSE OVERVIEW
          </button>
          <button
            onClick={() => setActiveView('income')}
            className={`py-3 px-8 rounded-lg text-base font-medium transition-colors ${
              activeView === 'income'
                ? 'bg-teal-600 text-white shadow-lg'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            INCOME OVERVIEW
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pie Chart Section */}
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <div className="flex justify-center mb-6">
              <PieChart data={categoryEntries} size={300} />
            </div>
            
            {/* Legend */}
            <div className="grid grid-cols-2 gap-4">
              {categoryEntries.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-gray-600">{item.category}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction List Section */}
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 capitalize">{activeView} Breakdown</h3>
            <div className="space-y-4">
              {categoryEntries.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: item.color + '20' }}>
                    <Tag className="w-6 h-6" style={{ color: item.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 text-lg">{item.category}</div>
                    <div className="text-sm text-gray-500">{item.percentage.toFixed(1)}% of total</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold text-lg ${activeView === 'expense' ? 'text-red-500' : 'text-green-500'}`}>
                      {activeView === 'expense' ? '-' : '+'}₹{item.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200/50 shadow-2xl z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-6 py-3">
            <button className="flex flex-col items-center gap-1 py-2 text-slate-400 hover:text-slate-600 transition-colors">
              <FolderOpen className="w-5 h-5" />
              <span className="text-xs font-medium">Records</span>
            </button>
            <button className="flex flex-col items-center gap-1 py-2 text-blue-600">
              <BarChart3 className="w-5 h-5" />
              <span className="text-xs font-medium">Analysis</span>
            </button>
            <button className="flex flex-col items-center gap-1 py-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Calculator className="w-5 h-5" />
              <span className="text-xs font-medium">Budgets</span>
            </button>
            <button className="flex flex-col items-center gap-1 py-2 text-slate-400 hover:text-slate-600 transition-colors">
              <CreditCard className="w-5 h-5" />
              <span className="text-xs font-medium">SplitWise</span>
            </button>
            <button className="flex flex-col items-center gap-1 py-2 text-slate-400 hover:text-slate-600 transition-colors">
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
    </>
  );
};

export default Trail;
