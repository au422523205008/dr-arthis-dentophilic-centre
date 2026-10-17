import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  UserCheck,
  Plus,
  KeyRound,
  Shield,
  Edit,
  Trash2,
  Lock,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Badge from '../components/Common/Badge';
import EmptyState from '../components/Common/EmptyState';
import Modal from '../components/Common/Modal';

const ALL_PERMISSION_KEYS = [
  { key: 'VIEW_FINANCES', label: 'View Overall Revenue & Income Dashboards' },
  { key: 'VIEW_EXPENSES', label: 'Access Clinic Expenses & Overhead' },
  { key: 'MANAGE_STAFF', label: 'Manage Staff Accounts & Security' },
  { key: 'MANAGE_SETTINGS', label: 'Edit Clinic Profile & Working Hours' },
  { key: 'VIEW_AUDIT_LOGS', label: 'Inspect Immutable Audit Trail Logs' },
  { key: 'MANAGE_BACKUPS', label: 'Download & Restore Database Backups' },
  { key: 'PERMANENT_DELETE', label: 'Permanently Purge from Recycle Bin' },
  { key: 'MANAGE_SERVICES_PRICING', label: 'Modify Treatment Fees & Catalog' },
  { key: 'EXPORT_DATA', label: 'Export Complete Patient & Financial CSV' },
  { key: 'DELETE_PATIENTS', label: 'Delete Patients from EMR' },
  { key: 'DELETE_APPOINTMENTS', label: 'Delete Appointments' },
  { key: 'DELETE_BILLS', label: 'Delete Invoices & Bills' }
];

