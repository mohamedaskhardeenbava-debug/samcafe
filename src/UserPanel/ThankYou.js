import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import "./ThankYou.css";
import { AnimatePresence, motion } from "framer-motion";
import Button3D from "./shared/Button3D";
import { groupBagItems, sizeNotesBagKey, stripCustomizedPrefix } from "./shared/bagUtils";

const AUTO_RESET_MS = 60000; // 1 minute

const ThankYou = ({ bag, setBag, onOrderPlaced, setIsBagOpen }) => {
  const navigate = useNavigate();
  const rawTableNo = localStorage.getItem("tableNo");

  const tableNo =
    rawTableNo && rawTableNo.trim() !== ""
      ? rawTableNo
      : null;

  const mode = tableNo ? "dine in" : "take away";

  const orderPlaced = true;

  const isBagEmpty = bag.length === 0;

  useEffect(() => {
    confetti({
      particleCount: 200,
      spread: 80,
      startVelocity: 55
    });
  }, []);

  useEffect(() => {
    if (!orderPlaced) return;

    const timer = setTimeout(() => {
      // 🔥 FULL CLEANUP
      setBag([]);
      setIsBagOpen(false);
      localStorage.removeItem("userId");
      navigate("/");
    }, AUTO_RESET_MS);

    return () => clearTimeout(timer);
  }, [orderPlaced, navigate, setBag, setIsBagOpen]);

  const totalAmount = bag.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );

  const getDisplayName = (item) =>
    item?.isCustomized ? stripCustomizedPrefix(item.name) : (item?.name || "");

  const groupedBag = groupBagItems(bag, sizeNotesBagKey);

  const handleOrderAnother = () => {
    navigate("/categories");
    setBag([]);
  };

  const handleLogout = () => {
    setBag([]);
    localStorage.removeItem("userId");
    navigate("/");
  };

  const handleEdit = (item) => {
    setIsBagOpen(false);

    if (item.isCombo) {
      navigate("/combo", {
        state: {
          fromBag: true,
          bagIndex: item.indices[0],
          comboItems: item.comboItems,
          originalPrice: item.originalPrice,
          totalPrice: item.totalPrice,
          appliedOffer: item.appliedOffer,
          quantity: item.quantity
        }
      });
    } else {
      navigate(`/food/${item.id}`, {
        state: {
          fromBag: true,
          bagIndex: item.indices[0],
          bagItem: {
            ...item,
            ingredients: Array.isArray(item.ingredients) ? item.ingredients : []
          },
          categoryId: item.categoryId,
          dishId: item.id
        }
      });
    }
  };

  return (
    <div
      className={"thankyou-page"}
    >
      <div className="thankyou-card">
        <h1 className="thankyou-title">
          {orderPlaced ? "Thank You for Your Order!" : "Your Bag"}
        </h1>

        {orderPlaced && (
          <h5 className="thankyou-message">
            Your order has been successfully placed and will be ready for <br />
            <span className="table-number">
              {mode === "dine in" ? "DINE IN" : "TAKE AWAY"}
            </span>

            {tableNo && (
              <>
                {" "}and delivered to{" "}
                <span className="table-number">
                  TABLE NUMBER #{tableNo}
                </span>
              </>
            )}

            <br />
            within <span className="time">15–20 minutes</span>.
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

              <Button3D className="btn-3d red" onClick={() => navigate("/categories")}>
                Add Dish
              </Button3D>
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
                        <button onClick={() => handleEdit(item)}>
                          Edit
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

        {orderPlaced && (
          <div style={{display:"flex", gap:"10px", alignItems:"center", marginTop:"16px"}}>
            <Button3D className="btn-3d green" onClick={handleOrderAnother} frontStyle={{padding:"0 10px"}}>
              Order Another
            </Button3D>

            <Button3D className="btn-3d red" onClick={handleLogout} frontStyle={{ padding: "0 10px" }}>
              Back to Home
            </Button3D>
          </div>
        )}

        {!isBagEmpty && !orderPlaced && (
          <Button3D className="ty-order-btn" onClick={() => navigate("/categories")} frontStyle={{ padding: "0 10px" }}>
            Order Another
          </Button3D>
        )}
      </div>
    </div>
  );
};

export default ThankYou;
