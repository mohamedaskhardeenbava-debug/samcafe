import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import "./ThankYou.css";
import api from "../api";
import { AnimatePresence, motion } from "framer-motion";

const ThankYou = ({ bag, setBag, onOrderPlaced }) => {
  const navigate = useNavigate();

  const [showOrderConfirm, setShowOrderConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [flashBg, setFlashBg] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [animateExit, setAnimateExit] = useState(false);

  const isBagEmpty = bag.length === 0;

  const totalAmount = bag.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );

  const normalizeMakeYourOwnName = (name) => {
    if (!name) return name;

    return name.startsWith("Customized Make Your Own")
      ? name.replace("Customized ", "")
      : name;
  };

  /*DELETE ITEM FROM BAG */
  const handleDeleteClick = (groupKey) => {
    setDeleteIndex(groupKey);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setBag(prev =>
      prev.filter(item => {
        const key = [
          item.id,
          item.selectedSize || "",
          item.notes || "",
          item.isCustomized ? "custom" : "normal"
        ].join("__");

        return key !== deleteIndex;
      })
    );

    setShowDeleteConfirm(false);
    setDeleteIndex(null);
  };

  const generateNextOrderId = async () => {
    const res = await api.get("/orders");
    const orders = Array.isArray(res.data) ? res.data : [];

    if (orders.length === 0) {
      return "order_00001";
    }

    let maxNumber = 0;
    let maxWidth = 0;

    orders.forEach(order => {
      if (typeof order.id !== "string") return;

      const match = order.id.match(/order_(\d+)$/);
      if (!match) return;

      const numericPart = match[1];
      const number = parseInt(numericPart, 10);

      if (!isNaN(number)) {
        maxNumber = Math.max(maxNumber, number);
        maxWidth = Math.max(maxWidth, numericPart.length);
      }
    });

    const nextNumber = maxNumber + 1;

    return `order_${String(nextNumber).padStart(maxWidth, "0")}`;
  };

  /* PLACE ORDER (CORE LOGIC)*/
  const updateMenuIngredientStock = async (bag) => {
    const menuRes = await api.get("/menu");
    const menu = menuRes.data;

    const updatedIngredients = menu.ingredients.map(ingredient => {
      let usedKg = 0;

      bag.forEach(item => {
        (item.ingredients || []).forEach(i => {
          if (i.name === ingredient.name) {
            const gramsPerItem = Number(i.quantity || 0);
            const itemQty = Number(item.quantity || 1);
            usedKg += (gramsPerItem * itemQty) / 1000;
          }
        });
      });

      if (usedKg === 0) return ingredient;

      return {
        ...ingredient,
        stockRemaining: Math.max(
          0,
          Number(ingredient.stockRemaining || 0) - usedKg
        ),
        lastUpdated: new Date().toISOString().split("T")[0]
      };
    });

    await api.put("/menu", {
      ...menu,
      ingredients: updatedIngredients
    });
  };

  const sendKOTToPrinter = async (order) => {
    try {
      await fetch("http://localhost:9100/print/kot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order })
      });
    } catch (err) {
      console.error("KOT print failed", err);
    }
  };

  const confirmPlaceOrder = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const orderId = await generateNextOrderId();

      let userName = "Guest";
      const now = new Date();
      const createdAt = now.toISOString();
      const orderDate = now.toISOString().split("T")[0]; // YYYY-MM-DD
      const orderTime = now.toTimeString().slice(0, 5);  // HH:mm

      if (userId) {
        const userRes = await api.get(`/users/${userId}`);
        userName = userRes.data.name;   // ✅ logged-in user name
      }

      const newOrder = {
        id: orderId,
        userId: userId || null,
        userName,
        date: orderDate,
        time: orderTime,
        createdAt,
        updatedAt: createdAt,
        status: "placed",
        totalAmount: Math.round(totalAmount),

        items: bag.map(item => ({
          dishId: item.id,
          dishName: normalizeMakeYourOwnName(item.name),
          categoryId: item.categoryId,
          quantity: Number(item.quantity) || 1,
          unitPrice: Math.round(item.unitPrice || 0),
          totalPrice: Math.round(item.totalPrice),

          // CUSTOMIZATION INFO
          isCustomized: item.isCustomized === true,
          selectedSize: item.selectedSize || null,
          spiciness: item.spiciness || "mild",
          notes: item.notes || "",
          createdAt,


          // INGREDIENT SNAPSHOT (ONLY IF CUSTOMIZED)
          ingredients:
            Array.isArray(item.ingredients) && item.ingredients.length > 0
              ? item.ingredients.map(ing => ({
                name: ing.name,
                quantity: Number(ing.quantity),
                pricePer100g: Number(ing.pricePer100g || 0),
                totalPrice: Number(ing.totalPrice || 0)
              }))
              : []
        }))
      };

      /* 1️⃣ SAVE TO GLOBAL ORDERS */
      await api.post("/orders", newOrder);

      sendKOTToPrinter(newOrder);

      /* UPDATE INGREDIENT STOCK IN MENU ONLY */
      await updateMenuIngredientStock(bag);

      onOrderPlaced?.(newOrder);

      /* 2️⃣ SAVE TO USER ORDERS */
      if (userId) {
        const userRes = await api.get(`/users/${userId}`);
        const user = userRes.data;

        const updatedUser = {
          ...user,
          orders: [...(user.orders || []), newOrder]
        };

        await api.put(`/users/${userId}`, updatedUser);
      } else {
        localStorage.removeItem("guestFavourites");
      }

      onOrderPlaced?.(newOrder);
      setOrderPlaced(true);
      setShowOrderConfirm(false);

      confetti({
        particleCount: 150,
        spread: 55,
        startVelocity: 45,
        angle: 60,
        origin: { x: 0.05, y: 0.85 }
      });

      confetti({
        particleCount: 150,
        spread: 55,
        startVelocity: 45,
        angle: 120,
        origin: { x: 0.95, y: 0.85 }
      });

      // flash background red, then return to bg-main
      setFlashBg(true);
      setTimeout(() => {
        setFlashBg(false);
      }, 900); // small delay ensures transition back runs

      setTimeout(() => {
        setPulse(false);
      }, 2000);

    } catch (err) {
      console.error("Failed to place order", err);
      alert("Failed to place order. Please try again.");
    }
  };

  const handleThanks = () => {
    setBag([]);

    const userId = localStorage.getItem("userId");
    if (userId) {
      localStorage.removeItem("userId");
    }
    navigate("/");
  };

  const getDisplayName = (item) => {
    if (!item?.name) return "";

    // remove prefix ONLY for Make Your Own
    if (
      item.isCustomized &&
      item.name.startsWith("Customized Make Your Own")
    ) {
      return item.name.replace("Customized ", "");
    }

    return item.name;
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 }
  };

  const groupedBag = Object.values(
    bag.reduce((acc, item) => {
      const groupKey = [
        item.id,
        item.selectedSize || "",
        item.notes || "",
        item.isCustomized ? "custom" : "normal"
      ].join("__");

      if (!acc[groupKey]) {
        acc[groupKey] = { ...item, groupKey };
      } else {
        acc[groupKey].quantity += item.quantity;
        acc[groupKey].totalPrice += item.totalPrice;
      }

      return acc;
    }, {})
  );

  return (
    <div
      className={`thankyou-page ${flashBg ? "flash" : ""
        } ${pulse ? "pulse" : ""}`}
    >
      <div className="thankyou-card">
        <h1 className="thankyou-title">
          {orderPlaced ? "Thank You for Your Order!" : "Your Bag"}
        </h1>

        {orderPlaced && (
          <h5 className="thankyou-message">
            Your order has been successfully placed and will be delivered to{" "}
            <span className="table-number">TABLE #07</span> within{" "}
            <span className="time">15–20 minutes</span>.
          </h5>
        )}

        <AnimatePresence mode="wait">
          {isBagEmpty && !orderPlaced && (
            <motion.div
              key="empty-bag"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <p className="empty-bag-msg">
                Your bag is empty. Please add a dish to continue.
              </p>

              <button
                className="order-again-btn"
                onClick={() => navigate("/categories")}
              >
                Add Dish
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!isBagEmpty && (
          <table className="order-table">
            <thead>
              <tr>
                <th></th>
                <th>Dish</th>
                <th>Price</th>
                <th>Qty</th>
                {!orderPlaced && <th>Edit</th>}
                {!orderPlaced && <th>Delete</th>}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {groupedBag.map((item, index) => (
                  <motion.tr
                    key={item.id || index}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -80 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    <td>
                      <img
                        src={item.image}
                        alt=""
                        className="order-img"
                        loading="lazy"
                        decoding="async"
                      />
                    </td>

                    <td>
                      <div className="thanks-dish-name">
                        {getDisplayName(item)}
                      </div>

                      {item.notes && (
                        <div className="dish-notes">
                          {item.notes.length > 100
                            ? item.notes.slice(0, 30) + "…"
                            : item.notes}
                        </div>
                      )}
                    </td>

                    <td>₹{Math.round(item.totalPrice)}</td>

                    <td>{item.quantity}</td>

                    {!orderPlaced && (
                      <td>
                        <button
                          onClick={() => {
                            if (item.isCombo) {
                              navigate("/combo", {
                                state: {
                                  fromBag: true,
                                  bagIndex: index,
                                  comboItems: item.comboItems
                                }
                              });
                            } else {
                              navigate(`/food/${item.id}`, {
                                state: {
                                  fromBag: true,
                                  bagIndex: index,
                                  bagItem: item,
                                  categoryId: item.categoryId,
                                  dishId: item.id
                                }
                              });
                            }
                          }}
                        >
                          Edit
                        </button>
                      </td>
                    )}

                    {!orderPlaced && (
                      <td>
                        <button onClick={() => handleDeleteClick(item.groupKey)}>
                          Delete
                        </button>
                      </td>
                    )}
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}

        {!isBagEmpty && (
          <div className="order-total">
            Total: ₹{Math.round(totalAmount)}
          </div>
        )}

        {!isBagEmpty && (
          <button
            className={`order-again-btn ${orderPlaced ? "thanks-btn" : ""}`}
            onClick={() =>
              orderPlaced ? handleThanks() : navigate("/categories")
            }
          >
            {orderPlaced ? "Thanks" : "Order Another"}
          </button>
        )}

        {!isBagEmpty && !orderPlaced && (
          <button
            className="done-btn"
            onClick={() => setShowOrderConfirm(true)}
          >
            Place Order
          </button>
        )}
      </div>

      {/* DELETE CONFIRM */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            className="confirm-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="confirm-box"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <h3>Remove Item</h3>
              <p>Are you sure you want to remove this item?</p>

              <div className="confirm-actions">
                <button
                  className="confirm-cancel"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="confirm-remove"
                  onClick={confirmDelete}
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PLACE ORDER CONFIRM */}
      <AnimatePresence>
        {showOrderConfirm && (
          <motion.div
            className="confirm-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="confirm-box"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <h3>Confirm Order</h3>
              <p>Are you sure you want to place this order?</p>

              <div className="confirm-actions">
                <button
                  className="confirm-cancel"
                  onClick={() => setShowOrderConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="confirm-yes"
                  onClick={confirmPlaceOrder}
                >
                  Yes, Place Order
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThankYou;
