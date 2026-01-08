import { useNavigate } from "react-router-dom";
import { useState } from "react";
import confetti from "canvas-confetti";
import "./ThankYou.css";
import api from "../api";

const ThankYou = ({ bag, setBag, onOrderPlaced, placeOrder }) => {
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

  /* =========================
     DELETE ITEM FROM BAG
  ========================= */
  const handleDeleteClick = (index) => {
    setDeleteIndex(index);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setBag((prev) => prev.filter((_, i) => i !== deleteIndex));
    setShowDeleteConfirm(false);
    setDeleteIndex(null);
  };

  /* =========================
     PLACE ORDER (CORE LOGIC)
  ========================= */
  //   const confirmPlaceOrder = async () => {
  //     try {
  //       const res = await api.get("/menu");
  //       const existingOrders = res.data.orders || [];

  //       // Generate next order id safely
  //       const lastOrderNumber = existingOrders.length
  //         ? Math.max(
  //           ...existingOrders.map((o) =>
  //             Number(String(o.id).replace("order_", "")) || 0
  //           )
  //         )
  //         : 1000;

  //       const nextOrderId = `order_${lastOrderNumber + 1}`;

  //       const newOrder = {
  //         id: nextOrderId,
  //         date: new Date().toISOString().split("T")[0],
  //         status: "placed",
  //         tableNumber: 7,
  //         paymentMode: "cash",
  //         totalAmount: Math.round(totalAmount),

  //         items: bag.map((item) => ({
  //           dishId: item.id,
  //           dishName: item.name, // ✅ custom or original
  //           categoryId: item.categoryId,
  //           quantity: Number(item.quantity) || 1,
  //           totalPrice: Math.round(item.totalPrice)
  //         }))
  //       };

  //       const updatedMenu = {
  //         ...res.data,
  //         orders: [...existingOrders, newOrder]
  //       };

  //       await api.put("/menu", updatedMenu);

  //       onOrderPlaced?.(newOrder);
  //       setOrderPlaced(true);
  //       setShowOrderConfirm(false);

  //       // Bottom-left cannon (shoots diagonally up-right)
  // confetti({
  //   particleCount: 150,
  //   spread: 70,
  //   startVelocity: 45,
  //   angle: 60,                 // ↗ direction
  //   origin: { x: 0.05, y: 0.85 }
  // });

  // // Bottom-right cannon (shoots diagonally up-left)
  // confetti({
  //   particleCount: 150,
  //   spread: 70,
  //   startVelocity: 45,
  //   angle: 120,                // ↖ direction
  //   origin: { x: 0.95, y: 0.85 }
  // });


  //     } catch (err) {
  //       console.error("Failed to place order", err);
  //       alert("Failed to place order. Please try again.");
  //     }
  //   };

  /* =========================
     THANKS ACTION
  ========================= */
  const handleThanks = () => {
    setBag([]);
    navigate("/");
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
                  <td>{item.name}</td>
                  <td>₹{Math.round(item.totalPrice)}</td>
                  <td>{item.quantity}</td>

                  {!orderPlaced && (
                    <td>
                      <button
                        onClick={() =>
                          navigate(`/food/${item.id}`, {
                            state: {
                              fromBag: true,
                              bagIndex: index,
                              bagItem: item,
                              categoryId: item.categoryId,
                              dishId: item.id
                            }
                          })
                        }
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
      {showDeleteConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <h3>Remove Item</h3>
            <p>Are you sure you want to remove this item?</p>
            <div className="confirm-actions">
              <button
                className="confirm-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button className="confirm-remove" onClick={confirmDelete}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLACE ORDER CONFIRM */}
      {showOrderConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <h3>Confirm Order</h3>
            <p>Are you sure you want to place this order?</p>
            <div className="confirm-actions">
              <button
                className="confirm-cancel"
                onClick={() => setShowOrderConfirm(false)}
              >
                Cancel
              </button>
              {/* <button className="confirm-yes" onClick={confirmPlaceOrder}>
                Yes, Place Order
              </button> */}

{/* temp */}
              <button
  className="confirm-yes"
  onClick={() => {
    if (!bag || bag.length === 0) return;

    setOrderPlaced(true);
    setShowOrderConfirm(false)

    // 🎉 optional confetti
    confetti({
      particleCount: 120,
      spread: 60,
      angle: 60,
      origin: { x: 0.05, y: 0.85 }
    });

    confetti({
      particleCount: 120,
      spread: 60,
      angle: 120,
      origin: { x: 0.95, y: 0.85 }
    });
  }}
>
  Place Order
</button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThankYou;
