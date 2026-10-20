import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Plus,
  AlertTriangle,
  Search,
  ArrowUpDown,
  History,
  Trash2,
  Edit,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/Common/EmptyState';
import Modal from '../components/Common/Modal';

export default function Inventory() {
  const { isAdmin, hasPermission } = useAuth();
  const { success, error } = useToast();

  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Forms
  const [createForm, setCreateForm] = useState({
    name: '',
    category: 'Restorative Materials',
    currentStock: 10,
    minThreshold: 5,
    unit: 'boxes',
    supplier: '',
    unitCost: ''
  });

  const [adjustForm, setAdjustForm] = useState({
    changeType: 'RESTOCK', // 'RESTOCK' | 'USED' | 'WASTAGE' | 'ADJUSTMENT'
    quantity: 5,
    notes: ''
  });

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      let query = `?lowStockOnly=${lowStockOnly}`;
      if (filterCategory !== 'ALL') query += `&category=${encodeURIComponent(filterCategory)}`;

      const res = await api.get(`/inventory${query}`);
      if (res.success) {
        setItems(res.items || []);
        setLowStockCount(res.lowStockCount || 0);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [filterCategory, lowStockOnly]);

  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!createForm.name) {
      error('Item name is required');
      return;
    }
    try {
      await api.post('/inventory', createForm);
      success('Inventory item added to clinic stock');
      setIsCreateModalOpen(false);
      setCreateForm({
        name: '',
        category: 'Restorative Materials',
        currentStock: 10,
        minThreshold: 5,
        unit: 'boxes',
        supplier: '',
        unitCost: ''
      });
      fetchInventory();
    } catch (err) {
      error(err.message || 'Failed to add item');
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!selectedItem || !adjustForm.quantity) return;
    try {
      await api.post(`/inventory/${selectedItem.id}/adjust-stock`, adjustForm);
      success(`Stock updated for ${selectedItem.name}`);
      setIsAdjustModalOpen(false);
      setSelectedItem(null);
      setAdjustForm({ changeType: 'RESTOCK', quantity: 5, notes: '' });
      fetchInventory();
    } catch (err) {
      error(err.message || 'Failed to adjust stock');
    }
  };

  const handleDeleteItem = async (id, name) => {
    if (!window.confirm(`Move item "${name}" to Recycle Bin?`)) return;
    try {
      await api.delete(`/inventory/${id}`);
      success(`Item ${name} moved to Recycle Bin`);
      fetchInventory();
    } catch (err) {
      error(err.message || 'Failed to delete item');
    }
  };

  const canManage = isAdmin || hasPermission('MANAGE_INVENTORY');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white">
            Dental Supplies & Inventory
          </h1>
          <p className="text-xs text-content-subtle mt-1">
            Track clinical materials, instruments, stock levels, and automated reorder alerts.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock Item</span>
          </button>
        )}
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 dark:bg-amber-950/40 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Low Stock Alert:</strong> {lowStockCount} items have fallen below their minimum required threshold!
            </span>
          </div>
          <button
            type="button"
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 font-semibold cursor-pointer transition-colors"
          >
            {lowStockOnly ? 'Show All Items' : 'Filter Low Stock'}
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl glass-panel flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-content-subtle">Category:</span>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl glass-input text-xs"
          >
            <option value="ALL">All Categories</option>
            <option value="Restorative Materials">Restorative Materials</option>
            <option value="Endodontic Supplies">Endodontic Supplies</option>
            <option value="Impression & Prostho">Impression & Prostho</option>
            <option value="Sterilization & PPE">Sterilization & PPE</option>
            <option value="Local Anesthetics">Local Anesthetics</option>
            <option value="General Supplies">General Supplies</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
            lowStockOnly
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-content-subtle hover:text-content-main hover:bg-purple-500/10'
          }`}
        >
          {lowStockOnly ? '✓ Filtering Low Stock' : 'Filter Low Stock'}
        </button>
      </div>

      {/* Inventory Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-content-subtle text-sm">Loading stock inventory...</div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No inventory items in stock"
            description="Add clinical materials, PPE, anesthetics, and composite syringes to keep track of clinic inventory."
            actionLabel={canManage ? 'Add Stock Item' : undefined}
            onAction={canManage ? () => setIsCreateModalOpen(true) : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-50/70 text-purple-900 dark:bg-slate-950/60 dark:text-slate-400 text-[10px] uppercase font-semibold border-b border-[var(--border-main)]">
                <tr>
                  <th className="p-4">Item Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Current Stock</th>
                  <th className="p-4">Min. Threshold</th>
                  <th className="p-4">Unit Cost</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)] text-content-main">
                {items.map(item => {
                  const isLow = item.currentStock <= item.minThreshold;
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-white text-sm flex items-center gap-2">
                          <span>{item.name}</span>
                          {isLow && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                              Low Stock
                            </span>
                          )}
                        </div>
                        {item.supplier && (
                          <div className="text-[11px] text-slate-400 mt-0.5">Supplier: {item.supplier}</div>
                        )}
                      </td>

                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
                          {item.category}
                        </span>
                      </td>

                      <td className="p-4 font-mono font-bold text-sm">
                        <span className={isLow ? 'text-amber-400' : 'text-emerald-400'}>
                          {item.currentStock} {item.unit}
                        </span>
                      </td>

                      <td className="p-4 font-mono text-slate-400">
                        {item.minThreshold} {item.unit}
                      </td>

                      <td className="p-4 font-mono text-slate-300">
                        ₹{item.unitCost || 0}
                      </td>

                      <td className="p-4 text-right space-x-2">
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItem(item);
                              setAdjustForm({ changeType: 'RESTOCK', quantity: 5, notes: '' });
                              setIsAdjustModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-[11px] cursor-pointer"
                          >
                            Update Level
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400"
                            title="Delete item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE ITEM MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Inventory Item"
        subtitle="Register dental supplies, gloves, composites, or consumables."
      >
        <form onSubmit={handleCreateItem} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Item Name *</label>
            <input
              type="text"
              required
              value={createForm.name}
              onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="e.g. 3M Filtek Composite Syringe (A2)"
              className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={createForm.category}
                onChange={e => setCreateForm({ ...createForm, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
              >
                <option value="Restorative Materials">Restorative Materials</option>
                <option value="Endodontic Supplies">Endodontic Supplies</option>
                <option value="Impression & Prostho">Impression & Prostho</option>
                <option value="Sterilization & PPE">Sterilization & PPE</option>
                <option value="Local Anesthetics">Local Anesthetics</option>
                <option value="General Supplies">General Supplies</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Unit Type</label>
              <input
                type="text"
                value={createForm.unit}
                onChange={e => setCreateForm({ ...createForm, unit: e.target.value })}
                placeholder="boxes, bottles, pcs"
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Initial Stock</label>
              <input
                type="number"
                value={createForm.currentStock}
                onChange={e => setCreateForm({ ...createForm, currentStock: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Min. Alert Level</label>
              <input
                type="number"
                value={createForm.minThreshold}
                onChange={e => setCreateForm({ ...createForm, minThreshold: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Unit Cost (₹)</label>
              <input
                type="number"
                value={createForm.unitCost}
                onChange={e => setCreateForm({ ...createForm, unitCost: e.target.value })}
                placeholder="₹"
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Supplier / Vendor</label>
            <input
              type="text"
              value={createForm.supplier}
              onChange={e => setCreateForm({ ...createForm, supplier: e.target.value })}
              placeholder="e.g. Dentsply Sirona / Local Dental Depot"
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
              Add Item
            </button>
          </div>
        </form>
      </Modal>

      {/* ADJUST STOCK MODAL */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={`Update Stock: ${selectedItem?.name}`}
        subtitle={`Current Level: ${selectedItem?.currentStock} ${selectedItem?.unit}`}
      >
        <form onSubmit={handleAdjustStock} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Stock Action</label>
            <select
              value={adjustForm.changeType}
              onChange={e => setAdjustForm({ ...adjustForm, changeType: e.target.value })}
              className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
            >
              <option value="RESTOCK">Restock (+) - Add received shipment</option>
              <option value="USED">Used / Consumed (-) - Treatment usage</option>
              <option value="WASTAGE">Wastage / Expired (-) - Disposed</option>
              <option value="ADJUSTMENT">Override / Audit - Set exact stock</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Quantity ({selectedItem?.unit}) *
            </label>
            <input
              type="number"
              required
              min="1"
              value={adjustForm.quantity}
              onChange={e => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
              className="w-full px-3 py-2 rounded-xl glass-input text-white text-sm font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Notes / Reason</label>
            <input
              type="text"
              placeholder="e.g. New shipment from vendor / clinical usage"
              value={adjustForm.notes}
              onChange={e => setAdjustForm({ ...adjustForm, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer shadow-md shadow-purple-600/30"
            >
              Save Stock Adjustment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
