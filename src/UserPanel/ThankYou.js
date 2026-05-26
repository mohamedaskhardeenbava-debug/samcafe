import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import "./ThankYou.css";
import { AnimatePresence, motion } from "framer-motion";

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
    }, 60000); // 1 minute

    return () => clearTimeout(timer);
  }, [orderPlaced, navigate, setBag, setIsBagOpen]);

  const totalAmount = bag.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );

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

  const groupedBag = Object.values(
    bag.reduce((acc, item, index) => {   // ✅ index declared here
      const groupKey = [
        item.id,
        item.selectedSize || "",
        item.notes || "",
        item.isCustomized ? "custom" : "normal"
      ].join("__");

      if (!acc[groupKey]) {
        acc[groupKey] = {
          ...item,
          groupKey,
          indices: [index]   // ✅ now valid
        };
      } else {
        acc[groupKey].quantity += item.quantity;
        acc[groupKey].totalPrice += item.totalPrice;
        acc[groupKey].indices.push(index); // ✅ ALSO IMPORTANT
      }

      return acc;
    }, {})
  );

  const handleOrderAnother = () => {
    navigate("/categories");
    setBag([])
  };

  const handleLogout = () => {
    setBag([]);
    localStorage.removeItem("userId");
    navigate("/");
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

              <button
                className="ty-add-dish-btn"
                onClick={() => navigate("/categories")}
              >
                <span className="shadow"></span>
                <span className="edge"></span>
                <span className="front">Add Dish</span>
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
                            setIsBagOpen(false);

                            if (item.isCombo) {
                              navigate("/combo", {
                                state: {
                                  fromBag: true,
                                  bagIndex: item.indices[0],   // ✅ FIXED
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
                                  bagIndex: item.indices[0],   // ✅ FIXED
                                  bagItem: {
                                    ...item,
                                    ingredients: Array.isArray(item.ingredients)
                                      ? item.ingredients
                                      : []
                                  },
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
          <>
            <button className="ty-order-btn" onClick={handleOrderAnother}>
              <span className="shadow"></span>
              <span className="edge"></span>
              <span className="front">Order Another</span>
            </button>

            <button className="ty-done-btn" onClick={handleLogout}>
              <span className="shadow"></span>
              <span className="edge"></span>
              <span className="front">Back to Home</span>
            </button>
          </>
        )}

        {!isBagEmpty && !orderPlaced && (
          <>
            <button
              className="ty-order-btn"
              onClick={() => navigate("/categories")}
            >
              <span className="shadow"></span>
              <span className="edge"></span>
              <span className="front">Order Another</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ThankYou;