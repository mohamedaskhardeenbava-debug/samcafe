// user panel
// src/components/placeOrder.js   this is the file for placing the order of foods. 
import api from "../api";
import { stripCustomizedPrefix } from "../UserPanel/shared/bagUtils";

const CGST_RATE = 0.025;
const SGST_RATE = 0.025;

/** Formats an ISO date string as DD/MM/YYYY for the receipt printer. */
const formatForPrinter = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-GB");
};

/** Computes subtotal + CGST/SGST + grand total (all rounded) for a bag. */
const calculateTotals = (bag) => {
    const totalAmount = bag.reduce(
        (sum, item) => sum + Number(item.totalPrice || 0),
        0
    );

    const cgst = Number((totalAmount * CGST_RATE).toFixed(2));
    const sgst = Number((totalAmount * SGST_RATE).toFixed(2));

    return {
        totalAmount,
        totalWithGST: {
            subTotal: Math.round(totalAmount),
            cgst,
            sgst,
            total: Math.round(totalAmount + cgst + sgst)
        }
    };
};

<<<<<<< HEAD
/** Fetches the logged-in user's name/mobile, or "Guest" if none is stored. */
const resolveUser = async (userId) => {
    if (!userId) return { userName: "Guest", mobileNo: null };

    const userRes = await api.get(`/users/${userId}`);
    return {
        userName: userRes.data?.name || "Guest",
        mobileNo: userRes.data?.mobile || null
    };
};

