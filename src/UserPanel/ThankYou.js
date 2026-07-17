import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import "./ThankYou.css";
import { AnimatePresence, motion } from "framer-motion";
import Button3D from "./shared/Button3D";
import { groupBagItems, sizeNotesBagKey, stripCustomizedPrefix } from "./shared/bagUtils";

const AUTO_RESET_MS = 60000; // 1 minute

const ThankYou = ({ bag, setBag, setIsBagOpen }) => {
  const navigate = useNavigate();
  const rawTableNo = localStorage.getItem("tableNo");

  const tableNo =
    rawTableNo && rawTableNo.trim() !== ""
      ? rawTableNo
      : null;

  const mode = tableNo ? "dine in" : "take away";

  const isBagEmpty = bag.length === 0;

  useEffect(() => {
    confetti({
      particleCount: 200,
      spread: 80,
      startVelocity: 55
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBag([]);
      setIsBagOpen(false);
      localStorage.removeItem("userId");
      navigate("/");
    }, AUTO_RESET_MS);

    return () => clearTimeout(timer);
  }, [navigate, setBag, setIsBagOpen]);

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

  return (
    <div
      className={"thankyou-page"}
    >
      <div className="thankyou-card">
        <h1 className="thankyou-title">
          Thank You for Your Order!
        </h1>

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

        {!isBagEmpty && (
          <table className="order-table">
            <thead>
              <tr>
                <th></th>
                <th>Dish</th>
                <th>Qty</th>
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

                    <td>{item.quantity}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}

        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "16px" }}>
          <Button3D className="btn-3d green" onClick={handleOrderAnother}>
            Order Another
          </Button3D>

          <Button3D className="btn-3d red" onClick={handleLogout}>
            Back to Home
          </Button3D>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
