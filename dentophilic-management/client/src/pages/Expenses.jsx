import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Receipt,
  Plus,
  Search,
  DollarSign,
  Calendar,
  Trash2,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/Common/EmptyState';
import Modal from '../components/Common/Modal';

export default function Expenses() {
  const { isAdmin } = useAuth();
  const { success, error } = useToast();

  const [expenses, setExpenses] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: 'Dental Supplies & Lab Fees',
    description: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMode: 'UPI'
  });

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      let query = '';
      if (filterCategory !== 'ALL') query = `?category=${encodeURIComponent(filterCategory)}`;

      const res = await api.get(`/expenses${query}`);
      if (res.success) {
        setExpenses(res.expenses || []);
        setTotalAmount(res.totalAmount || 0);
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [filterCategory]);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || parseFloat(formData.amount) <= 0) {
      error('Please provide a valid description and positive amount');
      return;
    }

    try {
      await api.post('/expenses', {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      success('Clinic expense recorded');
      setIsCreateModalOpen(false);
      setFormData({
        category: 'Dental Supplies & Lab Fees',
        description: '',
        amount: '',
        expenseDate: new Date().toISOString().split('T')[0],
        paymentMode: 'UPI'
      });
      fetchExpenses();
    } catch (err) {
      error(err.message || 'Failed to record expense');
    }
  };

  const handleDeleteExpense = async (id, desc) => {
    if (!window.confirm(`Move expense "${desc}" to Recycle Bin?`)) return;
    try {
      await api.delete(`/expenses/${id}`);
      success('Expense moved to Recycle Bin');
      fetchExpenses();
    } catch (err) {
      error(err.message || 'Failed to delete expense');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-white">
            Clinic Expenses & Overhead
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track lab charges, dental consumable bills, utility overheads, and clinic expenditures.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Summary Card & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl glass-card border border-slate-800">
          <div className="text-slate-400 text-xs mb-1">Total Recorded Expenses</div>
          <div className="text-2xl font-bold text-white font-mono">
            ₹{totalAmount.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block font-mono">
            {expenses.length} transaction(s)
          </span>
        </div>

        <div className="sm:col-span-2 p-5 rounded-2xl glass-panel border border-slate-800 flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 font-semibold block mb-1.5">Filter by Category:</span>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl glass-input text-white text-xs"
            >
              <option value="ALL">All Categories</option>
              <option value="Dental Supplies & Lab Fees">Dental Supplies & Lab Fees</option>
              <option value="Clinic Rent & Maintenance">Clinic Rent & Maintenance</option>
              <option value="Electricity & Utilities">Electricity & Utilities</option>
              <option value="Staff Salaries & Stipends">Staff Salaries & Stipends</option>
              <option value="Equipment & Autoclave Service">Equipment & Autoclave Service</option>
              <option value="Marketing & Signage">Marketing & Signage</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No clinic expenses recorded"
            description="Record clinic lab bills, dental supply purchases, or utility bills to maintain accurate profit & loss analytics."
            actionLabel="Record Expense"
            onAction={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 text-[10px] uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Payment Mode</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono text-slate-300">
                      {exp.expenseDate}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-white">
                      {exp.description}
                    </td>
                    <td className="p-4 font-mono text-slate-400">
                      {exp.paymentMode}
                    </td>
                    <td className="p-4 font-mono font-bold text-rose-400 text-sm">
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(exp.id, exp.description)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400"
                        title="Delete expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RECORD EXPENSE MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Record Clinic Expense"
        subtitle="Log operational overheads, vendor payments, or supply purchases."
      >
        <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Expense Category *</label>
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
            >
              <option value="Dental Supplies & Lab Fees">Dental Supplies & Lab Fees (Ceramic Crowns, Aligners, etc.)</option>
              <option value="Clinic Rent & Maintenance">Clinic Rent & Maintenance</option>
              <option value="Electricity & Utilities">Electricity & Utilities</option>
              <option value="Staff Salaries & Stipends">Staff Salaries & Stipends</option>
              <option value="Equipment & Autoclave Service">Equipment & Autoclave Service</option>
              <option value="Marketing & Signage">Marketing & Signage</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Description / Bill Memo *</label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Dental Lab Bill - Zirconia Crown for Patient P-001"
              className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Amount (₹) *</label>
              <input
                type="number"
                required
                min="1"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                placeholder="₹"
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-sm font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.expenseDate}
                onChange={e => setFormData({ ...formData, expenseDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Payment Mode</label>
            <select
              value={formData.paymentMode}
              onChange={e => setFormData({ ...formData, paymentMode: e.target.value })}
              className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
            >
              <option value="UPI">UPI (GPay / PhonePe)</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Bank Transfer">Bank Transfer / NEFT</option>
            </select>
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
              Save Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