/** Deducts the ingredients consumed by this order from the stock collection. */
const updateIngredientStock = async (bag) => {
    const ingredientsRes = await api.get("/ingredients");
    const allIngredients = ingredientsRes.data;

    const stockUpdates = allIngredients
        .map((ing) => {
            let usedKg = 0;
            bag.forEach((item) => {
                (item.ingredients || []).forEach((i) => {
                    if (i.name === ing.name) {
                        usedKg += ((i.quantity || 0) * (item.quantity || 1)) / 1000;
                    }
                });
            });

            if (usedKg <= 0) return null;

            const updated = {
                ...ing,
                stockRemaining: Math.max(0, ing.stockRemaining - usedKg)
            };
            return api.put(`/ingredients/${ing.id}`, updated);
        })
        .filter(Boolean);

    await Promise.all(stockUpdates);
=======
/** Fetches the logged-in user's name/mobile, or "Guest" if none is stored
 *  or the lookup fails for any reason (don't let a user-lookup hiccup
 *  block placing the order). */
const resolveUser = async (userId) => {
    if (!userId) return { userName: "Guest", mobileNo: null };

    try {
        const userRes = await api.get(`/users/${userId}`);
        return {
            userName: userRes.data?.name || "Guest",
            mobileNo: userRes.data?.mobile || null
        };
    } catch (err) {
        console.warn("Could not resolve user for order, falling back to Guest:", err);
        return { userName: "Guest", mobileNo: null };
    }
};

/** Deducts the ingredients consumed by this order from the stock collection.
 *  Failures here are logged but not thrown — stock-tracking is secondary
 *  to the order itself already being saved, and a partial/failed stock
 *  update should never make a successfully-placed order look like it failed. */
const updateIngredientStock = async (bag) => {
    try {
        const ingredientsRes = await api.get("/ingredients");
        const allIngredients = ingredientsRes.data;

        const stockUpdates = allIngredients
            .map((ing) => {
                let usedKg = 0;
                bag.forEach((item) => {
                    (item.ingredients || []).forEach((i) => {
                        if (i.name === ing.name) {
                            usedKg += ((i.quantity || 0) * (item.quantity || 1)) / 1000;
                        }
                    });
                });

                if (usedKg <= 0) return null;

                const updated = {
                    ...ing,
                    stockRemaining: Math.max(0, ing.stockRemaining - usedKg)
                };
                return api.put(`/ingredients/${ing.id}`, updated);
            })
            .filter(Boolean);

        await Promise.all(stockUpdates);
    } catch (err) {
        console.error("Failed to update ingredient stock after order placement:", err);
    }
>>>>>>> 656ff502cab1f2fdbb0bf4277e7fcba04fabeae8
};

/** Best-effort fire-and-forget KOT print request — failures are silently ignored. */
const sendKotToPrinter = (savedOrder, totalWithGST) => {
    const printerOrder = {
        ...savedOrder,
        date: formatForPrinter(savedOrder.date),
        gst: {
            cgst: totalWithGST.cgst,
            sgst: totalWithGST.sgst,
            total: totalWithGST.total
        }
    };

<<<<<<< HEAD
    fetch("http://localhost:9001/print/kot", {
=======
    const printServerUrl = process.env.REACT_APP_PRINT_SERVER_URL || "http://localhost:9001";
    fetch(`${printServerUrl}/print/kot`, {
>>>>>>> 656ff502cab1f2fdbb0bf4277e7fcba04fabeae8
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: printerOrder })
    }).catch(() => { });
};

/**
 * Places a new order from the current bag:
 *  1. Resolves the current user (or "Guest")
 *  2. Builds the order payload (items, totals, GST breakdown)
 *  3. Saves the order via the API (server assigns the real id)
 *  4. Deducts consumed ingredients from stock
 *  5. Sends a best-effort KOT print job
 *
 * @param {Array} bag - the current bag/cart items
 * @returns {Promise<Object>} the saved order, as returned by the API
 */
export const placeOrder = async (bag) => {
    if (!Array.isArray(bag) || bag.length === 0) {
        throw new Error("Bag is empty");
    }

    const userId = localStorage.getItem("userId");

    const rawTableNo = localStorage.getItem("tableNo");
    const tableNo =
        rawTableNo && rawTableNo.trim() !== ""
            ? Number(rawTableNo)
            : null;

    const mode = tableNo ? "dine in" : "take away";

    const { userName, mobileNo } = await resolveUser(userId);

    const nowISO = new Date().toISOString();
    const date = nowISO.split("T")[0]; // "2026-02-10"
    const time = new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });

    const { totalAmount, totalWithGST } = calculateTotals(bag);

    const newOrder = {
<<<<<<< HEAD
        id: "pending",  // Server assigns the real incremental ID
=======
        id: "placed",  // Server assigns the real incremental ID
>>>>>>> 656ff502cab1f2fdbb0bf4277e7fcba04fabeae8
        ...(userId ? { userId } : {}),
        userName,
        ...(mobileNo ? { mobile: mobileNo } : {}),
        ...(tableNo ? { tableNo: Number(tableNo) } : {}),
        mode,
        date,
        time,
        createdAt: nowISO,
        updatedAt: nowISO,
        status: "placed",
        totalAmount: Math.round(totalAmount),
        totalWithGST,

        items: bag.map(item => ({
            dishId: item.id,
            dishName: stripCustomizedPrefix(item.name),
            categoryId: item.categoryId,
            quantity: Number(item.quantity) || 1,
            unitPrice: Math.round(item.unitPrice || 0),
            totalPrice: Math.round(item.totalPrice || 0),
            status: "placed",
            isCustomized: !!item.isCustomized,
            ...(item.selectedSize ? { selectedSize: item.selectedSize } : {}),
            notes: item.notes || "",
            ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
            createdAt: nowISO,
            ...(item.pickupAt ? { pickupAt: item.pickupAt } : {})
        }))
    };

    /* SAVE ORDER — server generates the real ID and handles user embedding */
    const savedRes = await api.post("/orders", newOrder);
    const savedOrder = savedRes.data;

    /* UPDATE INGREDIENT STOCK */
    await updateIngredientStock(bag);

    /* SEND KOT (best effort) */
    sendKotToPrinter(savedOrder, totalWithGST);

    return savedOrder;
};