import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import client from '../api/client';
import { Plus, Trash2 } from 'lucide-react';

const budgetSchema = z.object({
  category: z.string().min(1, 'Category required'),
  amount: z.string().min(1, 'Amount required'),
});

type BudgetForm = z.infer<typeof budgetSchema>;

export default function Budgets() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<BudgetForm>({
    resolver: zodResolver(budgetSchema),
  });

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { data: budgets, isLoading } = useQuery({
    queryKey: ['budgets', month, year],
    queryFn: async () => {
      const res = await client.get(`/budgets?month=${month}&year=${year}`);
      return res.data;
    },
  });

  const { data: progress } = useQuery({
    queryKey: ['budgets-progress', month, year],
    queryFn: async () => {
      const res = await client.get(`/budgets/progress?month=${month}&year=${year}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: BudgetForm) =>
      client.post('/budgets', {
        ...data,
        amount: parseFloat(data.amount),
        month,
        year,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgets-progress'] });
      toast.success('Budget created');
      reset();
      setShowForm(false);
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to create'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => client.delete(`/budgets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgets-progress'] });
      toast.success('Budget deleted');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to delete'),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white">Budgets</h1>
          <p className="text-gray-400">{new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            reset();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-lavender hover:from-cyan-600 hover:to-lavender/90 transition"
        >
          <Plus size={20} /> Add Budget
        </button>
      </div>

      {showForm && (
        <div className="glass p-6 rounded-xl">
          <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <input
                  {...register('category')}
                  placeholder="e.g., Groceries"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
                {errors.category && <p className="text-red-400 text-sm mt-1">{errors.category.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Budget Amount</label>
                <input
                  {...register('amount')}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
                {errors.amount && <p className="text-red-400 text-sm mt-1">{errors.amount.message}</p>}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-lavender text-white font-semibold hover:from-cyan-600 hover:to-lavender/90 transition disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Budget'}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {progress?.map((budget: any) => (
            <div key={budget.id} className="glass p-6 rounded-xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{budget.category}</h3>
                  <p className="text-sm text-gray-400">Budget: ${budget.amount.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(budget.id)}
                  disabled={deleteMutation.isPending}
                  className="text-rose hover:text-rose/80 transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Spent: ${budget.spent.toFixed(2)}</span>
                  <span className={budget.percentage > 100 ? 'text-rose' : 'text-cyan-400'}>
                    {budget.percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      budget.percentage > 100
                        ? 'bg-gradient-to-r from-rose to-rose/50'
                        : budget.percentage > 80
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                        : 'bg-gradient-to-r from-cyan-500 to-lavender'
                    }`}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  Remaining: ${Math.max(budget.remaining, 0).toFixed(2)}
                </p>
              </div>

              {budget.percentage > 100 && (
                <div className="mt-3 p-2 bg-rose/10 border border-rose/20 rounded text-rose text-xs">
                  ⚠️ Budget exceeded by ${(budget.spent - budget.amount).toFixed(2)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