export default function StaffManagement() {
  const { user: currentUser } = useAuth();
  const { success, error } = useToast();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Forms
  const [createForm, setCreateForm] = useState({
    username: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'ATTENDER'
  });

  const [newPassword, setNewPassword] = useState('');
  const [userPermissions, setUserPermissions] = useState({});

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/staff');
      if (res.success) {
        setUsers(res.users || []);
      }
    } catch (err) {
      console.error('Failed to load staff:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!createForm.username || !createForm.name || !createForm.password) {
      error('Username, full name, and password are required');
      return;
    }
    try {
      await api.post('/staff', createForm);
      success(`Staff account for ${createForm.name} created successfully`);
      setIsCreateModalOpen(false);
      setCreateForm({
        username: '',
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'ATTENDER'
      });
      fetchUsers();
    } catch (err) {
      error(err.message || 'Failed to create staff member');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedUser || !newPassword || newPassword.length < 6) {
      error('Password must be at least 6 characters');
      return;
    }
    try {
      await api.post(`/staff/${selectedUser.id}/reset-password`, { newPassword });
      success(`Password reset for ${selectedUser.name}`);
      setIsResetModalOpen(false);
      setSelectedUser(null);
      setNewPassword('');
    } catch (err) {
      error(err.message || 'Failed to reset password');
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      await api.put(`/staff/${user.id}`, { status: newStatus });
      success(`User account status updated to ${newStatus}`);
      fetchUsers();
    } catch (err) {
      error(err.message || 'Failed to update user status');
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    try {
      await api.put(`/staff/${selectedUser.id}`, { permissions: userPermissions });
      success(`Permissions updated for ${selectedUser.name}`);
      setIsPermModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      error(err.message || 'Failed to update permissions');
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Move staff member "${name}" to the Recycle Bin?`)) return;
    try {
      await api.delete(`/staff/${id}`);
      success(`Staff member moved to Recycle Bin`);
      fetchUsers();
    } catch (err) {
      error(err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-white">
            Staff Management & Access Control
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage Attender/Receptionist accounts, enforce role-based access, and configure custom permissions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff List */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-content-subtle text-sm">Loading staff members...</div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="No staff accounts found"
            description="Add receptionist or attender accounts to give staff controlled access to appointments and patient check-in."
            actionLabel="Add Staff Member"
            onAction={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-500/10 text-content-subtle text-[10px] uppercase font-semibold border-b border-[var(--border-main)]">
                <tr>
                  <th className="p-4">Staff Member</th>
                  <th className="p-4">Username</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4">Last Login</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)] text-content-main">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-purple-500/5 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-content-main text-sm">{u.name}</div>
                      <div className="text-content-subtle text-[11px] font-mono">{u.email || u.phone || 'No contact specified'}</div>
                    </td>

                    <td className="p-4 font-mono text-purple-400 font-semibold">
                      @{u.username}
                    </td>

                    <td className="p-4">
                      <Badge status={u.role} />
                    </td>

                    <td className="p-4">
                      <Badge status={u.status} />
                    </td>

                    <td className="p-4 font-mono text-content-subtle text-[11px]">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                    </td>

                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* Permissions Matrix button */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUser(u);
                          setUserPermissions(u.permissions || {});
                          setIsPermModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 font-medium text-[11px] cursor-pointer"
                        title="Configure Permissions Matrix"
                      >
                        Permissions
                      </button>

                      {/* Reset Password */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUser(u);
                          setNewPassword('');
                          setIsResetModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[11px] cursor-pointer"
                      >
                        Reset Key
                      </button>

                      {/* Toggle status */}
                      {u.id !== currentUser?.id && (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className="px-2.5 py-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white text-[11px] cursor-pointer"
                        >
                          {u.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                        </button>
                      )}

                      {/* Delete */}
                      {u.id !== currentUser?.id && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400"
                          title="Delete staff account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE STAFF MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Clinic Staff Account"
        subtitle="Create an Attender or Administrator account."
      >
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={createForm.name}
              onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="e.g. Priya R (Receptionist)"
              className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Username *</label>
              <input
                type="text"
                required
                value={createForm.username}
                onChange={e => setCreateForm({ ...createForm, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                placeholder="priya"
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Role *</label>
              <select
                value={createForm.role}
                onChange={e => setCreateForm({ ...createForm, role: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
              >
                <option value="ATTENDER">Attender (Restricted)</option>
                <option value="ADMIN">Doctor / Administrator (Full Access)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={createForm.phone}
                onChange={e => setCreateForm({ ...createForm, phone: e.target.value })}
                placeholder="9876543210"
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={createForm.email}
                onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="staff@dentophilic.com"
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Initial Password *</label>
            <input
              type="password"
              required
              value={createForm.password}
              onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
              placeholder="Minimum 6 characters"
              className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer shadow-md shadow-purple-600/30"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>

      {/* RESET PASSWORD MODAL */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title={`Reset Password for ${selectedUser?.name}`}
        subtitle="Set a new secure password for this user."
      >
        <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">New Password (At least 6 chars) *</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer shadow-md shadow-purple-600/30"
            >
              Update Password
            </button>
          </div>
        </form>
      </Modal>

      {/* PERMISSIONS MATRIX MODAL */}
      <Modal
        isOpen={isPermModalOpen}
        onClose={() => setIsPermModalOpen(false)}
        title={`Configure Permissions - ${selectedUser?.name}`}
        subtitle={`Role: ${selectedUser?.role}. Granularly toggle what this account can access.`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 text-content-main text-[11px]">
            {selectedUser?.role === 'ADMIN' ? (
              <span className="text-purple-300 font-semibold">
                Administrator accounts retain master override access across all clinic modules by default.
              </span>
            ) : (
              <span>
                Attender accounts are restricted by default from viewing financials, expenses, audit logs, and backups. You can selectively grant additional capabilities below.
              </span>
            )}
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {ALL_PERMISSION_KEYS.map(p => (
              <label
                key={p.key}
                className="flex items-center justify-between p-3 rounded-xl glass-card cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-content-main">{p.label}</div>
                  <div className="text-[10px] text-purple-400 font-mono">{p.key}</div>
                </div>
                <input
                  type="checkbox"
                  checked={!!userPermissions[p.key]}
                  onChange={e => setUserPermissions({ ...userPermissions, [p.key]: e.target.checked })}
                  className="w-4 h-4 accent-purple-600 cursor-pointer"
                />
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--border-main)]">
            <button
              type="button"
              onClick={() => setIsPermModalOpen(false)}
              className="px-4 py-2 rounded-xl text-content-subtle hover:text-content-main"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSavePermissions}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer shadow-md shadow-purple-600/30"
            >
              Save Permissions Matrix
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
