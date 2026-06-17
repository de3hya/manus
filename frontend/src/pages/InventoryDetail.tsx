import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import client from '../api/client';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

const sizeSchema = z.object({
  sizeLabel: z.string().min(1, 'Size label required'),
  quantity: z.string().min(1, 'Quantity required'),
  minThreshold: z.string().optional(),
  purchasePrice: z.string().min(1, 'Purchase price required'),
  sellingPrice: z.string().optional(),
});

type SizeForm = z.infer<typeof sizeSchema>;

export default function InventoryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSizeForm, setShowSizeForm] = React.useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SizeForm>({
    resolver: zodResolver(sizeSchema),
  });

  const { data: item, isLoading } = useQuery({
    queryKey: ['inventory-item', id],
    queryFn: async () => {
      const res = await client.get(`/inventory/items/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const createSizeMutation = useMutation({
    mutationFn: (data: SizeForm) =>
      client.post(`/inventory/items/${id}/sizes`, {
        ...data,
        quantity: parseFloat(data.quantity),
        minThreshold: data.minThreshold ? parseFloat(data.minThreshold) : 0,
        purchasePrice: parseFloat(data.purchasePrice),
        sellingPrice: data.sellingPrice ? parseFloat(data.sellingPrice) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-item', id] });
      toast.success('Size added');
      reset();
      setShowSizeForm(false);
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to add size'),
  });

  const deleteSizeMutation = useMutation({
    mutationFn: (sizeId: string) => client.delete(`/inventory/items/${id}/sizes/${sizeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-item', id] });
      toast.success('Size deleted');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to delete size'),
  });

  if (isLoading) {
    return <div className="text-center py-8 text-gray-400">Loading...</div>;
  }

  if (!item) {
    return <div className="text-center py-8 text-gray-400">Item not found</div>;
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/inventory')}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
      >
        <ArrowLeft size={20} /> Back to Inventory
      </button>

      <div>
        <h1 className="text-4xl font-bold text-white">{item.name}</h1>
        <p className="text-gray-400">{item.category}</p>
      </div>

      {/* Item Details */}
      <div className="glass p-6 rounded-xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {item.sku && (
            <div>
              <p className="text-gray-400 text-sm mb-1">SKU</p>
              <p className="text-white font-semibold">{item.sku}</p>
            </div>
          )}
          <div>
            <p className="text-gray-400 text-sm mb-1">Unit</p>
            <p className="text-white font-semibold">{item.unit}</p>
          </div>
          {item.supplier && (
            <div>
              <p className="text-gray-400 text-sm mb-1">Supplier</p>
              <p className="text-white font-semibold">{item.supplier}</p>
            </div>
          )}
          {item.location && (
            <div>
              <p className="text-gray-400 text-sm mb-1">Location</p>
              <p className="text-white font-semibold">{item.location}</p>
            </div>
          )}
        </div>
      </div>

      {/* Sizes */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Size Variants</h2>
          <button
            onClick={() => setShowSizeForm(!showSizeForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-lavender hover:from-cyan-600 hover:to-lavender/90 transition"
          >
            <Plus size={20} /> Add Size
          </button>
        </div>

        {showSizeForm && (
          <div className="glass p-6 rounded-xl">
            <form onSubmit={handleSubmit((data) => createSizeMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Size Label</label>
                  <input
                    {...register('sizeLabel')}
                    placeholder="e.g., Small, M, Large"
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  />
                  {errors.sizeLabel && <p className="text-red-400 text-sm mt-1">{errors.sizeLabel.message}</p>}
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">Min Threshold</label>
                  <input
                    {...register('minThreshold')}
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Purchase Price</label>
                  <input
                    {...register('purchasePrice')}
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  />
                  {errors.purchasePrice && <p className="text-red-400 text-sm mt-1">{errors.purchasePrice.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Selling Price (optional)</label>
                <input
                  {...register('sellingPrice')}
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createSizeMutation.isPending}
                  className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-lavender text-white font-semibold hover:from-cyan-600 hover:to-lavender/90 transition disabled:opacity-50"
                >
                  {createSizeMutation.isPending ? 'Adding...' : 'Add Size'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSizeForm(false);
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {item.sizes?.map((size: any) => (
            <div key={size.id} className="glass p-4 rounded-xl">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{size.sizeLabel}</h3>
                  <p className="text-sm text-gray-400">Min: {size.minThreshold}</p>
                </div>
                <button
                  onClick={() => deleteSizeMutation.mutate(size.id)}
                  disabled={deleteSizeMutation.isPending}
                  className="text-rose hover:text-rose/80 transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Quantity:</span>
                  <span className={size.quantity < size.minThreshold ? 'text-rose font-semibold' : 'text-mint'}>
                    {size.quantity} {item.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Purchase Price:</span>
                  <span className="text-white">${size.purchasePrice.toFixed(2)}</span>
                </div>
                {size.sellingPrice && (
                  <div className="flex justify-between">
                    <span className="text-gray-300">Selling Price:</span>
                    <span className="text-white">${size.sellingPrice.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-300">Total Value:</span>
                  <span className="text-cyan-400 font-semibold">
                    ${(size.quantity * size.purchasePrice).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stock Movements */}
      {item.movements && item.movements.length > 0 && (
        <div className="glass p-6 rounded-xl">
          <h2 className="text-2xl font-bold text-white mb-4">Recent Stock Movements</h2>
          <div className="space-y-2">
            {item.movements.slice(0, 10).map((movement: any) => (
              <div key={movement.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">{movement.sizeLabel}</p>
                  <p className="text-sm text-gray-400">{new Date(movement.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className={`font-semibold ${movement.type === 'IN' ? 'text-mint' : 'text-rose'}`}>
                    {movement.type === 'IN' ? '+' : '-'}{movement.quantity}
                  </span>
                  <p className="text-xs text-gray-400">{movement.reference || 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
