import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { Plus, Trash2, Eye } from 'lucide-react';

const itemSchema = z.object({
  name: z.string().min(1, 'Name required'),
  sku: z.string().optional(),
  category: z.string().min(1, 'Category required'),
  unit: z.string().min(1, 'Unit required'),
  supplier: z.string().optional(),
  location: z.string().optional(),
});

type ItemForm = z.infer<typeof itemSchema>;

export default function Inventory() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ['inventory-items', search],
    queryFn: async () => {
      const res = await client.get(`/inventory/items?search=${search}&limit=100`);
      return res.data.items;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ItemForm) => client.post('/inventory/items', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success('Item created');
      reset();
      setShowForm(false);
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to create'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => client.delete(`/inventory/items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success('Item deleted');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to delete'),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white">Inventory</h1>
          <p className="text-gray-400">Manage your inventory items</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            reset();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-lavender hover:from-cyan-600 hover:to-lavender/90 transition"
        >
          <Plus size={20} /> Add Item
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items..."
          className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50"
        />
      </div>

      {showForm && (
        <div className="glass p-6 rounded-xl">
          <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <input
                  {...register('name')}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">SKU</label>
                <input
                  {...register('sku')}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <input
                  {...register('category')}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
                {errors.category && <p className="text-red-400 text-sm mt-1">{errors.category.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Unit</label>
                <input
                  {...register('unit')}
                  placeholder="e.g., pcs, kg, liters"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
                {errors.unit && <p className="text-red-400 text-sm mt-1">{errors.unit.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Supplier</label>
                <input
                  {...register('supplier')}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                <input
                  {...register('location')}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-lavender text-white font-semibold hover:from-cyan-600 hover:to-lavender/90 transition disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Item'}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items?.map((item: any) => (
            <div key={item.id} className="glass p-6 rounded-xl hover:bg-white/10 transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                  <p className="text-sm text-gray-400">{item.category}</p>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(item.id)}
                  disabled={deleteMutation.isPending}
                  className="text-rose hover:text-rose/80 transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="space-y-2 mb-4 text-sm text-gray-300">
                {item.sku && <p>SKU: {item.sku}</p>}
                <p>Unit: {item.unit}</p>
                {item.supplier && <p>Supplier: {item.supplier}</p>}
                {item.location && <p>Location: {item.location}</p>}
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-400">
                  {item.sizes?.length || 0} size variant{(item.sizes?.length || 0) !== 1 ? 's' : ''}
                </p>
                {item.sizes?.map((size: any) => (
                  <div key={size.id} className="flex justify-between text-xs bg-white/5 p-2 rounded">
                    <span className="text-gray-300">{size.sizeLabel}</span>
                    <span className={size.quantity < size.minThreshold ? 'text-rose' : 'text-mint'}>
                      {size.quantity} {item.unit}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate(`/inventory/${item.id}`)}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm"
              >
                <Eye size={16} /> View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
