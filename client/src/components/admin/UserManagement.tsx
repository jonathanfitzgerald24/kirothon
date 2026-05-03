import { useState, useEffect } from 'react';
import { UserPlus, Shield, Trash2 } from 'lucide-react';
import { adminApi } from '@/api/admin';
import { useAuth } from '@/contexts/AuthContext';
import type { User, Role } from '@/types';
import { formatDate } from '@/lib/fileUtils';

export const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('MEMBER');
  const [inviting, setInviting] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    adminApi.getUsers().then(setUsers).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      await adminApi.inviteUser(inviteEmail, inviteRole);
      setInviteEmail('');
      setShowInvite(false);
    } catch {
      // error handling
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, role: Role) => {
    try {
      await adminApi.changeRole(userId, role);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    } catch {
      // error handling
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      await adminApi.removeUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      // error handling
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Team Members</h2>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <UserPlus className="h-4 w-4" /> Invite
        </button>
      </div>

      {showInvite && (
        <form onSubmit={handleInvite} className="mb-4 flex gap-2 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@example.com"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as Role)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            aria-label="Role"
          >
            <option value="MEMBER">Member</option>
            <option value="MOD">Mod</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button type="submit" disabled={inviting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {inviting ? 'Sending...' : 'Send'}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
              <th className="px-4 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">Name</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">Email</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">Role</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">Last Login</th>
              <th className="px-4 py-2.5 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {users.map((user) => {
              const isSelf = user.id === currentUser?.id;
              return (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">{user.displayName}</td>
                  <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{user.email}</td>
                  <td className="px-4 py-2.5">
                    {isSelf ? (
                      <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <Shield className="h-3.5 w-3.5" /> {user.role}
                      </span>
                    ) : (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                        className="rounded border border-gray-200 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        aria-label={`Change role for ${user.displayName}`}
                      >
                        <option value="MEMBER">Member</option>
                        <option value="MOD">Mod</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {!isSelf && (
                      <button
                        onClick={() => handleRemove(user.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                        aria-label={`Remove ${user.displayName}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
