import { useNavigate } from "react-router-dom";
import { useState } from "react";
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

  const isBagEmpty = bag.length === 0;

  const totalAmount = bag.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );

  /*DELETE ITEM FROM BAG */
  const handleDeleteClick = (index) => {
    setDeleteIndex(index);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setBag((prev) => prev.filter((_, i) => i !== deleteIndex));
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
  const confirmPlaceOrder = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const orderId = await generateNextOrderId();

      const newOrder = {
        id: orderId,
        date: new Date().toISOString().split("T")[0],
        status: "placed",
        totalAmount: Math.round(totalAmount),
        items: bag.map(item => ({
          dishId: item.id,
          dishName: item.name,
          categoryId: item.categoryId,
          quantity: Number(item.quantity) || 1,
          totalPrice: Math.round(item.totalPrice)
        }))
      };

      /* 1️⃣ SAVE TO GLOBAL ORDERS */
      await api.post("/orders", newOrder);

      /* 2️⃣ SAVE TO USER ORDERS (IF LOGGED IN) */
      if (userId) {
        const userRes = await api.get(`/users/${userId}`);
        const user = userRes.data;

        const userOrders = Array.isArray(user.orders)
          ? user.orders
          : [];

        const updatedUser = {
          ...user,
          orders: [...userOrders, newOrder]
        };

        await api.put(`/users/${userId}`, updatedUser);
      }
      /* 2️⃣b CLEAR GUEST FAVOURITES (IF GUEST) */
      else {
        localStorage.removeItem("guestFavourites");
      }

      /* 3️⃣ UPDATE APP STATE */
      onOrderPlaced?.(newOrder);

      setOrderPlaced(true);
      setShowOrderConfirm(false);

      /* CONFETTI */
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

    } catch (err) {
      console.error("Failed to place order", err);
      alert("Failed to place order. Please try again.");
    }
  };

  /*THANKS ACTION*/
  const handleThanks = () => {
    // clear bag
    setBag([]);

    // logout ONLY if logged in
    const userId = localStorage.getItem("userId");
    if (userId) {
      localStorage.removeItem("userId");
    }

    // redirect to welcome
    navigate("/");
  };


  const getDisplayName = (item) => {
    if (item.isCustomized && !item.isFromFavourite) {
      return `Customized ${item.name}`;
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

  return (
    <div className="thankyou-page">
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

        {isBagEmpty && !orderPlaced && (
          <p className="empty-bag-msg">
            Your bag is empty. Please add a dish to continue.
          </p>
        )}

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
              {bag.map((item, index) => (
                <tr key={index}>
                  <td>
                    <img src={item.image} alt="" className="order-img" />
                  </td>
                  <td>{getDisplayName(item)}</td>
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
                      <button onClick={() => handleDeleteClick(index)}>
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!isBagEmpty && (
          <div className="order-total">
            Total: ₹{Math.round(totalAmount)}
          </div>
        )}

        <button
          className={`order-again-btn ${orderPlaced ? "thanks-btn" : ""}`}
          onClick={() =>
            orderPlaced ? handleThanks() : navigate("/categories")
          }
        >
          {orderPlaced
            ? "Thanks"
            : isBagEmpty
              ? "Add Dish"
              : "Order Another"}
        </button>

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
