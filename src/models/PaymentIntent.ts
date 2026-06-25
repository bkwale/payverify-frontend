//////import {

//import {
//    Model,
//    DataTypes,
//    Optional
//} from "sequelize";

//import { sequelize } from "../config/db";

//export interface PaymentIntentAttributes {
//    id: string; // ✅ UUID string

//    purchase_order_id: number;
//    merchant_id: number;

//    amount: number; // DB: numeric(14,2)
//    status: "pending" | "paid" | "expired";

//    token?: string | null;
//    payment_link?: string | null;
//    qr_url?: string | null;

//    customer_email?: string | null;

//    // You said you may add later; keep optional for forward-compat
//    customer_phone?: string | null;
//    customer_name?: string | null;

//    expires_at?: Date | null;
//    paid_at?: Date | null;

//    created_at?: Date;
//    updated_at?: Date;
//}

//type PaymentIntentCreationAttributes =
//    Optional<
//        PaymentIntentAttributes,
//        "id" |
//        "token" |
//        "payment_link" |
//        "qr_url" |
//        "customer_email" |
//        "customer_phone" |
//        "customer_name" |
//        "expires_at" |
//        "paid_at" |
//        "created_at" |
//        "updated_at"
//    >;

//export class PaymentIntent
//    extends Model<PaymentIntentAttributes, PaymentIntentCreationAttributes>
//    implements PaymentIntentAttributes {

//    public id!: string;

//    public purchase_order_id!: number;
//    public merchant_id!: number;

//    public amount!: number;
//    public status!: "pending" | "paid" | "expired";

//    public token?: string | null;
//    public payment_link?: string | null;
//    public qr_url?: string | null;

//    public customer_email?: string | null;
//    public customer_phone?: string | null;
//    public customer_name?: string | null;

//    public expires_at?: Date | null;
//    public paid_at?: Date | null;

//    public readonly created_at!: Date;
//    public readonly updated_at!: Date;
//}

//PaymentIntent.init(
//    {
//        id: {
//            type: DataTypes.UUID,
//            defaultValue: DataTypes.UUIDV4, // ✅ aligns with uuid default behavior
//            primaryKey: true
//        },

//        purchase_order_id: {
//            type: DataTypes.INTEGER,
//            allowNull: false
//        },

//        merchant_id: {
//            type: DataTypes.INTEGER,
//            allowNull: false
//        },

//        amount: {
//            type: DataTypes.DECIMAL(14, 2),
//            allowNull: false,
//            defaultValue: 0
//        },

//        status: {
//            type: DataTypes.STRING(20),
//            allowNull: false,
//            defaultValue: "pending"
//        },

//        token: {
//            type: DataTypes.TEXT,
//            allowNull: true
//        },

//        payment_link: {
//            type: DataTypes.TEXT,
//            allowNull: true
//        },

//        qr_url: {
//            type: DataTypes.TEXT,
//            allowNull: true
//        },

//        customer_email: {
//            type: DataTypes.TEXT,
//            allowNull: true
//        },

//        // Optional forward-compatible columns (add later if you want)
//        customer_phone: {
//            type: DataTypes.TEXT,
//            allowNull: true
//        },

//        customer_name: {
//            type: DataTypes.TEXT,
//            allowNull: true
//        },

//        expires_at: {
//            type: DataTypes.DATE,
//            allowNull: true
//        },

//        paid_at: {
//            type: DataTypes.DATE,
//            allowNull: true
//        }
//    },
//    {
//        sequelize,
//        tableName: "payment_intents",
//        timestamps: true,      // ✅ maps created_at/updated_at
//        underscored: true      // ✅ uses snake_case columns
//    }
//);

//export default PaymentIntent;

// =============================================================================
// PaymentIntent Model (FIXED — UUID SAFE)
// =============================================================================
// WHAT CHANGED AND WHY
//
// ✅ FIX #1: id is now UUID string (matches Postgres)
// ✅ FIX #2: removed autoIncrement integer PK
// ✅ FIX #3: added customer_email / phone / name
// ✅ FIX #4: nullable fields aligned with DB
// =============================================================================

import {
    Model,
    DataTypes,
    Optional
} from 'sequelize';

import { sequelize } from '../config/db';

// =============================================================================
// Attributes Interface
// =============================================================================

export interface PaymentIntentAttributes {

    id: string; // ✅ FIX: must be string (UUID)

    purchase_order_id: number;
    merchant_id: number;
    amount: number;

    token: string;

    payment_link?: string | null;
    qr_url?: string | null;

    status: 'pending' | 'paid' | 'expired';

    expires_at?: Date | null;
    paid_at?: Date | null;

    // ✅ NEW — customer metadata
    customer_email?: string | null;
    customer_phone?: string | null;
    customer_name?: string | null;

    created_at?: Date;
    updated_at?: Date;
}

// =============================================================================
// Creation Attributes
// =============================================================================

interface PaymentIntentCreationAttributes
    extends Optional<
        PaymentIntentAttributes,
        | 'id'
        | 'paid_at'
        | 'created_at'
        | 'updated_at'
        | 'customer_email'
        | 'customer_phone'
        | 'customer_name'
        | 'payment_link'
        | 'qr_url'
        | 'expires_at'
    > { }

// =============================================================================
// Model Class
// =============================================================================

export class PaymentIntent
    extends Model<
        PaymentIntentAttributes,
        PaymentIntentCreationAttributes
    >
    implements PaymentIntentAttributes {

    public id!: string; // ✅ UUID

    public purchase_order_id!: number;
    public merchant_id!: number;
    public amount!: number;

    public token!: string;

    public payment_link!: string | null;
    public qr_url!: string | null;

    public status!: 'pending' | 'paid' | 'expired';

    public expires_at!: Date | null;
    public paid_at!: Date | null;

    public customer_email!: string | null;
    public customer_phone!: string | null;
    public customer_name!: string | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

// =============================================================================
// Model Initialization
// =============================================================================

PaymentIntent.init({

    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },

    purchase_order_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    merchant_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    amount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0
    },

    token: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true
    },

    payment_link: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    qr_url: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'pending'
    },

    customer_email: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    customer_phone: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    customer_name: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    expires_at: {
        type: DataTypes.DATE,
        allowNull: true
    },

    paid_at: {
        type: DataTypes.DATE,
        allowNull: true
    }

},
    {
        sequelize,
        tableName: 'payment_intents',
        timestamps: true,
        underscored: true
    });
