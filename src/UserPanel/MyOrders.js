import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./FoodCategory.css";
import "./MyOrders.css";
import PageHeader from "./shared/PageHeader";
import { fmtDate as fmtDateNumeric } from "../utils/dateUtils";

/** Format "YYYY-MM-DD" -> "Mon, 31-07-2026" */
function fmtDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const weekday = d.toLocaleDateString("en-IN", { weekday: "short" });
  return `${weekday}, ${fmtDateNumeric(dateStr)}`;
}

const STATUS_LABELS = {
  pending: "Pending",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_ICONS = {
  pending: "⏳",
  preparing: "👨‍🍳",
  ready: "🔔",
  completed: "✅",
  cancelled: "✕",
};

/** Total dish count for an order, respecting each item's quantity. */
function dishCount(order) {
  return (order.items || []).reduce((sum, item) => sum + (item.quantity ?? item.qty ?? 1), 0);
}

const MyOrders = ({ currentUser, handleBack, handleHome }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
        title={
          <span className="my-orders-title-row">
            My Orders
            {!loading && !error && orders.length > 0 && (
              <span className="my-orders-count-badge">{orders.length}</span>
            )}
          </span>
        }
        wrapperClassName="food-header"
        titleClassName="food-list-title"
        onBack={handleBack}
        onHome={handleHome}
      />

      <div className="food-category" style={{ padding: "0px" }}>
        {loading && (
          <div className="my-orders-state">
            <div className="my-orders-state-icon my-orders-state-icon--loading">🧾</div>
            <h3 className="my-orders-state-title">Loading your orders…</h3>
          </div>
        )}

        {!loading && error && (
          <div className="my-orders-state">
            <div className="my-orders-state-icon my-orders-state-icon--error">⚠️</div>
            <h3 className="my-orders-state-title">Couldn't load your orders</h3>
            <p className="my-orders-state-sub">Please try again in a moment.</p>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="my-orders-state">
            <div className="my-orders-state-icon my-orders-state-icon--empty">🧾</div>
            <h3 className="my-orders-state-title">No orders yet</h3>
            <p className="my-orders-state-sub">Orders you place will show up here.</p>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="my-orders-list-scroll">
            <div className="my-orders-list">
              {orders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  className={`my-order-card my-order-status--${order.status || "pending"}`}
                  onClick={() => navigate(`/my-orders/${order.id}`)}
                >
                  <span className="my-order-card-accent" />

                  <div className="my-order-card-top">
                    <div className="my-order-meta">
                      <span className="my-order-id">#{order.id}</span>
                      <span className="my-order-date">{fmtDate(order.date || order.createdAt)}</span>
                    </div>
                    <span className={`my-order-status my-order-status--${order.status || "pending"}`}>
                      <span className="my-order-status-icon">{STATUS_ICONS[order.status] || STATUS_ICONS.pending}</span>
                      {STATUS_LABELS[order.status] || order.status || "Pending"}
                    </span>
                  </div>

                  <div className="my-order-items">
                    <span className="my-order-dish-count">
                      🍽️ {dishCount(order)} {dishCount(order) === 1 ? "dish" : "dishes"}
                    </span>
                  </div>

                  <div className="my-order-card-bottom">
                    <span>Total</span>
                    <span className="my-order-total">₹{order.totalAmount ?? 0}</span>
                    <span className="my-order-card-arrow" aria-hidden="true">→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
