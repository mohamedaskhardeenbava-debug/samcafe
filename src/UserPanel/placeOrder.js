// src/components/placeOrder.js
import api from "../api";

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

    /* 🔹 ORDER ID */
    let orderId;
    const allOrdersRes = await api.get("/orders");
    const allOrders = allOrdersRes.data;

    if (!allOrders || allOrders.length === 0) {
        orderId = "order_00001";
    } else {
        const lastOrder = allOrders[allOrders.length - 1];
        const lastNum = parseInt(lastOrder.id?.replace("order_", "")) || 0;
        orderId = `order_${String(lastNum + 1).padStart(5, "0")}`;
    }
    /* 🔹 USER */
    /* 🔹 USER */
    let userName = "Guest";
    let mobileNo = null;

    if (userId) {
        const userRes = await api.get(`/users/${userId}`);
        userName = userRes.data?.name || "Guest";
        mobileNo = userRes.data?.mobile || null;
    }

    const nowISO = new Date().toISOString();

    // optional: if you still want a separate date field
    const date = nowISO.split("T")[0]; // "2026-02-10"

    const time = new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });

    const totalAmount = bag.reduce(
        (sum, item) => sum + Number(item.totalPrice || 0),
        0
    );

    const CGST_RATE = 0.025;
    const SGST_RATE = 0.025;

    const cgst = Number((totalAmount * CGST_RATE).toFixed(2));
    const sgst = Number((totalAmount * SGST_RATE).toFixed(2));

    const totalWithGST = {
        subTotal: Math.round(totalAmount),
        cgst,
        sgst,
        total: Math.round(totalAmount + cgst + sgst)
    };

    const normalizeName = (name) =>
        name?.startsWith("Customized Make Your Own")
            ? name.replace("Customized ", "")
            : name;

    const newOrder = {
        id: orderId,
        userId: userId || null,
        userName,
        mobile: mobileNo,
        tableNo: tableNo ? Number(tableNo) : null,
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
            dishName: normalizeName(item.name),
            categoryId: item.categoryId,
            quantity: Number(item.quantity) || 1,
            unitPrice: Math.round(item.unitPrice || 0),
            totalPrice: Math.round(item.totalPrice || 0),
            status: "placed",
            isCustomized: !!item.isCustomized,
            selectedSize: item.selectedSize || null,
            notes: item.notes || "",
            ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
            createdAt: nowISO,
            pickupAt: item.pickupAt || null
        }))
    };

    /* 🔹 SAVE ORDER TO GLOBAL ORDERS */
    await api.post("/orders", newOrder);

    /* 🔹 SAVE ORDER INSIDE USER */
    if (userId) {
        const userRes = await api.get(`/users/${userId}`);

        const updatedUser = {
            ...userRes.data,
            orders: [...(userRes.data.orders || []), newOrder]
        };

        await api.put(`/users/${userId}`, updatedUser);
    }

    /* 🔹 UPDATE INGREDIENT STOCK */
    /* 🔹 UPDATE INGREDIENT STOCK */
    const ingredientsRes = await api.get("/ingredients");
    const allIngredients = ingredientsRes.data;

    const stockUpdatePromises = [];
    allIngredients.forEach(ing => {
        let usedKg = 0;
        bag.forEach(item => {
            (item.ingredients || []).forEach(i => {
                if (i.name === ing.name) {
                    usedKg += ((i.quantity || 0) * (item.quantity || 1)) / 1000;
                }
            });
        });
        if (usedKg > 0) {
            const updated = {
                ...ing,
                stockRemaining: Math.max(0, ing.stockRemaining - usedKg)
            };
            stockUpdatePromises.push(api.put(`/ingredients/${ing.id}`, updated));
        }
    });
    await Promise.all(stockUpdatePromises);

    const formatForPrinter = (iso) => {
        if (!iso) return "";
        const d = new Date(iso);
        return d.toLocaleDateString("en-GB"); // DD/MM/YYYY
    };

    const printerOrder = {
        ...newOrder,

        // printer-friendly date
        date: formatForPrinter(newOrder.date),

        // printer needs GST breakup
        gst: {
            cgst: totalWithGST.cgst,
            sgst: totalWithGST.sgst,
            total: totalWithGST.total
        }
    };

    /* 🔹 SEND KOT (best effort) */
    fetch("http://localhost:9001/print/kot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: printerOrder })
    }).catch(() => { });

    return newOrder;
};