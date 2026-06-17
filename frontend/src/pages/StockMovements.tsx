import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import client from '../api/client';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';

const movementSchema = z.object({
  itemId: z.string().min(1, 'Item required'),
  sizeLabel: z.string().min(1, 'Size required'),
  type: z.enum(['IN', 'OUT']),
  quantity: z.string().min(1, 'Quantity required'),
  date: z.string().min(1, 'Date required'),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type MovementForm = z.infer<typeof movementSchema>;

export default function StockMovements() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<MovementForm>({
    resolver: zodResolver(movementSchema),
  });

  const { data: movements, isLoading } = useQuery({
    queryKey: ['stock-movements'],
    queryFn: async () => {
      const res = await client.get('/stock?limit=100');
      return res.data.movements;
    },
  });

  const { data: items } = useQuery({
    queryKey: ['inventory-items-select'],
    queryFn: async () => {
      const res = await client.get('/inventory/items?limit=1000');
      return res.data.items;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: MovementForm) =>
      client.post('/stock', {
        ...data,
        quantity: parseFloat(data.quantity),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success('Stock movement recorded');
      reset();
      setShowForm(false);
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to record movement'),
  });

  // selectedItem not used in render, commenting out
  // const selectedItem = items?.find((item: any) => 
  //   item.id === (register('itemId').name ? (document.querySelector('select[name="itemId"]') as HTMLSelectElement)?.value : '')
  // );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white">Stock Movements</h1>
          <p className="text-gray-400">Log inbound and outbound stock movements</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            reset();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-lavender hover:from-cyan-600 hover:to-lavender/90 transition"
        >
          <Plus size={20} /> Log Movement
        </button>
      </div>

      {showForm && (
        <div className="glass p-6 rounded-xl">
          <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Item</label>
                <select
                  {...register('itemId')}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                >
                  <option value="">Select item...</option>
                  {items?.map((item: any) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                {errors.itemId && <p className="text-red-400 text-sm mt-1">{errors.itemId.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Size</label>
                <input
                  {...register('sizeLabel')}
                  placeholder="e.g., Small, M, Large"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
                {errors.sizeLabel && <p className="text-red-400 text-sm mt-1">{errors.sizeLabel.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                <select
                  {...register('type')}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                >
                  <option value="IN">Inbound (IN)</option>
                  <option value="OUT">Outbound (OUT)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Quantity</label>
                <input
                  {...register('quantity')}
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
                {errors.quantity && <p className="text-red-400 text-sm mt-1">{errors.quantity.message}</p>}
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
                <label className="block text-sm font-medium text-gray-300 mb-2">Reference (PO/DO)</label>
                <input
                  {...register('reference')}
                  placeholder="e.g., PO-001"
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
                {createMutation.isPending ? 'Recording...' : 'Record Movement'}
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
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Item</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Size</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-300">Type</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-300">Quantity</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {movements?.map((movement: any) => (
                <tr key={movement.id} className="hover:bg-white/5 transition">
                  <td className="px-6 py-3 text-sm text-gray-300">{new Date(movement.date).toLocaleDateString()}</td>
                  <td className="px-6 py-3 text-sm text-white font-medium">{movement.item?.name || 'N/A'}</td>
                  <td className="px-6 py-3 text-sm text-gray-300">{movement.sizeLabel}</td>
                  <td className="px-6 py-3 text-center">
                    <span className={`flex items-center justify-center gap-1 px-2 py-1 rounded text-xs font-semibold w-fit mx-auto ${
                      movement.type === 'IN' ? 'bg-mint/20 text-mint' : 'bg-rose/20 text-rose'
                    }`}>
                      {movement.type === 'IN' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {movement.type}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-right font-semibold text-white">{movement.quantity}</td>
                  <td className="px-6 py-3 text-sm text-gray-300">{movement.reference || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
