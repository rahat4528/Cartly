import { BookstoreStore } from '../database/store.js';
import { v4 as uuidv4 } from 'uuid';

export type MovementReason = 'RESTOCK' | 'PURCHASE' | 'DAMAGE_WRITE_OFF' | 'RETURN' | 'ADJUSTMENT';

export class InventoryService {
  private store = BookstoreStore.getInstance();
  private static LOW_STOCK_THRESHOLD = 10;

  getLowStockAlerts() {
    const lowStock = this.store.editions.filter(e => e.stock <= InventoryService.LOW_STOCK_THRESHOLD);
    return lowStock.map(ed => {
      const book = this.store.findBook(ed.bookId);
      return {
        editionId: ed.id,
        bookId: ed.bookId,
        title: book ? book.title : 'Unknown Title',
        format: ed.format,
        isbn: ed.isbn,
        sku: ed.sku,
        currentStock: ed.stock,
        threshold: InventoryService.LOW_STOCK_THRESHOLD,
        urgency: ed.stock === 0 ? 'CRITICAL_OUT_OF_STOCK' : ed.stock <= 5 ? 'HIGH' : 'MEDIUM'
      };
    });
  }

  adjustStock(params: {
    editionId: string;
    quantityDelta: number;
    reason: MovementReason;
    notes?: string;
  }) {
    const { editionId, quantityDelta, reason, notes } = params;

    const edition = this.store.findEdition(editionId);
    if (!edition) {
      throw new Error(`Edition ${editionId} not found`);
    }

    const previousStock = edition.stock;
    const newStock = previousStock + quantityDelta;

    if (newStock < 0) {
      throw new Error(`Cannot adjust stock below zero. Current: ${previousStock}, Requested Delta: ${quantityDelta}`);
    }

    edition.stock = newStock;

    const movement = {
      id: `mov_${uuidv4().substring(0, 8)}`,
      editionId,
      orderNumber: null,
      changeAmount: quantityDelta,
      previousStock,
      newStock,
      reason,
      notes: notes || `Manual stock adjustment (${reason})`,
      createdAt: new Date().toISOString()
    };

    this.store.inventoryMovements.push(movement);

    return {
      edition,
      movement
    };
  }

  getMovementsForEdition(editionId: string) {
    return this.store.inventoryMovements
      .filter(m => m.editionId === editionId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getAllMovements() {
    return this.store.inventoryMovements
      .map(m => {
        const ed = this.store.findEdition(m.editionId);
        const book = ed ? this.store.findBook(ed.bookId) : null;
        return {
          ...m,
          bookTitle: book ? book.title : 'N/A',
          format: ed ? ed.format : 'N/A',
          isbn: ed ? ed.isbn : 'N/A'
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
