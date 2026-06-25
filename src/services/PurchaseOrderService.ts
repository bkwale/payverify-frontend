//////// src/services/PurchaseOrderService.ts

///**
// * =============================================================================
// * PurchaseOrderService (CLEAN SRP VERSION)
// * =============================================================================
// *
// * 🔧 WHAT CHANGED (IMPORTANT)
// * -----------------------------------------------------------------------------
// * 1. ❌ REMOVED InvoiceService code from this file
// *    - Previously this file incorrectly contained Invoice logic
// *    - Violated SRP and broke TS imports
// *
// * 2. ❌ REMOVED pdfkit, PaymentIntent, Invoice imports
// *    - PurchaseOrderService must NOT know about payments or invoices
// *    - Prevents circular dependencies and future scaling issues
// *
// * 3. ✅ RESTORED proper PurchaseOrder domain responsibility
// *
// * 4. ✅ ENSURED named export:
// *        export class PurchaseOrderService
// *    - Fixes TS2305 "no exported member"
// *
// * 5. ✅ PRESERVED transaction safety and explicit mapping
// *
// * ARCHITECTURE RULE
// * -----------------------------------------------------------------------------
// * PurchaseOrderService → manages orders only
// * InvoiceService       → manages invoices only
// * PaymentIntentService → manages payment intents
// *
// * =============================================================================
// */

//import { Sequelize, Transaction } from "sequelize";
//import { DatabaseModels } from "../types";

//export class PurchaseOrderService {
//    private models: DatabaseModels;
//    private sequelize: Sequelize;a

//    constructor(models: DatabaseModels, sequelize: Sequelize) {
//        this.models = models;
//        this.sequelize = sequelize;
//    }

//    /**
//     * =========================================================================
//     * CREATE PURCHASE ORDER
//     * =========================================================================
//     */
//    async createPurchaseOrder(data: any): Promise<any> {
//        const transaction: Transaction = await this.sequelize.transaction();

//        try {
//            // ---------------------------------------------------------------------
//            // Generate PO reference safely
//            // ---------------------------------------------------------------------
//            const poReference =
//                data.poReference ??
//                `PO-${data.merchantId ?? "ADMIN"}-${Date.now()}`;

//            // ---------------------------------------------------------------------
//            // Calculate total safely
//            // ---------------------------------------------------------------------
//            let totalAmount = 0;

//            if (Array.isArray(data.items)) {
//                totalAmount = data.items.reduce((sum: number, item: any) => {
//                    const quantity = Number(item.quantity) || 0;
//                    const unitPrice = Number(item.unitPrice) || 0;
//                    return sum + quantity * unitPrice;
//                }, 0);
//            }

//            // ---------------------------------------------------------------------
//            // Explicit DB mapping (prevents NOT NULL issues)
//            // ---------------------------------------------------------------------
//            const purchaseOrder = await this.models.PurchaseOrder.create(
//                {
//                    poReference,
//                    merchantId: Number(data.merchantId),
//                    totalAmount: String(totalAmount), // DECIMAL safety
//                    description: data.description ?? null,
//                    dueDate: data.dueDate ?? null,
//                    status: data.status ?? "pending",
//                },
//                { transaction }
//            );

//            const purchaseOrderId: number =
//                purchaseOrder.getDataValue("id");

//            // ---------------------------------------------------------------------
//            // Create line items
//            // ---------------------------------------------------------------------
//            if (Array.isArray(data.items)) {
//                for (const item of data.items) {
//                    const quantity = Number(item.quantity);
//                    const unitPrice = Number(item.unitPrice);
//                    const lineTotal = quantity * unitPrice;

//                    await this.models.PurchaseOrderItem.create(
//                        {
//                            purchaseOrderId,
//                            itemName: item.itemName,
//                            quantity,
//                            unitPrice: String(unitPrice),
//                            lineTotal: String(lineTotal),
//                            description: item.description ?? null,
//                        },
//                        { transaction }
//                    );
//                }
//            }

//            await transaction.commit();

//            return await this.getPurchaseOrderById(purchaseOrderId);
//        } catch (error) {
//            await transaction.rollback();

//            console.error("PurchaseOrder CREATE ERROR:", error);
//            throw error;
//        }
//    }

//    /**
//     * =========================================================================
//     * GET PURCHASE ORDER BY ID
//     * =========================================================================
//     */
//    async getPurchaseOrderById(id: number): Promise<any> {
//        return this.models.PurchaseOrder.findByPk(id, {
//            include: [
//                { model: this.models.PurchaseOrderItem, as: "items" },
//                { model: this.models.Merchant, as: "merchant" },
//            ],
//        });
//    }

//    /**
//     * =========================================================================
//     * GET ALL PURCHASE ORDERS (paginated)
//     * =========================================================================
//     */
//    async getAllPurchaseOrders(
//        filter: any = {},
//        page: number = 1,
//        limit: number = 10
//    ) {
//        const offset = (page - 1) * limit;

