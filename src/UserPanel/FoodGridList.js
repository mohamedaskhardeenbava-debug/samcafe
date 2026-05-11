import React, { useState, useMemo } from "react";
import "./FoodGridList.css";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import homeIcon from "../assets/icons/home.png";
import { flyToBag } from "./flyToBag";

/* ─── Grid container: staggers children on mount/key change ── */
const gridVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.045, delayChildren: 0.04 } },
    exit: { transition: { staggerChildren: 0.02, staggerDirection: -1 } }
};

/* ─── Each card: slides up + fades in ────────────────────── */
const cardVariants = {
    hidden: { opacity: 0, y: 22, scale: 0.96 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } }
};

const FoodGridList = ({ foodData, addToBag, handleBack, handleHome }) => {
    const { categoryId } = useParams();
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("default"); // default | price_asc | price_desc | name

    const category = (() => {
        let cat = foodData.categories.find(c => c.id === categoryId);
        if (!cat) {
            for (const c of foodData.categories) {
                const sub = c.subCategories?.find(s => s.id === categoryId);
                if (sub) return sub;
            }
        }
        return cat;
    })();

    const dishes = category?.dishes || [];

    const filtered = useMemo(() => {
        if (!category) return [];

        let list = dishes;

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(d => d.name.toLowerCase().includes(q));
        }

        if (sortBy === "price_asc") list = [...list].sort((a, b) => a.basePrice - b.basePrice);
        if (sortBy === "price_desc") list = [...list].sort((a, b) => b.basePrice - a.basePrice);
        if (sortBy === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));

        return list;
    }, [category, dishes, search, sortBy]);

    // AFTER hooks
    if (!category) return null;

    return (
        <div className="food-grid-page">
            {/* HEADER */}
            <div className="food-grid-header">
                <button className="back-button" onClick={handleBack} />
                <div className="food-grid-title">{category.name}</div>
                <div className="home-btn home-btn-icon" onClick={handleHome} />
            </div>

            {/* TOOLBAR: search + sort */}
            <div className="food-grid-toolbar">
                <div className="food-grid-search-wrap">
                    <span className="food-grid-search-icon">🔍</span>
                    <input
                        className="food-grid-search"
                        type="text"
                        placeholder="Search dishes…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                        <button className="food-grid-search-clear" onClick={() => setSearch("")} aria-label="Clear">✕</button>
                    )}
                </div>

                <div className="food-grid-sort">
                    {[
                        { val: "default", label: "Default" },
                        { val: "price_asc", label: "↑ Price" },
                        { val: "price_desc", label: "↓ Price" },
                        { val: "name", label: "A → Z" },
                    ].map(opt => (
                        <button
                            key={opt.val}
                            className={`food-grid-sort-btn ${sortBy === opt.val ? "active" : ""}`}
                            onClick={() => setSortBy(opt.val)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                <div className="food-grid-count">
                    {filtered.length} of {dishes.length} dishes
                </div>
            </div>

            {/* GRID — AnimatePresence re-mounts grid when sort/search key changes,
                 triggering staggered card entrance animation                    */}
            <AnimatePresence mode="wait">
                {filtered.length === 0 ? (
                    <motion.div
                        key="empty"
                        className="food-grid-empty"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
                        exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    >
                        <div className="food-grid-empty-icon">🍽</div>
                        <div>No dishes found for &ldquo;{search}&rdquo;</div>
                    </motion.div>
                ) : (
                    <motion.div
                        key={sortBy + "|" + search}
                        className="food-grid"
                        variants={gridVariants}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                    >
                        {filtered.map(dish => (
                            <DishCard
                                key={dish.id}
                                dish={dish}
                                categoryId={categoryId}
                                onView={() => navigate(`/foods/${categoryId}`, { state: { dishId: dish.id } })}
                                onAdd={e => {
                                    e.stopPropagation();
                                    const img = e.currentTarget.closest(".food-grid-card")?.querySelector(".food-grid-card-img");
                                    addToBag({
                                        id: dish.id,
                                        name: dish.name,
                                        image: dish.image,
                                        categoryId,
                                        quantity: 1,
                                        unitPrice: dish.basePrice,
                                        totalPrice: dish.basePrice,
                                        isCustomized: false,
                                        notes: "",
                                        __pendingImage: true
                                    });
                                    flyToBag({ imgEl: img, dishId: dish.id, customizationKey: "" });
                                }}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ── Dish card ──────────────────────────────────────────── */
const DishCard = ({ dish, onView, onAdd }) => {
    const [imgLoaded, setImgLoaded] = useState(false);

    return (
        <motion.div
            className="food-grid-card"
            variants={cardVariants}
            onClick={onView}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === "Enter" && onView()}
            whileHover={{ y: -6, scale: 1.025, transition: { duration: 0.22, ease: [0.34, 1.56, 0.64, 1] } }}
            whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
        >
            <div className="food-grid-card-img-wrap">
                {!imgLoaded && <div className="food-grid-img-skeleton" />}
                <img
                    className={`food-grid-card-img ${imgLoaded ? "loaded" : ""}`}
                    src={dish.image}
                    alt={dish.name}
                    loading="lazy"
                    onLoad={() => setImgLoaded(true)}
                />
            </div>

            <div className="food-grid-card-body">
                <div className="food-grid-card-name">{dish.name}</div>
                {dish.description && (
                    <div className="food-grid-card-desc">{dish.description}</div>
                )}
                <div className="food-grid-card-footer">
                    <div className="food-grid-card-price">₹{dish.basePrice}</div>
                    <button
                        className="food-grid-card-add"
                        onClick={onAdd}
                        aria-label={`Add ${dish.name} to bag`}
                    >
                        +
                    </button>
                </div>
            </div>

            <div className="food-grid-card-view-hint">View →</div>
        </motion.div>
    );
};

export default FoodGridList;