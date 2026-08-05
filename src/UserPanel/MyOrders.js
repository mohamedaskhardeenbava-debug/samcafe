import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import api from "../api";
import "./FoodCategory.css";
import "./MyOrders.css";
import PageHeader from "./shared/PageHeader";
import CloseButton from "./shared/CloseButton";

/** Format "YYYY-MM-DD" → "Mon, DD Mmm YYYY" */
function fmtDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

const STATUS_LABELS = {
  pending: "Pending",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
};

const overlayVariant = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariant = {
  hidden: { y: 60, opacity: 0, scale: 0.96 },
  show: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit: { y: 40, opacity: 0, scale: 0.96, transition: { duration: 0.2 } },
};

/** Total dish count for an order, respecting each item's quantity. */
function dishCount(order) {
  return (order.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
}

const OrderDetailsModal = ({ order, onClose }) => {
  if (!order) return null;
  const items = order.items || [];

  return (
    <motion.div
      className="my-order-overlay"
      variants={overlayVariant}
      initial="hidden"
      animate="show"
      exit="exit"
      onClick={onClose}
    >
      <motion.div
        className="my-order-modal"
        variants={modalVariant}
        initial="hidden"
        animate="show"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="my-order-modal-header">
          <div className="my-order-meta">
            <span className="my-order-id">#{order.id}</span>
            <span className="my-order-date">{fmtDate(order.date || order.createdAt)}</span>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        <div className="my-order-modal-body">
          <span className={`my-order-status my-order-status--${order.status || "pending"}`}>
            {STATUS_LABELS[order.status] || order.status || "Pending"}
          </span>

          <div className="my-order-modal-list">
            {items.map((item, i) => (
              <div key={i} className="my-order-item">
                <span className="my-order-item-name">
                  {item.dishName || item.name}
                  {item.quantity > 1 && <span className="my-order-item-qty"> × {item.quantity}</span>}
                </span>
                <span className="my-order-item-price">₹{item.totalPrice ?? item.unitPrice ?? 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="my-order-card-bottom my-order-modal-footer">
          <span>Total</span>
          <span className="my-order-total">₹{order.totalAmount ?? 0}</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

const MyOrders = ({ currentUser, handleBack, handleHome }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (!currentUser || currentUser.id === "guest") {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    api
      .get("/orders/mine")
      .then((res) => {
        if (cancelled) return;
        const sorted = [...(res.data || [])].sort((a, b) => {
          const at = new Date(a.createdAt || a.date || 0).getTime();
          const bt = new Date(b.createdAt || b.date || 0).getTime();
          return bt - at;
        });
        setOrders(sorted);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [currentUser]);

  // BLOCK GUEST ACCESS
  if (!currentUser || currentUser.id === "guest") {
    return null;
  }

  return (
    <div className="food-list my-orders-page">
      <PageHeader
        title="My Orders"
        wrapperClassName="food-header"
        titleClassName="food-list-title"
        onBack={handleBack}
        onHome={handleHome}
      />

      <div className="food-category" style={{ padding: "0px" }}>
        {loading && (
          <div className="fav-empty fav-empty-page">
            <h3 className="fav-empty-title">Loading your orders…</h3>
          </div>
        )}

        {!loading && error && (
          <div className="fav-empty fav-empty-page">
            <div className="fav-empty-icon">⚠️</div>
            <h3 className="fav-empty-title">Couldn't load your orders</h3>
            <p className="fav-empty-sub">Please try again in a moment.</p>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="fav-empty fav-empty-page">
            <div className="fav-empty-icon">🧾</div>
            <h3 className="fav-empty-title">No orders yet</h3>
            <p className="fav-empty-sub">Orders you place will show up here.</p>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="my-orders-list-scroll">
            <div className="my-orders-list">
              {orders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  className="my-order-card"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="my-order-card-top">
                    <div className="my-order-meta">
                      <span className="my-order-id">#{order.id}</span>
                      <span className="my-order-date">{fmtDate(order.date || order.createdAt)}</span>
                    </div>
                    <span className={`my-order-status my-order-status--${order.status || "pending"}`}>
                      {STATUS_LABELS[order.status] || order.status || "Pending"}
                    </span>
                  </div>

                  <div className="my-order-items">
                    <span className="my-order-dish-count">
                      {dishCount(order)} {dishCount(order) === 1 ? "dish" : "dishes"}
                    </span>
                  </div>

                  <div className="my-order-card-bottom">
                    <span>Total</span>
                    <span className="my-order-total">₹{order.totalAmount ?? 0}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyOrders;
