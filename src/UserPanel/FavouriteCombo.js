import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import "./FavouriteCombo.css";
import { flyToBag } from "./flyToBag";

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

    const favCombos = [...(currentUser?.combo || [])]
        .sort((a, b) =>
            new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );

    const handleDelete = async (comboId) => {
        if (!currentUser) return;

        const updatedCombos = favCombos.filter(c => c.id !== comboId);
        const updatedUser = { ...currentUser, combo: updatedCombos };

        try {
            await api.put(`/users/${currentUser.id}`, updatedUser);
            // ✅ UPDATE UI STATE
            setCurrentUser(updatedUser);
        } catch (err) {
            console.error("Failed to delete favourite combo", err);
            alert("Failed to delete favourite combo");
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
                            className="fav-combo-empty"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                        >
                            <div className="empty-icon">🍽️</div>
                            <h3>No favourite combos yet</h3>
                            <p>Create a combo and save it to see it here.</p>
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
                                    <div className="fav-combo-quantity-section">
                                        <button onClick={() => decreaseQty(combo.id)}>-</button>
                                        <span>{qtyMap[combo.id] || 1}x</span>
                                        <button onClick={() => increaseQty(combo.id)}>+</button>
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

                                    <button
                                        className="btn-primary"
                                        onClick={() => handleAddToBag(combo)}
                                    >
                                        Add to Bag
                                    </button>

                                    <button
                                        className="btn-ghost danger"
                                        onClick={() => handleDelete(combo.id)}
                                    >
                                        Delete
                                    </button>
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
