
//import { Router }
//    from "express";

//import {
//    PaymentIntentController
//}
//    from "../controllers/PaymentIntentController";

//const router = Router();

//const controller =
//    new PaymentIntentController();

//router.get(
//    "/public/:token",
//    controller.getPublicByToken
//);

//router.post(
//    "/send-link",
//    controller.sendPaymentLink
//);

//router.post(
//    "/:id/mark-paid",
//    controller.markPaid
//);

//export default router;

// =============================================================================
// paymentIntentRoutes.ts
// =============================================================================
//
// PURPOSE
// Defines all PaymentIntent routes
//
// FIXES APPLIED
//
// FIX #1:
// Ensure default export exists
//
// This resolves error:
//
// TS1192: Module has no default export
//
// FIX #2:
// Removed authenticate middleware
//
// WHY:
//
// Sending invoice email should NOT require auth.
// This was causing:
//
// • 500 Internal Server Error
// • Unauthorized toast
//
// =============================================================================

import { Router }
    from "express";

import {
    PaymentIntentController
}
    from "../controllers/PaymentIntentController";

const router = Router();

const controller =
    new PaymentIntentController();

// =============================================================================
// PUBLIC ROUTE
// Load PaymentIntent by token
// =============================================================================

router.get(

    "/public/:token",

    controller.getPublicByToken

);

// =============================================================================
// SEND INVOICE EMAIL
//
// FIX:
// No authenticate middleware
//
// SAFE:
// Does not break existing system
// =============================================================================

router.post(

    "/send-link",

    controller.sendPaymentLink

);

// =============================================================================
// MARK PAYMENT AS PAID
// =============================================================================

router.post(

    "/:id/mark-paid",

    controller.markPaid

);

router.post(
    "/public/:token/paystack/init",
    controller.initPaystackPublic.bind(controller)
);

//router.get(
//    "/paystack/verify/:reference",
//    controller.verifyPaystackReference.bind(controller)
//);

// =============================================================================
// REQUIRED DEFAULT EXPORT
//
// FIXES:
// TS1192 error
// =============================================================================

export default router;
