//////////////////import crypto from 'crypto';

//import crypto from 'crypto';
//import { PaymentIntent } from '../models/PaymentIntent';
//import { Invoice } from '../models/Invoice';

//export class PaymentIntentService {

//    private models: any;

//    constructor(models?: any) {
//        this.models = models;
//    }

//    // =============================================================================
//    // CREATE FROM PURCHASE ORDER
//    // =============================================================================
//    async createFromPurchaseOrder(purchaseOrder: any): Promise<any> {

//        if (!purchaseOrder)
//            throw new Error("purchaseOrder required");

//        const purchaseOrderId = purchaseOrder.id;

//        const existing = await PaymentIntent.findOne({
//            where: { purchase_order_id: purchaseOrderId }
//        });

//        if (existing)
//            return existing;

//        const merchantId =
//            purchaseOrder.merchantId ??
//            purchaseOrder.merchant?.id;

//        if (!merchantId)
//            throw new Error("merchant_id missing");

//        const amount =
//            Number(
//                purchaseOrder.totalAmount ??
//                purchaseOrder.amount
//            );

//        if (!amount)
//            throw new Error("amount missing");

//        const token =
//            crypto.randomBytes(32).toString('hex');

//        const frontendUrl =
//            process.env.FRONTEND_URL ||
//            "http://localhost:5173";

//        const paymentLink =
//            `${frontendUrl}/pay/${token}`;

//        const intent = await PaymentIntent.create({
//            purchase_order_id: purchaseOrderId,
//            merchant_id: merchantId,
//            amount,
//            token,
//            payment_link: paymentLink,
//            status: "pending"
//        });

//        // 🔥 CREATE INVOICE (ONLY PLACE)
//        const existingInvoice = await Invoice.findOne({
//            where: { payment_intent_id: intent.id }
//        });

//        if (!existingInvoice) {

//            await Invoice.create({
//                payment_intent_id: intent.id,
//                merchant_id: merchantId,
//                amount,
//                status: "pending",
//                issued_at: new Date(),

//                // 🔥 CRITICAL FIX
//                public_token: token
//            });
//        }

//        return intent;
//    }

//    // =============================================================================
//    // GET BY PURCHASE ORDER
//    // =============================================================================
//    async getByPurchaseOrderId(purchaseOrderId: number): Promise<any> {
//        return await PaymentIntent.findOne({
//            where: { purchase_order_id: purchaseOrderId }
//        });
//    }

//    // =============================================================================
//    // GET BY TOKEN (FIXED)
//    // =============================================================================
//    async getByToken(token: string): Promise<any> {

//        if (!token)
//            throw new Error("token required");

//        return await PaymentIntent.findOne({
//            where: { token }
//        });
//    }
//}

// src/services/PaymentIntentService.ts
// =============================================================================
// PaymentIntentService (FINAL CLEAN VERSION)
//
// WHAT CHANGED:
// ------------------------------------------------------------
// ❌ REMOVED: QR code generation from backend
// ✅ REASON: QR should be generated on frontend (faster + simpler)
// ✅ Keeps backend focused on business logic only
//
// =============================================================================

import crypto from 'crypto';
import { PaymentIntent } from '../models/PaymentIntent';
import { Invoice } from '../models/Invoice';

export class PaymentIntentService {

    private models: any;

    constructor(models?: any) {
        this.models = models;
    }

    // =============================================================================
    // CREATE FROM PURCHASE ORDER
    // =============================================================================
    async createFromPurchaseOrder(purchaseOrder: any): Promise<any> {

        if (!purchaseOrder)
            throw new Error("purchaseOrder required");

        const purchaseOrderId = purchaseOrder.id;

        // Prevent duplicate payment intent
        const existing = await PaymentIntent.findOne({
            where: { purchase_order_id: purchaseOrderId }
        });

        if (existing)
            return existing;

        const merchantId =
            purchaseOrder.merchantId ??
            purchaseOrder.merchant?.id;

        if (!merchantId)
            throw new Error("merchant_id missing");

        const amount =
            Number(
                purchaseOrder.totalAmount ??
                purchaseOrder.amount
            );

        if (!amount)
            throw new Error("amount missing");

        const token =
            crypto.randomBytes(32).toString('hex');

        const frontendUrl =
            process.env.FRONTEND_URL ||
            "http://localhost:5173";

        const paymentLink =
            `${frontendUrl}/pay/${token}`;

        // Create payment intent
        const intent = await PaymentIntent.create({
            purchase_order_id: purchaseOrderId,
            merchant_id: merchantId,
            amount,
            token,
            payment_link: paymentLink,
            status: "pending"
        });

        // Create invoice (single source of truth)
        const existingInvoice = await Invoice.findOne({
            where: { payment_intent_id: intent.id }
        });

        if (!existingInvoice) {

            await Invoice.create({
                payment_intent_id: intent.id,
                merchant_id: merchantId,
                amount,
                status: "pending",
                issued_at: new Date(),

                // 🔥 CRITICAL: Must match token used in frontend
                public_token: token
            });
        }

        return intent;
    }

    // =============================================================================
    // GET BY PURCHASE ORDER
    // =============================================================================
    async getByPurchaseOrderId(purchaseOrderId: number): Promise<any> {
        return await PaymentIntent.findOne({
            where: { purchase_order_id: purchaseOrderId }
        });
    }

    // =============================================================================
    // GET BY TOKEN
    // =============================================================================
    async getByToken(token: string): Promise<any> {

        if (!token)
            throw new Error("token required");

        return await PaymentIntent.findOne({
            where: { token }
        });
    }
}