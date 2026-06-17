import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import client from '../api/client';
import { useAuthStore } from '../store/authStore';
import { Plus, Trash2 } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(1, 'Name required'),
  currency: z.string().min(1, 'Currency required'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const categorySchema = z.object({
  name: z.string().min(1, 'Name required'),
  type: z.enum(['income', 'expense']),
  icon: z.string().optional(),
  color: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
type CategoryForm = z.infer<typeof categorySchema>;

export default function Settings() {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'currency' | 'categories' | 'password'>('profile');
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', currency: user?.currency || 'USD' },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const categoryForm = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await client.get('/categories');
      return res.data;
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileForm) => client.put('/user/me', data),
    onSuccess: (res) => {
      setUser(res.data);
      toast.success('Profile updated');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to update'),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: PasswordForm) =>
      client.put('/user/me/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    onSuccess: () => {
      toast.success('Password changed');
      passwordForm.reset();
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to change password'),
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: CategoryForm) => client.post('/categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created');
      categoryForm.reset();
      setShowCategoryForm(false);
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to create'),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => client.delete(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to delete'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-white">Settings</h1>
        <p className="text-gray-400">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        {(['profile', 'currency', 'categories', 'password'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium transition capitalize ${
              activeTab === tab
                ? 'border-b-2 border-cyan-400 text-cyan-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="glass p-6 rounded-xl max-w-2xl">
          <form onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <input
                {...profileForm.register('name')}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              />
              {profileForm.formState.errors.name && (
                <p className="text-red-400 text-sm mt-1">{profileForm.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-gray-400 cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="py-2 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-lavender text-white font-semibold hover:from-cyan-600 hover:to-lavender/90 transition disabled:opacity-50"
            >
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Currency Tab */}
      {activeTab === 'currency' && (
        <div className="glass p-6 rounded-xl max-w-2xl">
          <form onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Currency</label>
              <select
                {...profileForm.register('currency')}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="py-2 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-lavender text-white font-semibold hover:from-cyan-600 hover:to-lavender/90 transition disabled:opacity-50"
            >
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Currency'}
            </button>
          </form>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <button
            onClick={() => setShowCategoryForm(!showCategoryForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-lavender hover:from-cyan-600 hover:to-lavender/90 transition"
          >
            <Plus size={20} /> Add Category
          </button>

          {showCategoryForm && (
            <div className="glass p-6 rounded-xl">
              <form onSubmit={categoryForm.handleSubmit((data) => createCategoryMutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                    <input
                      {...categoryForm.register('name')}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                    />
                    {categoryForm.formState.errors.name && (
                      <p className="text-red-400 text-sm mt-1">{categoryForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                    <select
                      {...categoryForm.register('type')}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                    >
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={createCategoryMutation.isPending}
                    className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-lavender text-white font-semibold hover:from-cyan-600 hover:to-lavender/90 transition disabled:opacity-50"
                  >
                    {createCategoryMutation.isPending ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCategoryForm(false);
                      categoryForm.reset();
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
            {categories?.map((cat: any) => (
              <div key={cat.id} className="glass p-4 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-white font-medium">{cat.name}</p>
                  <p className="text-sm text-gray-400 capitalize">{cat.type}</p>
                </div>
                <button
                  onClick={() => deleteCategoryMutation.mutate(cat.id)}
                  disabled={deleteCategoryMutation.isPending}
                  className="text-rose hover:text-rose/80 transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="glass p-6 rounded-xl max-w-2xl">
          <form onSubmit={passwordForm.handleSubmit((data) => changePasswordMutation.mutate(data))} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
              <input
                {...passwordForm.register('currentPassword')}
                type="password"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-red-400 text-sm mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
              <input
                {...passwordForm.register('newPassword')}
                type="password"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-red-400 text-sm mt-1">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
              <input
                {...passwordForm.register('confirmPassword')}
                type="password"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-red-400 text-sm mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="py-2 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-lavender text-white font-semibold hover:from-cyan-600 hover:to-lavender/90 transition disabled:opacity-50"
            >
              {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
