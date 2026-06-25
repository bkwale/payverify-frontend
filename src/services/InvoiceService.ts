//////////////// =============================================================================

//import fs from "fs";
//import path from "path";
//import PDFDocument from "pdfkit";
//import QRCode from "qrcode";

//import { PaymentIntent } from "../models/PaymentIntent";
//import PurchaseOrder from "../models/PurchaseOrder";
//import { PurchaseOrderItem } from "../models/PurchaseOrderItem";
//import { Invoice } from "../models/Invoice";

//let useNairaSymbol = true;

//const FRONTEND_BASE_URL =
//    process.env.FRONTEND_BASE_URL || "http://localhost:5173";

//function formatNaira(amount: number): string {
//    const safeAmount = Number(amount || 0);

//    try {
//        if (useNairaSymbol) {
//            return `₦${safeAmount.toLocaleString("en-NG", {
//                minimumFractionDigits: 2,
//                maximumFractionDigits: 2,
//            })}`;
//        }

//        return `NGN ${safeAmount.toLocaleString("en-NG", {
//            minimumFractionDigits: 2,
//            maximumFractionDigits: 2,
//        })}`;
//    } catch {
//        return `NGN ${safeAmount.toFixed(2)}`;
//    }
//}

//function generateInvoiceNumber(intentId: number | string): string {
//    const seed =
//        typeof intentId === "number"
//            ? intentId
//            : Math.abs(
//                intentId
//                    .toString()
//                    .split("")
//                    .map((c) => c.charCodeAt(0))
//                    .reduce((a, b) => a + b, 0)
//            );

//    const year = new Date().getFullYear();
//    return `PV-${year}-${seed.toString().slice(-6)}`;
//}

//export class InvoiceService {
//    // ===========================================================================
//    // PUBLIC — Generate by token
//    // ===========================================================================
//    async generateInvoicePdfByToken(token: string): Promise<Buffer> {
//        if (!token) throw new Error("Token is required");

//        const paymentIntent = await PaymentIntent.findOne({
//            where: { token },
//        });

//        if (!paymentIntent) {
//            throw new Error("Payment intent not found");
//        }

//        return this.generateInvoicePdf(paymentIntent.id);
//    }

//    // ===========================================================================
//    // QR generator
//    // ===========================================================================
//    private async generateQRCodeBuffer(text: string): Promise<Buffer> {
//        try {
//            return await QRCode.toBuffer(text, {
//                width: 80,
//                margin: 1,
//            });
//        } catch {
//            return Buffer.from("");
//        }
//    }

//    // ===========================================================================
//    // MAIN PDF GENERATOR
//    // ===========================================================================
//    async generateInvoicePdf(
//        paymentIntentId: number | string
//    ): Promise<Buffer> {
//        // -------------------------------------------------------------------------
//        // Load intent
//        // -------------------------------------------------------------------------
//        const intent = await PaymentIntent.findByPk(paymentIntentId);
//        if (!intent) throw new Error("PaymentIntent not found");

//        // -------------------------------------------------------------------------
//        // Ensure invoice exists
//        // -------------------------------------------------------------------------
//        let invoiceRecord = await Invoice.findOne({
//            where: { payment_intent_id: intent.id },
//        });

//        if (!invoiceRecord) {
//            invoiceRecord = await Invoice.create({
//                payment_intent_id: intent.id,
//                merchant_id: intent.merchant_id,
//                amount: intent.amount,
//                status: "pending",
//                issued_at: new Date(),
//            });
//        }

//        // -------------------------------------------------------------------------
//        // Determine status
//        // -------------------------------------------------------------------------
//        const invoiceStatus =
//            invoiceRecord.status?.toLowerCase() || "pending";

//        const isPaid =
//            invoiceStatus === "paid" ||
//            invoiceStatus === "success" ||
//            invoiceStatus === "completed";

