import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import "./FavouriteCombo.css";
import { flyToBag } from "../components/flyToBag";
import Button3D from "./shared/Button3D";
import { useToast } from "../components/Usetoast";

const listVariants = {
  hidden: { opacity: 0, y: 60 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.16, 1, 0.3, 1], // smoother spring-like ease
      when: "beforeChildren",
      staggerChildren: 0.12,
      delayChildren: 0.08
    }
  }
};

const FavouriteCombo = ({
  currentUser,
  setCurrentUser,
  addToBag,
  handleBack
}) => {

  const { toast } = useToast();

  const favCombos = [...(currentUser?.combo || [])]
    .sort((a, b) =>
      new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

  const handleDelete = async (comboId) => {
    if (!currentUser) return;

    const updatedCombos = favCombos.filter(c => c.id !== comboId);

    try {
      await api.put(`/users/${currentUser.id}`, { ...currentUser, combo: updatedCombos });
      const refreshed = await api.get(`/users/${currentUser.id}`);
      setCurrentUser(refreshed.data);
    } catch (err) {
      console.error("Failed to delete favourite combo", err);
      toast.error("Failed to delete favourite combo");
    }
  };

  const handleAddToBag = (combo) => {
    const qty = qtyMap[combo.id] || 1;
    const perUnitFinalPrice =
      combo.perComboFinalPrice ??
      combo.totalPrice ??
      combo.originalPrice ??
      0;

    // ✅ Resolve image at CLICK TIME (bulletproof)
    const img = document.querySelector(
      `.fav-combo-image[data-combo-id="${combo.id}"]`
    );

    addToBag({
      id: combo.id,
      name: combo.title,
      categoryId: "combo",
      quantity: qty,
      perComboFinalPrice: perUnitFinalPrice,
      unitPrice: perUnitFinalPrice,
      originalPrice: perUnitFinalPrice * qty,
      totalPrice: perUnitFinalPrice * qty,
      appliedOffer: combo.appliedOffer,
      comboItems: combo.comboItems,
      isCombo: true,
      isFromFavourite: true
    });

    // ✅ Trigger animation
    flyToBag({
      imgEl: img,
      dishId: combo.id
    });
  };

  const [qtyMap, setQtyMap] = useState({});
  const increaseQty = (id) =>
    setQtyMap(prev => ({ ...prev, [id]: (prev[id] || 1) + 1 }));

  const decreaseQty = (id) =>
    setQtyMap(prev => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) - 1)
    }));

  return (
    <div
      className="fav-combo-page"
    >
      {/* CONTENT */}
      <motion.section
        className="fav-combo-content"
        variants={listVariants}
        initial="hidden"
        animate="show"
      >


        <AnimatePresence>
          {favCombos.length === 0 ? (
            <motion.div
              key="fav-combo-empty"
              className="fav-empty fav-empty-page"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <div className="fav-empty-icon">🍽️</div>
              <h3 className="fav-empty-title">No favourite combos yet</h3>
              <p className="fav-empty-sub">Create a combo and save it to see it here.</p>
            </motion.div>
          ) : (
            favCombos.map(combo => (
              <motion.article
                key={combo.id}
                className="fav-combo-card"

                /* SAME AS THANK YOU */
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -80 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}

                whileHover={{ y: -3, transition: { duration: 0.2 } }}
              >
                <div className="fav-combo-info">
                  <div className="fav-combo-title">
                    {combo.title}
                  </div>

                  <div className="fav-combo-meta">
                    <span className="fav-combo-price">
                      ₹{(combo.perComboFinalPrice || combo.totalPrice)}
                    </span>
                    {combo.appliedOffer && (
                      <span className="fav-combo-badge">
                        Offer Applied
                      </span>
                    )}
                  </div>
                </div>

                <div className="fav-combo-actions">
                  <div className="stepper-ctrl">
                    <button className="stepper-btn" onClick={() => decreaseQty(combo.id)}>-</button>
                    <span className="stepper-val">{qtyMap[combo.id] || 1}x</span>
                    <button className="stepper-btn" onClick={() => increaseQty(combo.id)}>+</button>
                  </div>

                  <div className="price-section">
                    <div className="price-section-label">Total price:</div>
                    <div className="price-section-price">
                      ₹{(qtyMap[combo.id] || 1) *
                        (combo.perComboFinalPrice ||
                          combo.totalPrice ||
                          combo.originalPrice)}
                    </div>
                  </div>

                  <Button3D
                    className="btn-3d red"
                    style={{ width: "fit-content" }}
                    frontStyle={{ padding: "0 10px" }}
                    onClick={() => handleDelete(combo.id)}
                  >
                    Delete
                  </Button3D>

                  <Button3D
                    className="btn-3d green"
                    frontStyle={{ padding: "0 10px" }}
                    style={{ width: "fit-content" }}
                    onClick={() => handleAddToBag(combo)}
                  >
                    Add to Bag
                  </Button3D>
                </div>
              </motion.article>
            ))
          )}
        </AnimatePresence>
      </motion.section>
    </div>
  );
};

export default FavouriteCombo;