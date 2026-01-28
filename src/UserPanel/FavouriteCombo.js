import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import "./FavouriteCombo.css";

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

const itemVariants = {
    hidden: { opacity: 0, y: 35 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.45,
            ease: [0.16, 1, 0.3, 1]
        }
    },
    exit: {
        opacity: 0,
        x: -60,
        transition: { duration: 0.35, ease: "easeInOut" }
    }
};

const FavouriteCombo = ({
    currentUser,
    setCurrentUser,
    addToBag,
    handleBack
}) => {
    const navigate = useNavigate();

    const favCombos = currentUser?.combo || [];

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
        addToBag({
            id: combo.id,
            name: combo.title,
            categoryId: "combo",
            quantity: 1,
            originalPrice: combo.originalPrice,
            totalPrice: combo.totalPrice,
            appliedOffer: combo.appliedOffer,
            comboItems: combo.comboItems,
            isCombo: true,
            isFromFavourite: true
        });

        navigate("/thank-you");
    };

    return (
        <div
            className="fav-combo-page"
        >
            {/* HEADER */}
            <header className="fav-combo-header">
                <button className="back-button" onClick={handleBack} />
                <div className="fav-combo-header-text">
                    <h1>My Favourite Combo</h1>
                </div>
            </header>

            {/* CONTENT */}
            <motion.section
                className="fav-combo-content"
                variants={listVariants}
                initial="hidden"
                animate="show"
            >


                <AnimatePresence mode="wait">
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
                                            ₹{combo.totalPrice}
                                        </span>

                                        {combo.appliedOffer && (
                                            <span className="fav-combo-badge">
                                                Offer Applied
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="fav-combo-actions">
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