//        const result = await this.models.PurchaseOrder.findAndCountAll({
//            where: filter,
//            include: [
//                { model: this.models.PurchaseOrderItem, as: "items" },
//                { model: this.models.Merchant, as: "merchant" },
//            ],
//            offset,
//            limit,
//            order: [["createdAt", "DESC"]],
//        });

//        return {
//            purchaseOrders: result.rows,
//            total: result.count,
//        };
//    }

//    /**
//     * =========================================================================
//     * UPDATE PURCHASE ORDER
//     * =========================================================================
//     */
//    async updatePurchaseOrder(id: number, updateData: any) {
//        if (updateData.totalAmount !== undefined) {
//            updateData.totalAmount = String(updateData.totalAmount);
//        }

//        await this.models.PurchaseOrder.update(updateData, {
//            where: { id },
//        });

//        return this.getPurchaseOrderById(id);
//    }

//    /**
//     * =========================================================================
//     * DELETE PURCHASE ORDER
//     * =========================================================================
//     */
//    async deletePurchaseOrder(id: number): Promise<boolean> {
//        await this.models.PurchaseOrderItem.destroy({
//            where: { purchaseOrderId: id },
//        });

//        await this.models.PurchaseOrder.destroy({
//            where: { id },
//        });

//        return true;
//    }

//    /**
//     * =========================================================================
//     * UPDATE STATUS
//     * =========================================================================
//     */
//    async updatePurchaseOrderStatus(id: number, status: string) {
//        await this.models.PurchaseOrder.update(
//            { status },
//            { where: { id } }
//        );

//        return this.getPurchaseOrderById(id);
//    }

//    /**
//     * =========================================================================
//     * STATS
//     * =========================================================================
//     */
//    async getPurchaseOrderStats() {
//        const { PurchaseOrder } = this.models;

//        const totalOrders = await PurchaseOrder.count();
//        const totalValue = (await PurchaseOrder.sum("totalAmount")) || 0;

//        const pending = await PurchaseOrder.count({
//            where: { status: "pending" },
//        });

//        const completed = await PurchaseOrder.count({
//            where: { status: "completed" },
//        });

//        return {
//            totalOrders,
//            totalValue,
//            pending,
//            completed,
//        };
//    }
//}

/**
 * =============================================================================
 * PurchaseOrderService (PRODUCTION-SAFE VERSION)
 * =============================================================================
 *
 * 🔧 WHAT CHANGED (NEW IN THIS VERSION)
 * -----------------------------------------------------------------------------
 * ✅ FIXED: stray character after sequelize property (build breaker)
 * ✅ ADDED: addItemToPurchaseOrder (required by controller)
 * ✅ ADDED: automatic total recalculation after item insert
 * ✅ ADDED: transaction safety for item addition
 * ✅ HARDENED: numeric parsing and DECIMAL handling
 * ✅ PRESERVED: SRP (no payment/invoice coupling)
 *
 * =============================================================================
 */

import { Sequelize, Transaction } from "sequelize";
import { DatabaseModels } from "../types";

export class PurchaseOrderService {
    private models: DatabaseModels;

    // ✅ FIXED: removed stray character that was breaking build
    private sequelize: Sequelize;

    constructor(models: DatabaseModels, sequelize: Sequelize) {
        this.models = models;
        this.sequelize = sequelize;
    }

    // =============================================================================
    // CREATE PURCHASE ORDER
    // =============================================================================
    async createPurchaseOrder(data: any): Promise<any> {
        const transaction: Transaction = await this.sequelize.transaction();

        try {
            const poReference =
                data.poReference ??
                `PO-${data.merchantId ?? "ADMIN"}-${Date.now()}`;

            let totalAmount = 0;

            if (Array.isArray(data.items)) {
                totalAmount = data.items.reduce((sum: number, item: any) => {
                    const quantity = Number(item.quantity) || 0;
                    const unitPrice = Number(item.unitPrice) || 0;
                    return sum + quantity * unitPrice;
                }, 0);
            }

            const purchaseOrder = await this.models.PurchaseOrder.create(
                {
                    poReference,
                    merchantId: Number(data.merchantId),
                    totalAmount: String(totalAmount),
                    description: data.description ?? null,
                    dueDate: data.dueDate ?? null,
                    status: data.status ?? "pending",
                },
                { transaction }
            );

            const purchaseOrderId: number =
                purchaseOrder.getDataValue("id");

            // create items
            if (Array.isArray(data.items)) {
                for (const item of data.items) {
                    const quantity = Number(item.quantity);
                    const unitPrice = Number(item.unitPrice);
                    const lineTotal = quantity * unitPrice;

                    await this.models.PurchaseOrderItem.create(
                        {
                            purchaseOrderId,
                            itemName: item.itemName,
                            quantity,
                            unitPrice: String(unitPrice),
                            lineTotal: String(lineTotal),
                            description: item.description ?? null,
                        },
                        { transaction }
                    );
                }
            }

            await transaction.commit();

            return await this.getPurchaseOrderById(purchaseOrderId);
        } catch (error) {
            await transaction.rollback();
            console.error("PurchaseOrder CREATE ERROR:", error);
            throw error;
        }
    }

