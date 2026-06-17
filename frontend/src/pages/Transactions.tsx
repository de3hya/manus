import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import client from '../api/client';
import { Plus, Trash2, Download } from 'lucide-react';

const transactionSchema = z.object({
  title: z.string().min(1, 'Title required'),
  amount: z.string().min(1, 'Amount required'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Category required'),
  date: z.string().min(1, 'Date required'),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

type TransactionForm = z.infer<typeof transactionSchema>;

export default function Transactions() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TransactionForm>({
    resolver: zodResolver(transactionSchema),
  });

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const res = await client.get('/transactions?limit=100');
      return res.data.transactions;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: TransactionForm) =>
      client.post('/transactions', { ...data, amount: parseFloat(data.amount) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transaction created');
      reset();
      setShowForm(false);
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to create'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => client.delete(`/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transaction deleted');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to delete'),
  });

  const handleExportCSV = async () => {
    try {
      const res = await client.get('/transactions/export/csv', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'transactions.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('CSV exported');
    } catch (error: any) {
      toast.error('Failed to export');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white">Transactions</h1>
          <p className="text-gray-400">Manage your income and expenses</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            <Download size={20} /> Export
          </button>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              reset();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-lavender hover:from-cyan-600 hover:to-lavender/90 transition"
          >
            <Plus size={20} /> Add Transaction
          </button>
        </div>
      </div>

      {showForm && (
        <div className="glass p-6 rounded-xl">
          <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input
                  {...register('title')}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
                {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                <input
                  {...register('amount')}
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
                {errors.amount && <p className="text-red-400 text-sm mt-1">{errors.amount.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                <select
                  {...register('type')}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <input
                  {...register('category')}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
                {errors.category && <p className="text-red-400 text-sm mt-1">{errors.category.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                <input
                  {...register('date')}
                  type="date"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
                {errors.date && <p className="text-red-400 text-sm mt-1">{errors.date.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Payment Method</label>
                <input
                  {...register('paymentMethod')}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
              <textarea
                {...register('notes')}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-lavender text-white font-semibold hover:from-cyan-600 hover:to-lavender/90 transition disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Transaction'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  reset();
                }}
                className="flex-1 py-2 px-4 rounded-lg bg-white/10 hover:bg-white/20 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Title</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Category</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Type</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-300">Amount</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-300">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {transactions?.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-white/5 transition">
                  <td className="px-6 py-3 text-sm text-gray-300">{new Date(tx.date).toLocaleDateString()}</td>
                  <td className="px-6 py-3 text-sm text-white font-medium">{tx.title}</td>
                  <td className="px-6 py-3 text-sm text-gray-300">{tx.category}</td>
                  <td className="px-6 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      tx.type === 'income' ? 'bg-mint/20 text-mint' : 'bg-rose/20 text-rose'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-right font-semibold text-white">${tx.amount.toFixed(2)}</td>
                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() => deleteMutation.mutate(tx.id)}
                      disabled={deleteMutation.isPending}
                      className="text-rose hover:text-rose/80 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
