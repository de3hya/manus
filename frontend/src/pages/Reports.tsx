import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import client from '../api/client';

export default function Reports() {
  const { data: summary } = useQuery({
    queryKey: ['transactions-summary'],
    queryFn: async () => {
      const res = await client.get('/transactions/summary');
      return res.data;
    },
  });

  const chartData = summary?.monthly ? Object.entries(summary.monthly).map(([month, data]: any) => ({
    month: month.substring(5),
    income: data.income,
    expense: data.expense,
    net: data.income - data.expense,
  })) : [];

  const COLORS = ['#7dd3fc', '#c4b5fd', '#6ee7b7', '#fda4af', '#fbbf24'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-white">Reports</h1>
        <p className="text-gray-400">Financial analytics and insights</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-xl">
          <p className="text-gray-400 text-sm mb-2">Total Income</p>
          <p className="text-3xl font-bold text-mint">${summary?.totalIncome?.toFixed(2) || '0.00'}</p>
        </div>
        <div className="glass p-6 rounded-xl">
          <p className="text-gray-400 text-sm mb-2">Total Expenses</p>
          <p className="text-3xl font-bold text-rose">${summary?.totalExpense?.toFixed(2) || '0.00'}</p>
        </div>
        <div className="glass p-6 rounded-xl">
          <p className="text-gray-400 text-sm mb-2">Net Profit/Loss</p>
          <p className={`text-3xl font-bold ${summary?.net >= 0 ? 'text-mint' : 'text-rose'}`}>
            ${summary?.net?.toFixed(2) || '0.00'}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Monthly Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none' }} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#7dd3fc" strokeWidth={2} />
              <Line type="monotone" dataKey="expense" stroke="#fda4af" strokeWidth={2} />
              <Line type="monotone" dataKey="net" stroke="#6ee7b7" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Income vs Expenses</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none' }} />
              <Legend />
              <Bar dataKey="income" fill="#7dd3fc" />
              <Bar dataKey="expense" fill="#fda4af" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Monthly Breakdown */}
      <div className="glass p-6 rounded-xl">
        <h2 className="text-xl font-semibold text-white mb-4">Monthly Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10">
              <tr>
                <th className="px-4 py-3 text-left text-gray-300">Month</th>
                <th className="px-4 py-3 text-right text-gray-300">Income</th>
                <th className="px-4 py-3 text-right text-gray-300">Expenses</th>
                <th className="px-4 py-3 text-right text-gray-300">Net</th>
                <th className="px-4 py-3 text-right text-gray-300">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {chartData.map((row: any) => (
                <tr key={row.month} className="hover:bg-white/5 transition">
                  <td className="px-4 py-3 text-white font-medium">{row.month}</td>
                  <td className="px-4 py-3 text-right text-mint">${row.income.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-rose">${row.expense.toFixed(2)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${row.net >= 0 ? 'text-mint' : 'text-rose'}`}>
                    ${row.net.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">
                    {row.income > 0 ? ((row.net / row.income) * 100).toFixed(1) : '0'}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
