const { db, runTransaction } = require('../db');
const { logAudit } = require('../middleware/audit');

function getInventory(req, res) {
  try {
    const { category, lowStockOnly } = req.query;
    let sql = 'SELECT * FROM inventory_items WHERE isDeleted = 0';
    const params = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (lowStockOnly === 'true') {
      sql += ' AND currentStock <= minThreshold';
    }

    sql += ' ORDER BY name ASC';
    const items = db.prepare(sql).all(...params);

    const lowStockCountRow = db.prepare(`
      SELECT COUNT(*) as count FROM inventory_items 
      WHERE currentStock <= minThreshold AND isDeleted = 0
    `).get();

    return res.json({
      success: true,
      lowStockCount: lowStockCountRow.count,
      items
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve inventory items' });
  }
}

function createInventoryItem(req, res) {
  try {
    const { name, category, currentStock = 0, minThreshold = 5, unit = 'units', supplier, unitCost = 0 } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Item name is required' });
    }

    const now = new Date().toISOString();
    const insert = db.prepare(`
      INSERT INTO inventory_items (
        name, category, currentStock, minThreshold, unit, supplier, unitCost, updatedAt, isDeleted
      ) VALUES (
        @name, @category, @currentStock, @minThreshold, @unit, @supplier, @unitCost, @now, 0
      )
    `);

    insert.run({
      name: name.trim(),
      category: category ? category.trim() : 'General Supplies',
      currentStock: parseInt(currentStock || 0, 10),
      minThreshold: parseInt(minThreshold || 5, 10),
      unit: unit || 'units',
      supplier: supplier ? supplier.trim() : null,
      unitCost: parseFloat(unitCost || 0),
      now
    });

    const newItem = db.prepare('SELECT * FROM inventory_items WHERE id = last_insert_rowid()').get();

    logAudit(req, {
      action: 'CREATE',
      entityType: 'INVENTORY',
      entityId: newItem.id,
      newValues: { name: newItem.name, stock: newItem.currentStock }
    });

    return res.status(201).json({ success: true, message: 'Inventory item added', item: newItem });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to add inventory item' });
  }
}

function adjustStock(req, res) {
  try {
    const { id } = req.params;
    const { changeType, quantity, notes } = req.body; // changeType: 'RESTOCK', 'USED', 'ADJUSTMENT', 'WASTAGE'

    if (!changeType || quantity === undefined || parseInt(quantity, 10) === 0) {
      return res.status(400).json({ success: false, message: 'Valid change type and non-zero quantity are required' });
    }

    const item = db.prepare('SELECT * FROM inventory_items WHERE id = ? AND isDeleted = 0').get(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const qty = parseInt(quantity, 10);
    let newStock = item.currentStock;

    if (changeType === 'RESTOCK') {
      newStock += Math.abs(qty);
    } else if (changeType === 'USED' || changeType === 'WASTAGE') {
      newStock = Math.max(0, newStock - Math.abs(qty));
    } else if (changeType === 'ADJUSTMENT') {
      newStock = qty; // direct override
    }

    let updatedItem;
    runTransaction(() => {
      const now = new Date().toISOString();
      db.prepare(`
        UPDATE inventory_items 
        SET currentStock = ?, updatedAt = ?
        WHERE id = ?
      `).run(newStock, now, id);

      db.prepare(`
        INSERT INTO inventory_logs (itemId, changeType, quantity, notes, loggedBy, createdAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, changeType, qty, notes || null, req.user.id, now);

      updatedItem = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(id);
    });

    logAudit(req, {
      action: 'STOCK_ADJUSTMENT',
      entityType: 'INVENTORY',
      entityId: id,
      oldValues: { stock: item.currentStock },
      newValues: { stock: updatedItem.currentStock, changeType, quantity: qty }
    });

    return res.json({
      success: true,
      message: `Stock updated for ${item.name}. New level: ${updatedItem.currentStock} ${updatedItem.unit}`,
      item: updatedItem
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to adjust stock' });
  }
}

function updateInventoryItem(req, res) {
  try {
    const { id } = req.params;
    const { name, category, minThreshold, unit, supplier, unitCost } = req.body;
    const item = db.prepare('SELECT * FROM inventory_items WHERE id = ? AND isDeleted = 0').get(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE inventory_items 
      SET name = COALESCE(?, name),
          category = COALESCE(?, category),
          minThreshold = COALESCE(?, minThreshold),
          unit = COALESCE(?, unit),
          supplier = COALESCE(?, supplier),
          unitCost = COALESCE(?, unitCost),
          updatedAt = ?
      WHERE id = ?
    `).run(name, category, minThreshold, unit, supplier, unitCost, now, id);

    const updated = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(id);
    return res.json({ success: true, message: 'Item updated', item: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update item' });
  }
}

function deleteInventoryItem(req, res) {
  try {
    const { id } = req.params;
    const item = db.prepare('SELECT * FROM inventory_items WHERE id = ? AND isDeleted = 0').get(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE inventory_items SET isDeleted = 1, deletedAt = ?, deletedBy = ? WHERE id = ?').run(now, req.user.id, id);

    return res.json({ success: true, message: 'Item moved to recycle bin' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete item' });
  }
}

module.exports = {
  getInventory,
  createInventoryItem,
  adjustStock,
  updateInventoryItem,
  deleteInventoryItem
};