//        // -------------------------------------------------------------------------
//        // Load PO
//        // -------------------------------------------------------------------------
//        const po = await PurchaseOrder.findByPk(
//            intent.purchase_order_id
//        );
//        if (!po) throw new Error("PurchaseOrder not found");

//        // -------------------------------------------------------------------------
//        // Load items
//        // -------------------------------------------------------------------------
//        const items = await PurchaseOrderItem.findAll({
//            where: { purchaseOrderId: po.id },
//        });

//        // -------------------------------------------------------------------------
//        // Normalize items
//        // -------------------------------------------------------------------------
//        let subtotal = 0;

//        const normalizedItems = items.map((item: any) => {
//            const qty =
//                Number(
//                    item.quantity ??
//                    item.qty ??
//                    item.quantity_ordered ??
//                    0
//                ) || 0;

//            const price =
//                Number(
//                    item.unitPrice ??
//                    item.unit_price ??
//                    item.price ??
//                    0
//                ) || 0;

//            const name =
//                item.description ??
//                item.itemName ??
//                item.item_name ??
//                "Item";

//            const lineTotal = qty * price;
//            subtotal += lineTotal;

//            return {
//                name,
//                quantity: qty,
//                unitPrice: price,
//                lineTotal,
//            };
//        });

//        const tax = subtotal * 0.075;
//        const grandTotal = subtotal + tax;
//        const invoiceNumber = generateInvoiceNumber(intent.id);

//        // -------------------------------------------------------------------------
//        // ✅ CRITICAL FIX — CORRECT PAY URL
//        // -------------------------------------------------------------------------
//        const payUrl = `${FRONTEND_BASE_URL}/pay/${invoiceRecord.id}`;

//        // -------------------------------------------------------------------------
//        // Create PDF
//        // -------------------------------------------------------------------------
//        const doc = new PDFDocument({
//            margin: 50,
//            size: "A4",
//        });

//        const buffers: Buffer[] = [];
//        doc.on("data", buffers.push.bind(buffers));

//        // -------------------------------------------------------------------------
//        // Watermark
//        // -------------------------------------------------------------------------
//        doc.save();

//        doc
//            .fontSize(80)
//            .fillOpacity(isPaid ? 0.12 : 0.08)
//            .fillColor(isPaid ? "#28A745" : "#CCCCCC")
//            .rotate(-45, {
//                origin: [doc.page.width / 2, doc.page.height / 2],
//            });

//        doc.text(
//            isPaid ? "PAID" : "PAYVERIFY",
//            doc.page.width / 2 - 180,
//            doc.page.height / 2 - 100,
//            { align: "center", width: 360 }
//        );

//        doc.restore();
//        doc.fillOpacity(1);

//        // -------------------------------------------------------------------------
//        // HEADER
//        // -------------------------------------------------------------------------
//        doc.roundedRect(440, 45, 120, 35, 5)
//            .fillColor(isPaid ? "#28A745" : "#FF0000")
//            .fill();

//        doc.fillColor("#FFFFFF")
//            .fontSize(16)
//            .font("Helvetica-Bold")
//            .text(isPaid ? "PAID" : "PENDING", 460, 53, {
//                width: 80,
//                align: "center",
//            });

//        // -------------------------------------------------------------------------
//        // TITLE
//        // -------------------------------------------------------------------------
//        doc.moveDown(2);

//        doc.fontSize(24)
//            .fillColor("#000")
//            .font("Helvetica-Bold")
//            .text("PAYVERIFY INVOICE", 50, 120);

//        doc.fontSize(10).font("Helvetica");

//        doc.text(`Invoice #: ${invoiceNumber}`, 50, 155);
//        doc.text(`PaymentIntent ID: ${intent.id}`, 50, 170);
//        doc.text(`Purchase Order ID: ${po.id}`, 50, 185);

//        // -------------------------------------------------------------------------
//        // ✅ PAY NOW LINK (ONLY IF UNPAID)
//        // -------------------------------------------------------------------------
//        if (!isPaid) {
//            doc.moveDown(2);

