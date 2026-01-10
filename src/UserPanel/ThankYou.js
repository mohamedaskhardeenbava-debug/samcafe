import { useNavigate } from "react-router-dom";
import { useState } from "react";
import confetti from "canvas-confetti";
import "./ThankYou.css";
import api from "../api";

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
  const confirmPlaceOrder = () => {
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
};


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
              <button className="confirm-yes" onClick={confirmPlaceOrder}>
                Yes, Place Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThankYou;
