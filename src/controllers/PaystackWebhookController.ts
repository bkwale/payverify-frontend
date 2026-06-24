import { Request, Response } from "express";
import Transaction from "../models/Transaction";
import { Payment } from "../models/Payment";
import { PaymentIntent } from "../models/PaymentIntent"; // ✅ ADDED
import fs from "fs";
import path from "path";
import { PurchaseOrder } from "../models";
import Invoice from "../models/Invoice";

export class PaystackWebhookController {

    /**
     * ============================================================
     * HANDLE PAYSTACK WEBHOOK EVENTS
     * ============================================================
     */
    async handleWebhook(req: Request, res: Response): Promise<Response | void> {

        console.log("🔥 WEBHOOK HIT");

        try {

            /**
             * ============================================================
             * ⚠️ TEMP: SIGNATURE VALIDATION DISABLED
             * ============================================================
             */
            console.log("⚠️ Skipping signature validation for now");

            /**
             * ============================================================
             * LOG FULL PAYLOAD (DEBUGGING)
             * ============================================================
             */
            console.log("📦 Webhook Body:", JSON.stringify(req.body, null, 2));

            /**
             * ============================================================
             * 🔥 PARSE EVENT SAFELY
             * ============================================================
             */
            let event;

            if (Buffer.isBuffer(req.body)) {
                const rawBody = req.body.toString("utf-8");
                event = JSON.parse(rawBody);
            } else {
                event = req.body;
            }

            console.log("✅ Parsed Event:", event);

            /**
             * ============================================================
             * HANDLE SUCCESSFUL PAYMENT
             * ============================================================
             */
            if (event.event === "charge.success") {

                const reference = event.data.reference;

                console.log("✅ Payment success for reference:", reference);

                console.log("🔥 PAYSTACK SUCCESS EVENT RECEIVED");
                console.log("🔥 Reference:", reference);

                /**
                 * ============================================================
                 * 🔥 FIX #1: FIND PaymentIntent (NOT Transaction)
                 * ============================================================
                 * WHY:
                 * Your system stores Paystack reference as "token"
                 * in PaymentIntent, not in Transaction
                 */
                //const paymentIntent = await PaymentIntent.findOne({
                //    where: { token: reference }
                //});

                /**
                /**
 /**
 * ============================================================
 * FIND INVOICE USING WEBHOOK METADATA
 * ============================================================
 */
                const eventData = JSON.parse(req.body.toString());

                /**
 * ============================================================
 * FIND INVOICE USING WEBHOOK METADATA
 * ============================================================
 * WHY:
 * Paystack sends invoiceId inside metadata.
 * ============================================================
 */
                const invoiceId = eventData.data.metadata?.invoiceId;

                console.log("🔥 Invoice ID:", invoiceId);

                /**
                 * ============================================================
                 * FIND INVOICE
                 * ============================================================
                 */
                const invoice = await Invoice.findByPk(invoiceId);

                if (!invoice) {

                    console.error("❌ Invoice NOT FOUND:", invoiceId);

                    return res.sendStatus(200);
                }

                console.log("✅ Invoice Found:", invoice.id);

                /**
                 * ============================================================
                 * FIND PAYMENT INTENT
                 * ============================================================
                 */
                const paymentIntent = await PaymentIntent.findByPk(
                    invoice.payment_intent_id
                );

                if (!paymentIntent) {

                    console.error(
                        "❌ PaymentIntent NOT FOUND for invoice:",
                        invoiceId
                    );

                    return res.sendStatus(200);
                }

                console.log("✅ PaymentIntent Found:", paymentIntent.id);

                if (!paymentIntent) {
                    console.error("❌ PaymentIntent NOT FOUND:", reference);
                    return res.sendStatus(200);
                }

                /**
                 * ============================================================
                 * 🔥 FIX #2: IDEMPOTENCY CHECK (UPDATED VARIABLE)
                 * ============================================================
                 */
                if (paymentIntent.status === "paid") {
                    console.log("⚠️ Already processed, skipping...");
                    return res.sendStatus(200);
                }

                /**
                 * ============================================================
                 * 🔥 FIX #3: UPDATE PaymentIntent (NOT transaction)
                 * ============================================================
                 */
                paymentIntent.status = "paid";
                await paymentIntent.save();

                console.log("✅ PaymentIntent marked as PAID:", paymentIntent.id);


               /**
                 * ============================================================
                 * NEW: UPDATE PURCHASE ORDER STATUS
                 * ============================================================
                 * WHY:
                 * Dashboard reads purchase_order.status directly
                 */
                //const transaction = await Transaction.findOne({
                //    where: { reference }
                //});

                const purchaseOrder = await PurchaseOrder.findByPk(
                    paymentIntent.purchase_order_id
                );


                //if (transaction) {
                //    await transaction.update({ status: "completed" });
                //    console.log("✅ Transaction updated:", transaction.id);
                //}

                ///**
                // * ============================================================
                // * 🔥 FIX #4: UPDATE PAYMENT TABLE (SAFE)
                // * ============================================================
                // * NOTE:
                // * Adjust field if needed (transactionId vs paymentIntentId)
                // */
                //await Payment.update(
                //    { status: "paid" },
                //    {
                //        where: {
                //            transactionId: transaction?.id // safe optional
                //        }
                //    }
                //);

                //console.log("✅ Payment table updated successfully");

                if (purchaseOrder) {

                    await purchaseOrder.update({
                        status: "paid"
                    });

                    console.log(
                        "✅ PurchaseOrder marked as PAID:",
                        purchaseOrder.id
                    );
                }
                /**
                 * ============================================================
                 * OPTIONAL: UPDATE TRANSACTION IF EXISTS
                 * ============================================================
                 */
                const transaction = await Transaction.findOne({
                    where: { reference }
                });


                /**
                 * ============================================================
                 * 🧾 GENERATE RECEIPT (UNCHANGED)
                 * ============================================================
                 */
                const receipt = {
                    paymentIntentId: paymentIntent.id, // ✅ updated source
                    reference,
                    amount: event.data.amount / 100,
                    currency: event.data.currency,
                    status: "paid",
                    paidAt: new Date(),
                    customerEmail: event.data.customer?.email
                };

                console.log("🧾 Receipt generated:", receipt);

                /**
                 * ============================================================
                 * 💾 SAVE RECEIPT LOCALLY
                 * ============================================================
                 */
                const receiptsDir = path.join(__dirname, "../../receipts");

                if (!fs.existsSync(receiptsDir)) {
                    fs.mkdirSync(receiptsDir, { recursive: true });
                }

                const filePath = path.join(receiptsDir, `${reference}.json`);

                fs.writeFileSync(
                    filePath,
                    JSON.stringify(receipt, null, 2)
                );

                console.log("💾 Receipt saved at:", filePath);
            }

            return res.sendStatus(200);

        } catch (error) {

            console.error("❌ FULL WEBHOOK ERROR:", error);

            return res.status(500).send("Webhook processing failed");
        }
    }
}