//            doc
//                .fillColor("#2563eb")
//                .font("Helvetica-Bold")
//                .fontSize(12)
//                .text("Click here to Pay Now", {
//                    link: payUrl,
//                    underline: true,
//                });

//            doc.fillColor("#000");
//        }

//        doc.end();

//        return new Promise((resolve) => {
//            doc.on("end", () => resolve(Buffer.concat(buffers)));
//        });
//    }

//    // ===========================================================================
//    // WEBHOOK SAFE CREATION
//    // ===========================================================================
//    async createFromPaymentIntent(
//        paymentIntentId: number | string
//    ): Promise<any> {
//        const intent = await PaymentIntent.findByPk(paymentIntentId);
//        if (!intent) throw new Error("PaymentIntent not found");

//        const existing = await Invoice.findOne({
//            where: { payment_intent_id: intent.id },
//        });

//        if (existing) return existing;

//        return Invoice.create({
//            payment_intent_id: intent.id,
//            merchant_id: intent.merchant_id,
//            amount: intent.amount,
//            status: "pending",
//            issued_at: new Date(),
//        });
//    }
//}

// =============================================================================
// InvoiceService.ts (PRODUCTION HARDENED — PUBLIC TOKEN FIX)
// =============================================================================

import fs from "fs";
import path from "path";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

import { PaymentIntent } from "../models/PaymentIntent";
import PurchaseOrder from "../models/PurchaseOrder";
import { PurchaseOrderItem } from "../models/PurchaseOrderItem";
import { Invoice } from "../models/Invoice";

// =============================================================================
// Helpers
// =============================================================================

let useNairaSymbol = true;

const FRONTEND_BASE_URL =
    process.env.FRONTEND_BASE_URL || "http://localhost:5173";

function generatePublicToken(): string {
    // shorter, URL safe
    return crypto.randomUUID().replace(/-/g, "");
}

