// src/components/placeOrder.js
import api from "../api";

export const placeOrder = async (bag) => {
    if (!Array.isArray(bag) || bag.length === 0) {
        throw new Error("Bag is empty");
    }

    const rawUser = localStorage.getItem("user");
    console.log("RAW USER FROM STORAGE:", rawUser);

    const rawTableNo = localStorage.getItem("tableNo");

    const tableNo =
        rawTableNo && rawTableNo.trim() !== ""
            ? Number(rawTableNo)
            : null;

    const mode = tableNo ? "dine in" : "take away";

    const user = JSON.parse(rawUser);
    console.log("PARSED USER:", user);

    const userId = localStorage.getItem("userId");

    /* 🔹 ORDER ID */
    const res = await api.get("/orders");
    const orders = Array.isArray(res.data) ? res.data : [];
    const orderId = `order_${String(orders.length + 1).padStart(5, "0")}`;

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
        // ✅ UNFORMATTED / ISO
        date,
        time,                  // "2026-02-10"
        createdAt: nowISO,       // "2026-02-10T06:25:45.065Z"
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

    /* 🔹 SAVE ORDER */
    await api.post("/orders", newOrder);

    /* 🔹 UPDATE INGREDIENT STOCK */
    const menuRes = await api.get("/menu");
    const menu = menuRes.data;

    const updatedIngredients = menu.ingredients.map(ing => {
        let usedKg = 0;

        bag.forEach(item => {
            (item.ingredients || []).forEach(i => {
                if (i.name === ing.name) {
                    usedKg += ((i.quantity || 0) * (item.quantity || 1)) / 1000;
                }
            });
        });

        if (usedKg === 0) return ing;

        return {
            ...ing,
            stockRemaining: Math.max(0, ing.stockRemaining - usedKg)
        };
    });

    await api.put("/menu", { ...menu, ingredients: updatedIngredients });

    /* 🔹 SAVE TO USER */
    if (userId) {
        const userRes = await api.get(`/users/${userId}`);
        await api.put(`/users/${userId}`, {
            ...userRes.data,
            orders: [...(userRes.data.orders || []), newOrder]
        });
    }

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