    // =============================================================================
    // ⭐ NEW — ADD ITEM TO PURCHASE ORDER (ENTERPRISE SAFE)
    // =============================================================================
    /**
     * WHY THIS WAS ADDED
     * ---------------------------------------------------------------------------
     * Your controller already calls addItemToPurchaseOrder().
     * The method was missing → caused TS2339 compile error.
     *
     * WHAT THIS METHOD DOES
     * ---------------------------------------------------------------------------
     * ✅ validates purchase order exists
     * ✅ inserts line item
     * ✅ recalculates totalAmount (CRITICAL for finance)
     * ✅ runs inside transaction
     */
    async addItemToPurchaseOrder(
        purchaseOrderId: number,
        item: any
    ): Promise<any> {
        const transaction = await this.sequelize.transaction();

        try {
            // ---------------------------------------------------------------------
            // Validate purchase order
            // ---------------------------------------------------------------------
            const purchaseOrder =
                await this.models.PurchaseOrder.findByPk(
                    purchaseOrderId,
                    { transaction }
                );

            if (!purchaseOrder) {
                throw new Error("Purchase order not found");
            }

            // ---------------------------------------------------------------------
            // Create new line item
            // ---------------------------------------------------------------------
            const quantity = Number(item.quantity) || 0;
            const unitPrice = Number(item.unitPrice) || 0;
            const lineTotal = quantity * unitPrice;

            await this.models.PurchaseOrderItem.create(
                {
                    purchaseOrderId,
                    itemName: item.itemName,
                    quantity,
                    unitPrice: String(unitPrice),
                    lineTotal: String(lineTotal),
                    description: item.description ?? null,
                },
                { transaction }
            );

            // ---------------------------------------------------------------------
            // 🔥 CRITICAL: Recalculate order total
            // ---------------------------------------------------------------------
            const items =
                await this.models.PurchaseOrderItem.findAll({
                    where: { purchaseOrderId },
                    transaction,
                });

            const newTotal = items.reduce((sum: number, i: any) => {
                return sum + Number(i.lineTotal || 0);
            }, 0);

            await purchaseOrder.update(
                { totalAmount: String(newTotal) },
                { transaction }
            );

            await transaction.commit();

            return this.getPurchaseOrderById(purchaseOrderId);
        } catch (error) {
            await transaction.rollback();
            console.error("ADD ITEM ERROR:", error);
            throw error;
        }
    }

    // =============================================================================
    // GET PURCHASE ORDER BY ID
    // =============================================================================
    async getPurchaseOrderById(id: number): Promise<any> {
        return this.models.PurchaseOrder.findByPk(id, {
            include: [
                { model: this.models.PurchaseOrderItem, as: "items" },
                { model: this.models.Merchant, as: "merchant" },
            ],
        });
    }

    // =============================================================================
    // GET ALL PURCHASE ORDERS
    // =============================================================================
    async getAllPurchaseOrders(
        filter: any = {},
        page: number = 1,
        limit: number = 10
    ) {
        const offset = (page - 1) * limit;

        const result = await this.models.PurchaseOrder.findAndCountAll({
            where: filter,
            include: [
                { model: this.models.PurchaseOrderItem, as: "items" },
                { model: this.models.Merchant, as: "merchant" },
            ],
            offset,
            limit,
            order: [["createdAt", "DESC"]],
        });

        return {
            purchaseOrders: result.rows,
            total: result.count,
        };
    }

    // =============================================================================
    // UPDATE PURCHASE ORDER
    // =============================================================================
    async updatePurchaseOrder(id: number, updateData: any) {
        if (updateData.totalAmount !== undefined) {
            updateData.totalAmount = String(updateData.totalAmount);
        }

        await this.models.PurchaseOrder.update(updateData, {
            where: { id },
        });

        return this.getPurchaseOrderById(id);
    }

    // =============================================================================
    // DELETE PURCHASE ORDER
    // =============================================================================
    async deletePurchaseOrder(id: number): Promise<boolean> {
        await this.models.PurchaseOrderItem.destroy({
            where: { purchaseOrderId: id },
        });

        await this.models.PurchaseOrder.destroy({
            where: { id },
        });

        return true;
    }

    // =============================================================================
    // UPDATE STATUS
    // =============================================================================
    async updatePurchaseOrderStatus(id: number, status: string) {
        await this.models.PurchaseOrder.update(
            { status },
            { where: { id } }
        );

        return this.getPurchaseOrderById(id);
    }

    // =============================================================================
    // STATS
    // =============================================================================
    async getPurchaseOrderStats() {
        const { PurchaseOrder } = this.models;

        const totalOrders = await PurchaseOrder.count();
        const totalValue =
            (await PurchaseOrder.sum("totalAmount")) || 0;

        const pending = await PurchaseOrder.count({
            where: { status: "pending" },
        });

        const completed = await PurchaseOrder.count({
            where: { status: "completed" },
        });

        return {
            totalOrders,
            totalValue,
            pending,
            completed,
        };
    }
}
