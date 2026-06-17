import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import client from '../api/client';
import { TrendingUp, TrendingDown, Wallet, Package } from 'lucide-react';

export default function Dashboard() {
  const { data: summary } = useQuery({
    queryKey: ['transactions-summary'],
    queryFn: async () => {
      const res = await client.get('/transactions/summary');
      return res.data;
    },
  });

  const { data: budgetProgress } = useQuery({
    queryKey: ['budgets-progress'],
    queryFn: async () => {
      const res = await client.get('/budgets/progress');
      return res.data;
    },
  });

  const { data: inventorySummary } = useQuery({
    queryKey: ['inventory-summary'],
    queryFn: async () => {
      const res = await client.get('/inventory/summary');
      return res.data;
    },
  });

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: async () => {
      const res = await client.get('/inventory/low-stock');
      return res.data;
    },
  });

  const chartData = summary?.monthly ? Object.entries(summary.monthly).map(([month, data]: any) => ({
    month: month.substring(5),
    income: data.income,
    expense: data.expense,
  })) : [];

  const categoryData = summary?.monthly ? Object.entries(summary.monthly).map(([, data]: any) => ({
    name: Object.keys(data)[0] || 'Other',
    value: Object.values(data)[0] || 0,
  })) : [];

  const COLORS = ['#7dd3fc', '#c4b5fd', '#6ee7b7', '#fda4af', '#fbbf24'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Welcome back! Here's your financial overview.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Balance</p>
              <p className="text-2xl font-bold text-white">${summary?.net?.toFixed(2) || '0.00'}</p>
            </div>
            <Wallet className="w-10 h-10 text-cyan-400" />
          </div>
        </div>

        <div className="glass p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Income (Month)</p>
              <p className="text-2xl font-bold text-mint">${summary?.totalIncome?.toFixed(2) || '0.00'}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-mint" />
          </div>
        </div>

        <div className="glass p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Expenses (Month)</p>
              <p className="text-2xl font-bold text-rose">${summary?.totalExpense?.toFixed(2) || '0.00'}</p>
            </div>
            <TrendingDown className="w-10 h-10 text-rose" />
          </div>
        </div>

        <div className="glass p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Inventory Value</p>
              <p className="text-2xl font-bold text-lavender">${inventorySummary?.totalValue?.toFixed(2) || '0.00'}</p>
            </div>
            <Package className="w-10 h-10 text-lavender" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Income vs Expenses</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none' }} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#7dd3fc" strokeWidth={2} />
              <Line type="monotone" dataKey="expense" stroke="#fda4af" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Budget Status</h2>
          <div className="space-y-3">
            {budgetProgress?.slice(0, 4).map((budget: any) => (
              <div key={budget.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{budget.category}</span>
                  <span className="text-cyan-400">{budget.percentage.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-lavender h-2 rounded-full"
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStock && lowStock.length > 0 && (
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Low Stock Alerts</h2>
          <div className="space-y-2">
            {lowStock.slice(0, 5).map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">{item.itemName}</p>
                  <p className="text-sm text-gray-400">{item.sizeLabel} - {item.quantity} left</p>
                </div>
                <span className="text-rose font-semibold">{item.quantity < item.minThreshold * 0.5 ? 'Critical' : 'Warning'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