function formatNaira(amount: number): string {
    const safeAmount = Number(amount || 0);

    try {
        if (useNairaSymbol) {
            return `₦${safeAmount.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })}`;
        }

        return `NGN ${safeAmount.toLocaleString("en-NG", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    } catch {
        return `NGN ${safeAmount.toFixed(2)}`;
    }
}

function generateInvoiceNumber(intentId: number | string): string {
    const seed =
        typeof intentId === "number"
            ? intentId
            : Math.abs(
                intentId
                    .toString()
                    .split("")
                    .map((c) => c.charCodeAt(0))
                    .reduce((a, b) => a + b, 0)
            );

    const year = new Date().getFullYear();
    return `PV-${year}-${seed.toString().slice(-6)}`;
}

// =============================================================================
// Service
// =============================================================================

export class InvoiceService {

    // ===========================================================================
    // PUBLIC — Generate by token
    // ===========================================================================
    async generateInvoicePdfByToken(token: string): Promise<Buffer> {
        if (!token) throw new Error("Token is required");

        const paymentIntent = await PaymentIntent.findOne({
            where: { token },
        });

        if (!paymentIntent) {
            throw new Error("Payment intent not found");
        }

        return this.generateInvoicePdf(paymentIntent.id);
    }

    // ===========================================================================
    // QR generator
    // ===========================================================================
    private async generateQRCodeBuffer(text: string): Promise<Buffer> {
        try {
            return await QRCode.toBuffer(text, {
                width: 80,
                margin: 1,
            });
        } catch {
            return Buffer.from("");
        }
    }

    // ===========================================================================
    // 🔥 ENSURE INVOICE EXISTS (WITH PUBLIC TOKEN)
    // ===========================================================================
    private async ensureInvoice(intent: any, amount: number) {

        let invoiceRecord = await Invoice.findOne({
            where: { payment_intent_id: intent.id },
        });

        // -----------------------------------------------------------------------
        // Create if missing
        // -----------------------------------------------------------------------
        if (!invoiceRecord) {
            invoiceRecord = await Invoice.create({
                payment_intent_id: intent.id,
                merchant_id: intent.merchant_id,
                amount,
                status: "pending",
                issued_at: new Date(),

                // 🔥 CRITICAL FIX
                public_token: generatePublicToken(),
            });
        }

        // -----------------------------------------------------------------------
        // 🔥 AUTO-HEAL legacy rows (VERY IMPORTANT)
        // -----------------------------------------------------------------------
        if (!invoiceRecord.public_token) {
            invoiceRecord.public_token = generatePublicToken();
            await invoiceRecord.save();
        }

        return invoiceRecord;
    }

    // ===========================================================================
    // MAIN PDF GENERATOR
    // ===========================================================================
    async generateInvoicePdf(
        paymentIntentId: number | string
    ): Promise<Buffer> {

        const intent = await PaymentIntent.findByPk(paymentIntentId);
        if (!intent) throw new Error("PaymentIntent not found");

        const po = await PurchaseOrder.findByPk(intent.purchase_order_id);
        if (!po) throw new Error("PurchaseOrder not found");

        const items = await PurchaseOrderItem.findAll({
            where: { purchaseOrderId: po.id },
        });

        let subtotal = 0;

        const normalizedItems = items.map((item: any) => {
            const qty = Number(item.quantity ?? item.qty ?? 0) || 0;
            const price = Number(item.unitPrice ?? item.unit_price ?? 0) || 0;
            const name =
                item.description ??
                item.itemName ??
                item.item_name ??
                "Item";

            const lineTotal = qty * price;
            subtotal += lineTotal;

            return { name, quantity: qty, unitPrice: price, lineTotal };
        });

        const tax = subtotal * 0.075;
        const grandTotal = subtotal + tax;
        const invoiceNumber = generateInvoiceNumber(intent.id);

        // 🔥 CRITICAL — guaranteed token
        const invoiceRecord = await this.ensureInvoice(intent, grandTotal);

        // 🔥 CORRECT PUBLIC PAYMENT LINK
        const payUrl = `${FRONTEND_BASE_URL}/pay/${invoiceRecord.public_token}`;

        // -----------------------------------------------------------------------
        // PDF creation (your layout preserved)
        // -----------------------------------------------------------------------
        const doc = new PDFDocument({ margin: 50, size: "A4" });
        const buffers: Buffer[] = [];
        doc.on("data", buffers.push.bind(buffers));

        const isPaid =
            invoiceRecord.status?.toLowerCase() === "paid" ||
            invoiceRecord.status?.toLowerCase() === "completed";

        // Watermark
        doc.save();
        doc.fontSize(80)
            .fillOpacity(isPaid ? 0.12 : 0.08)
            .fillColor(isPaid ? "#28A745" : "#CCCCCC")
            .rotate(-45, {
                origin: [doc.page.width / 2, doc.page.height / 2],
            });

        doc.text(
            isPaid ? "PAID" : "PAYVERIFY",
            doc.page.width / 2 - 180,
            doc.page.height / 2 - 100,
            { align: "center", width: 360 }
        );

        doc.restore();
        doc.fillOpacity(1);

        // Header
        doc.roundedRect(440, 45, 120, 35, 5)
            .fillColor(isPaid ? "#28A745" : "#FF0000")
            .fill();

        doc.fillColor("#FFFFFF")
            .fontSize(16)
            .font("Helvetica-Bold")
            .text(isPaid ? "PAID" : "PENDING", 460, 53, {
                width: 80,
                align: "center",
            });

        doc.moveDown(2);

        doc.fontSize(24)
            .fillColor("#000")
            .font("Helvetica-Bold")
            .text("PAYVERIFY INVOICE", 50, 120);

        doc.fontSize(10).font("Helvetica");

        doc.text(`Invoice #: ${invoiceNumber}`, 50, 155);
        doc.text(`PaymentIntent ID: ${intent.id}`, 50, 170);
        doc.text(`Purchase Order ID: ${po.id}`, 50, 185);

        // ✅ INSERT HERE (line items + totals)

        // ===============================
        // 🔥 LINE ITEMS TABLE
        // ===============================
        let y = 230;

        doc.font("Helvetica-Bold").fontSize(11);

        doc.text("Item", 50, y);
        doc.text("Qty", 250, y);
        doc.text("Unit Price", 320, y);
        doc.text("Total", 430, y);

        y += 15;

        doc.moveTo(50, y).lineTo(550, y).stroke();

        y += 10;

        doc.font("Helvetica").fontSize(10);

        if (!normalizedItems || normalizedItems.length === 0) {
            doc.text("No items available", 50, y);
            y += 20;
        } else {
            normalizedItems.forEach(item => {
                doc.text(item.name, 50, y);
                doc.text(String(item.quantity), 250, y);
                doc.text(formatNaira(item.unitPrice), 320, y);
                doc.text(formatNaira(item.lineTotal), 430, y);
                y += 20;
            });
        }

        // ===============================
        // 🔥 TOTALS
        // ===============================
        y += 10;

        doc.moveTo(300, y).lineTo(550, y).stroke();

        y += 10;

        doc.font("Helvetica-Bold");

        doc.text("Subtotal:", 320, y);
        doc.text(formatNaira(subtotal), 430, y);

        y += 20;

        doc.text("Tax (7.5%):", 320, y);
        doc.text(formatNaira(tax), 430, y);

        y += 20;

        doc.fontSize(12);

        doc.text("Total:", 320, y);
        doc.text(formatNaira(grandTotal), 430, y);

        doc.fontSize(10);

        // Pay link
        if (!isPaid) {
            doc.moveDown(2);

            doc.fillColor("#2563eb")
                .font("Helvetica-Bold")
                .fontSize(12)
                .text("Click here to Pay Now", {
                    link: payUrl,
                    underline: true,
                });

            doc.fillColor("#000");
        }

        doc.end();

        return new Promise((resolve) => {
            doc.on("end", () => resolve(Buffer.concat(buffers)));
        });
    }

    //async createFromPaymentIntent(
    //    paymentIntentId: number | string
    //): Promise<any> {

    //    const intent = await PaymentIntent.findByPk(paymentIntentId);
    //    if (!intent) throw new Error("PaymentIntent not found");

    //    return this.ensureInvoice(intent, intent.amount);
    //}

    // =============================================================================
// FIXED — createFromPaymentIntent (CRITICAL FIX)
// =============================================================================
//
// WHAT CHANGED:
//
// 1. Ensures invoice ALWAYS exists
// 2. Adds public_token support
// 3. Prevents "Invoice not found"
// 4. Keeps backward compatibility
//
// =============================================================================

async createFromPaymentIntent(
    paymentIntentId: number | string
): Promise<any> {

    const intent = await PaymentIntent.findByPk(paymentIntentId);

    if (!intent) {
        throw new Error("PaymentIntent not found");
    }

    // -------------------------------------------------------------------------
    // 🔥 CHECK EXISTING INVOICE
    // -------------------------------------------------------------------------
    let existing = await Invoice.findOne({
        where: { payment_intent_id: intent.id },
    });

    if (existing) {
        return existing;
    }

    // -------------------------------------------------------------------------
    // 🔥 CREATE NEW INVOICE (FIXED)
    // -------------------------------------------------------------------------
    const invoice = await Invoice.create({
        payment_intent_id: intent.id,
        merchant_id: intent.merchant_id,
        amount: intent.amount,
        status: "pending",
        issued_at: new Date(),

        // 🔥 OPTIONAL (safe even if column doesn't exist yet)
        public_token: crypto.randomUUID?.() || `${intent.id}-${Date.now()}`
    });

    return invoice;
}
}