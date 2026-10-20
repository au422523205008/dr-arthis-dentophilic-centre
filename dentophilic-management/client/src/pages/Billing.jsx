import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Plus,
  Search,
  DollarSign,
  Printer,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Badge from '../components/Common/Badge';
import EmptyState from '../components/Common/EmptyState';
import Modal from '../components/Common/Modal';

export default function Billing({ defaultPatient }) {
  const { isAdmin, hasPermission } = useAuth();
  const { success, error } = useToast();

  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [viewingReceipt, setViewingReceipt] = useState(null);

  // Create Invoice Form State
  const [formData, setFormData] = useState({
    patientId: defaultPatient?.id || '',
    items: [
      { description: 'General Dental Consultation', quantity: 1, unitPrice: 300 }
    ],
    discount: 0,
    taxPercentage: 0,
    paymentMode: 'Cash',
    paidNow: 300,
    notes: ''
  });

  // Record Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMode: 'UPI',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      let query = `?limit=100`;
      if (filterStatus !== 'ALL') query += `&status=${filterStatus}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;

      const [invRes, patRes, svcRes] = await Promise.all([
        api.get(`/billing/invoices${query}`),
        api.get('/patients?limit=200'),
        api.get('/treatments/services')
      ]);

      if (invRes.success) setInvoices(invRes.invoices || []);
      if (patRes.success) setPatients(patRes.patients || []);
      if (svcRes.success) setServices(svcRes.services || []);
    } catch (err) {
      console.error('Failed to load billing data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus, search]);

  useEffect(() => {
    if (defaultPatient?.id) {
      setFormData(prev => ({ ...prev, patientId: defaultPatient.id }));
      setIsCreateModalOpen(true);
    }
  }, [defaultPatient]);

  const handleAddItem = (svc) => {
    if (svc) {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, { description: svc.name, quantity: 1, unitPrice: svc.price }]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, { description: '', quantity: 1, unitPrice: 0 }]
      }));
    }
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateItem = (index, field, value) => {
    setFormData(prev => {
      const items = [...prev.items];
      items[index][field] = value;
      return { ...prev, items };
    });
  };

  // Calculations
  const subtotal = formData.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
  const discountVal = Number(formData.discount) || 0;
  const taxable = Math.max(0, subtotal - discountVal);
  const taxVal = (taxable * (Number(formData.taxPercentage) || 0)) / 100;
  const calculatedTotal = taxable + taxVal;

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!formData.patientId) {
      error('Please select a patient');
      return;
    }
    if (formData.items.length === 0 || !formData.items[0].description) {
      error('Please add at least one line item');
      return;
    }

    try {
      const payload = {
        patientId: parseInt(formData.patientId, 10),
        items: formData.items.map(it => ({
          description: it.description,
          quantity: parseInt(it.quantity || 1, 10),
          unitPrice: parseFloat(it.unitPrice || 0),
          total: parseInt(it.quantity || 1, 10) * parseFloat(it.unitPrice || 0)
        })),
        discount: discountVal,
        taxAmount: taxVal,
        initialPayment: parseFloat(formData.paidNow || 0),
        paymentMode: formData.paymentMode,
        notes: formData.notes
      };

      const res = await api.post('/billing/invoices', payload);
      success(res.message || 'Invoice generated successfully');
      setIsCreateModalOpen(false);
      fetchData();
      if (res.invoice) {
        setViewingReceipt(res.invoice);
      }
    } catch (err) {
      error(err.message || 'Failed to create invoice');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice || !paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      error('Please enter a valid payment amount');
      return;
    }

    try {
      const res = await api.post('/billing/payments', {
        invoiceId: selectedInvoice.id,
        amount: parseFloat(paymentForm.amount),
        paymentMode: paymentForm.paymentMode,
        notes: paymentForm.notes
      });
      success(res.message || 'Payment recorded successfully');
      setIsPaymentModalOpen(false);
      setSelectedInvoice(null);
      setPaymentForm({ amount: '', paymentMode: 'UPI', notes: '' });
      fetchData();
    } catch (err) {
      error(err.message || 'Failed to record payment');
    }
  };

  const handleViewReceipt = async (inv) => {
    try {
      const res = await api.get(`/billing/invoices/${inv.id}`);
      if (res.success && res.invoice) {
        setViewingReceipt(res.invoice);
      }
    } catch (err) {
      error('Failed to load invoice receipt details');
    }
  };

  const handleDeleteInvoice = async (id, invNum) => {
    if (!window.confirm(`Move invoice ${invNum} to Recycle Bin?`)) return;
    try {
      await api.delete(`/billing/invoices/${id}`);
      success('Invoice moved to Recycle Bin');
      fetchData();
    } catch (err) {
      error(err.message || 'Failed to delete invoice');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white">
            Billing & Invoices
          </h1>
          <p className="text-xs text-content-subtle mt-1">
            Issue itemized dental invoices, record installment payments, and print patient receipts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Invoice</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl glass-panel flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'PAID', 'PARTIAL', 'UNPAID'].map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
                filterStatus === st
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-content-subtle hover:text-content-main hover:bg-purple-500/10'
              }`}
            >
              {st === 'ALL' ? 'All Invoices' : st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-purple-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search invoice # or patient name..."
            className="px-3 py-1.5 rounded-xl glass-input text-xs"
          />
        </div>
      </div>

      {/* Invoices List */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-content-subtle text-sm">Loading billing records...</div>
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No invoices found"
            description="Generate your first invoice for a completed treatment or dental consultation."
            actionLabel="Generate Invoice"
            onAction={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-50/70 text-purple-900 dark:bg-slate-950/60 dark:text-slate-400 text-[10px] uppercase font-semibold border-b border-[var(--border-main)]">
                <tr>
                  <th className="p-4">Invoice # & Date</th>
                  <th className="p-4">Patient</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Paid</th>
                  <th className="p-4">Balance Due</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-purple-500/5 transition-colors border-b border-[var(--border-main)]">
                    <td className="p-4">
                      <span className="font-mono text-purple-400 font-bold text-sm block">
                        {inv.invoiceNumber}
                      </span>
                      <span className="text-content-subtle text-[11px] font-mono">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="font-semibold text-content-main text-sm">{inv.patientName}</div>
                      <div className="text-content-subtle text-[11px] font-mono">{inv.formattedPatientId || inv.patientPhone}</div>
                    </td>

                    <td className="p-4 font-mono font-bold text-content-main text-sm">
                      ₹{inv.totalAmount.toLocaleString('en-IN')}
                    </td>

                    <td className="p-4 font-mono text-emerald-400">
                      ₹{inv.paidAmount.toLocaleString('en-IN')}
                    </td>

                    <td className="p-4 font-mono">
                      {inv.balanceDue > 0 ? (
                        <span className="text-amber-400 font-bold">
                          ₹{inv.balanceDue.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-content-subtle">₹0</span>
                      )}
                    </td>

                    <td className="p-4">
                      <Badge status={inv.status} />
                    </td>

                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      {inv.balanceDue > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setPaymentForm({ amount: String(inv.balanceDue), paymentMode: 'UPI', notes: '' });
                            setIsPaymentModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-[11px] cursor-pointer"
                        >
                          Record Payment
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleViewReceipt(inv)}
                        className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-[11px] cursor-pointer"
                      >
                        Receipt
                      </button>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNumber)}
                          className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400"
                          title="Delete invoice"
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

      {/* CREATE INVOICE MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Itemized Invoice"
        subtitle="Itemize treatments, apply discount or tax, and record initial payment."
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Select Patient *</label>
            <select
              required
              value={formData.patientId}
              onChange={e => setFormData({ ...formData, patientId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
            >
              <option value="">Choose patient...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.patientId} • {p.phone})
                </option>
              ))}
            </select>
          </div>

          {/* Quick procedure items from catalog */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Add from Procedure Catalog:
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {services.map(svc => (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => handleAddItem(svc)}
                  className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:border-purple-500 text-[11px] text-content-main cursor-pointer"
                >
                  + {svc.name} (₹{svc.price})
                </button>
              ))}
            </div>
          </div>

          {/* Line items list */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-content-main">Itemized Treatments ({formData.items.length})</span>
              <button
                type="button"
                onClick={() => handleAddItem(null)}
                className="text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
              >
                + Add Custom Row
              </button>
            </div>

            {formData.items.map((item, index) => (
              <div
                key={index}
                className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 grid grid-cols-12 gap-2 items-center"
              >
                <div className="col-span-6">
                  <input
                    type="text"
                    required
                    placeholder="Procedure description"
                    value={item.description}
                    onChange={e => handleUpdateItem(index, 'description', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg glass-input text-white text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={e => handleUpdateItem(index, 'quantity', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg glass-input text-white text-xs font-mono"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    placeholder="Fee (₹)"
                    value={item.unitPrice}
                    onChange={e => handleUpdateItem(index, 'unitPrice', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg glass-input text-white text-xs font-mono"
                  />
                </div>
                <div className="col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Discount & Tax */}
          <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-slate-950/30 border border-slate-800">
            <div>
              <label className="block text-slate-400 mb-1">Discount Amount (₹)</label>
              <input
                type="number"
                value={formData.discount}
                onChange={e => setFormData({ ...formData, discount: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg glass-input text-white text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">GST Tax (%)</label>
              <input
                type="number"
                value={formData.taxPercentage}
                onChange={e => setFormData({ ...formData, taxPercentage: e.target.value })}
                placeholder="0"
                className="w-full px-2.5 py-1.5 rounded-lg glass-input text-white text-xs font-mono"
              />
            </div>
          </div>

          {/* Live Summary */}
          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-content-subtle">Subtotal: ₹{subtotal}</span>
              {discountVal > 0 && <span className="text-amber-400 ml-3">Discount: -₹{discountVal}</span>}
              {taxVal > 0 && <span className="text-purple-300 ml-3">GST: +₹{taxVal.toFixed(1)}</span>}
            </div>
            <div className="text-base font-bold text-purple-400">
              Total: ₹{calculatedTotal.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Initial Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-content-subtle mb-1">Paid Now (₹)</label>
              <input
                type="number"
                value={formData.paidNow}
                onChange={e => setFormData({ ...formData, paidNow: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg glass-input text-content-main text-xs font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-content-subtle mb-1">Payment Mode</label>
              <select
                value={formData.paymentMode}
                onChange={e => setFormData({ ...formData, paymentMode: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg glass-input text-content-main text-xs"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="Bank Transfer">Bank Transfer / NEFT</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-[var(--border-main)]">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-content-subtle hover:text-content-main"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer shadow-md shadow-purple-600/30"
            >
              Issue Invoice
            </button>
          </div>
        </form>
      </Modal>

      {/* RECORD PAYMENT MODAL */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Record Payment for ${selectedInvoice?.invoiceNumber}`}
        subtitle={`Patient: ${selectedInvoice?.patientName} • Remaining Balance: ₹${selectedInvoice?.balanceDue}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Amount to Pay (₹) *</label>
            <input
              type="number"
              required
              max={selectedInvoice?.balanceDue}
              value={paymentForm.amount}
              onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              className="w-full px-3 py-2 rounded-xl glass-input text-white text-sm font-mono font-bold text-emerald-400"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Payment Mode *</label>
            <select
              value={paymentForm.paymentMode}
              onChange={e => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
              className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
            >
              <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Transaction Ref / Notes</label>
            <input
              type="text"
              placeholder="e.g. UPI Ref # 1234567890"
              value={paymentForm.notes}
              onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer shadow-md shadow-purple-600/30"
            >
              Confirm & Save Payment
            </button>
          </div>
        </form>
      </Modal>

      {/* PRINTABLE RECEIPT / INVOICE MODAL */}
      {viewingReceipt && (
        <Modal
          isOpen={!!viewingReceipt}
          onClose={() => setViewingReceipt(null)}
          title={`Bill & Receipt - ${viewingReceipt.invoiceNumber}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div id="printable-bill" className="print-page p-6 sm:p-8 bg-white text-slate-900 rounded-2xl shadow-lg border border-slate-200 text-xs">
              {/* Header */}
              <div className="border-b-2 border-purple-800 pb-4 mb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold font-serif text-purple-950">Dr. Arthi's Dentophilic Centre</h2>
                  <p className="font-semibold text-purple-900">Dr. Arthi Mukeshkannan, B.D.S</p>
                  <p className="text-[11px] text-slate-600">General Dental Surgeon • Regd. No: 31263</p>
                </div>
                <div className="text-right text-[11px] text-slate-600 leading-tight">
                  <p className="font-semibold text-slate-800">Pk Complex, ESI Ring Road</p>
                  <p>Hosur - 635109, Tamil Nadu</p>
                  <p className="font-mono text-purple-900 font-bold mt-1">Ph: +91 95971 26248</p>
                </div>
              </div>

              {/* Invoice Meta */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg mb-6 border border-slate-200">
                <div>
                  <div className="text-slate-500">Billed To:</div>
                  <div className="font-bold text-slate-900 text-sm">{viewingReceipt.patientName}</div>
                  <div className="font-mono text-slate-600">{viewingReceipt.patientPhone}</div>
                </div>
                <div className="text-right font-mono">
                  <div>Invoice: <strong className="text-purple-950">{viewingReceipt.invoiceNumber}</strong></div>
                  <div>Date: {new Date(viewingReceipt.createdAt).toLocaleDateString()}</div>
                  <div className="mt-1">
                    Status: <span className="font-bold uppercase text-purple-900">{viewingReceipt.status}</span>
                  </div>
                </div>
              </div>

              {/* Itemized Table */}
              <table className="w-full text-left mb-6 border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-600 font-semibold text-[11px]">
                    <th className="py-2">Procedure / Item</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Rate</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {(typeof viewingReceipt.items === 'string' ? JSON.parse(viewingReceipt.items) : (viewingReceipt.items || [])).map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2 font-medium">{it.description}</td>
                      <td className="py-2 text-center font-mono">{it.quantity}</td>
                      <td className="py-2 text-right font-mono">₹{it.unitPrice}</td>
                      <td className="py-2 text-right font-mono font-bold">₹{it.total || (it.quantity * it.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Breakdown */}
              <div className="border-t border-slate-200 pt-3 space-y-1.5 font-mono text-right max-w-xs ml-auto mb-6">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>₹{viewingReceipt.subtotal}</span>
                </div>
                {viewingReceipt.discount > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Discount:</span>
                    <span>-₹{viewingReceipt.discount}</span>
                  </div>
                )}
                {viewingReceipt.taxAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tax:</span>
                    <span>+₹{viewingReceipt.taxAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-300 pt-1.5">
                  <span>Grand Total:</span>
                  <span>₹{viewingReceipt.totalAmount}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Total Paid:</span>
                  <span>₹{viewingReceipt.paidAmount}</span>
                </div>
                {viewingReceipt.balanceDue > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Balance Due:</span>
                    <span>₹{viewingReceipt.balanceDue}</span>
                  </div>
                )}
              </div>

              {/* Payments History */}
              {viewingReceipt.payments && viewingReceipt.payments.length > 0 && (
                <div className="mb-6 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-700 text-[11px] mb-2 uppercase tracking-wider">
                    Payment Receipts Recorded:
                  </div>
                  <div className="space-y-1 font-mono text-[11px]">
                    {viewingReceipt.payments.map((p, idx) => (
                      <div key={idx} className="flex justify-between text-slate-600">
                        <span>{p.receiptNumber} ({p.paymentMode})</span>
                        <span>₹{p.amount} on {new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Stamp */}
              <div className="flex justify-between items-end pt-6 border-t border-slate-200 text-[10px] text-slate-500">
                <div>Thank you for choosing Dr. Arthi's Dentophilic Centre!</div>
                <div className="text-center">
                  <div className="font-serif italic font-bold text-slate-900 text-xs mb-0.5">Authorized Signature</div>
                  <div>Dr. Arthi's Dentophilic Centre</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2.5 no-print pt-2">
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs cursor-pointer shadow-md shadow-purple-600/30"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Receipt</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
