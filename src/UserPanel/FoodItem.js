import "./FoodItem.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback } from "react";
import trash from "../assets/icons/trash.png";
import mild from "../assets/icons/mild.png";
import hot from "../assets/icons/hot.png";
import extreme from "../assets/icons/extreme.png";
import notesIcon from "../assets/icons/notes.png";
import homeIcon from "../assets/icons/home.png";
import { AnimatePresence, motion } from "framer-motion";
import { flyToBag } from "./flyToBag";

/* ─── Constants ───────────────────────────────────────────── */
const STEP = 10;
const MIN_GRAMS = STEP;

const SPICINESS_OPTIONS = [
  { id: "mild", name: "Mild", icon: mild },
  { id: "hot", name: "Hot", icon: hot },
  { id: "extreme", name: "Extreme", icon: extreme }
];

/* ─── Helpers ─────────────────────────────────────────────── */
const isOutOfStock = (ingredient) =>
  Number(ingredient.stockRemaining || 0) * 1000 < MIN_GRAMS;

const isIngredientEnabled = (master, dishId) => {
  if (!master) return true;
  if (master.isDisabledGlobally === true) return false;
  if (Array.isArray(master.disabledForDishes) && master.disabledForDishes.includes(dishId)) return false;
  return true;
};

/* ─── Animation variants ──────────────────────────────────── */
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 }
};

/* ─── Component ───────────────────────────────────────────── */
const FoodItem = ({ handleHome, foodData, updateBagItem, onToggleFavourite, addToBag, handleBack, toCamelCase, currentUser }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { categoryId, dishId, fromBag, bagIndex, bagItem, fromFavouriteCustomize } = location.state || {};
  const { favouriteSnapshot } = location.state || {};

  const isEditMode = fromBag === true && typeof bagIndex === "number";

  const safeIngredients = useMemo(() => (
    Array.isArray(foodData?.ingredients) ? foodData.ingredients : []
  ), [foodData?.ingredients]);

  /* ── Find category & dish ── */
  const category = useMemo(() => {
    const top = foodData.categories.find(c => c.id === categoryId);
    if (top) return top;
    for (const cat of foodData.categories) {
      const sub = cat.subCategories?.find(s => s.id === categoryId);
      if (sub) return sub;
    }
    return null;
  }, [foodData.categories, categoryId]);

  const dish = useMemo(() => (
    category && dishId ? category.dishes.find(d => d.id === dishId) : null
  ), [category, dishId]);

  const originalCategory = useMemo(() => {
    if (!dish) return category;
    let found = foodData.categories.find(c => Array.isArray(c.dishes) && c.dishes.some(d => d.id === dish.id));
    if (!found) {
      for (const cat of foodData.categories) {
        const sub = cat.subCategories?.find(s => Array.isArray(s.dishes) && s.dishes.some(d => d.id === dish.id));
        if (sub) { found = sub; break; }
      }
    }
    return found || category;
  }, [dish, category, foodData.categories]);

  const favouriteDish = fromFavouriteCustomize ? favouriteSnapshot : null;

  const effectiveDish = useMemo(() => {
    if (isEditMode) return { ...dish, ingredients: bagItem?.ingredients || [] };
    if (fromFavouriteCustomize) return { ...dish, ingredients: favouriteDish?.ingredients || dish?.ingredients };
    return dish || { id: "__custom__", name: category ? `Make Your Own ${category.name}` : "Custom Dish", basePrice: 200, ingredients: [] };
  }, [isEditMode, fromFavouriteCustomize, dish, bagItem, favouriteDish, category]);

  const wishlistDish = dish || effectiveDish || { id: "__custom__", name: `Make Your Own ${category?.name || ""}`, image: "/assets/placeholder-food.jpg", basePrice: originalCategory?.basePrice ?? 200 };

  /* ── State ── */
  const [quantity, setQuantity] = useState(1);
  const [spiciness, setSpiciness] = useState("mild");
  const [selectedSize, setSelectedSize] = useState(null);
  const [ingredientQuantities, setIngredientQuantities] = useState({});
  const [selectedOrder, setSelectedOrder] = useState([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showFavouriteForm, setShowFavouriteForm] = useState(false);
  const [favName, setFavName] = useState("");
  const [favDescription, setFavDescription] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [blinkIngredient, setBlinkIngredient] = useState(null);
  const [pricePulse, setPricePulse] = useState(false);

  /* ── Size & multiplier ── */
  const selectedSizeObj = useMemo(() => (
    originalCategory?.sizes?.find(s => s.name.toLowerCase() === selectedSize) || originalCategory?.sizes?.[0]
  ), [originalCategory, selectedSize]);

  const sizeMultiplier = Number(selectedSizeObj?.priceMultiplier ?? 1);

  /* ── Allowed category ingredients ── */
  const categoryIngredients = useMemo(() => {
    return safeIngredients.filter(ing => {
      if (!ing.usedInCategories?.includes(originalCategory?.id)) return false;
      return isIngredientEnabled(ing, dish?.id);
    });
  }, [safeIngredients, originalCategory?.id, dish?.id]);

  /* ── Ordered: available first, out-of-stock last ── */
  const orderedIngredients = useMemo(() => {
    const available = [], unavailable = [];
    categoryIngredients.forEach(ing => (isOutOfStock(ing) ? unavailable : available).push(ing));
    return [...available, ...unavailable];
  }, [categoryIngredients]);

  /* ── Initialise state from dish/bag ── */
  useEffect(() => {
    if (originalCategory?.sizes?.length) setSelectedSize(originalCategory.sizes[0].name.toLowerCase());

    const dishIngredientNames = new Set((dish?.ingredients || []).map(i => i.name));
    const allowedIngredients = dishIngredientNames.size > 0
      ? safeIngredients.filter(ing => dishIngredientNames.has(ing.name) && isIngredientEnabled(ing, dish?.id))
      : categoryIngredients;

    const initial = {};
    allowedIngredients.forEach(ing => { initial[ing.name] = 0; });

    const source = isEditMode && bagItem ? bagItem.ingredients : effectiveDish.ingredients || [];
    const selected = [];

    source.forEach(ing => {
      const master = safeIngredients.find(i => i.id === ing.id || i.name === ing.name);
      if (!isIngredientEnabled(master, dish?.id)) return;
      initial[ing.name] = Number(ing.quantity) || 0;
      if (Number(ing.quantity) > 0) selected.push(ing.name);
    });

    setSelectedOrder(selected);
    setIngredientQuantities(initial);

    if (isEditMode && bagItem) {
      setQuantity(Number(bagItem.quantity) || 1);
      setSelectedSize(bagItem.selectedSize || selectedSizeObj?.name?.toLowerCase());
      setSpiciness(bagItem.spiciness || "mild");
      setNotes(bagItem.notes || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIngredients.length, effectiveDish.id, bagItem?.id, fromFavouriteCustomize]);

  useEffect(() => { setIsWishlisted(false); }, [effectiveDish.id]);

  /* ── Keep selectedOrder in sync ── */
  useEffect(() => {
    setSelectedOrder(prev => {
      let updated = [...prev];
      Object.entries(ingredientQuantities).forEach(([name, qty]) => {
        const has = updated.includes(name);
        if (Number(qty) > 0 && !has) updated = [name, ...updated.filter(n => n !== name)];
        if (Number(qty) === 0 && has) updated = updated.filter(n => n !== name);
      });
      return updated;
    });
  }, [ingredientQuantities]);

  const increaseQty = () => setQuantity(q => q + 1);
  const decreaseQty = () => setQuantity(q => (q > 1 ? q - 1 : 1));

  const handleIngredientAdjust = useCallback((name, delta) => {
    setIngredientQuantities(prev => {
      const next = Math.max(0, Number(prev[name] || 0) + delta);
      return { ...prev, [name]: next };
    });
    setBlinkIngredient(name);
    setTimeout(() => setBlinkIngredient(null), 600);
  }, []);

  const hasIngredientChanges = useCallback(() => {
    const base = dish?.ingredients || [];
    const baseMap = {};
    base.forEach(ing => { baseMap[ing.name] = Number(ing.quantity || 0); });
    return Object.entries(ingredientQuantities).some(([name, qty]) => Number(qty) !== Number(baseMap[name] || 0));
  }, [dish?.ingredients, ingredientQuantities]);

  /* ── Build bag item (memoized) ── */
  const previewItem = useMemo(() => {
    const base = Number(dish?.basePrice ?? originalCategory?.basePrice ?? 200) * sizeMultiplier;

    const ingredients = Object.entries(ingredientQuantities)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([name, qty]) => {
        const master = safeIngredients.find(i => i.name === name) || {};
        const pricePer100g = Number(master.pricePer100g || 0);
        return { id: master.id, name, quantity: Number(qty), pricePer100g, totalPrice: Math.round((pricePer100g * qty) / 100) };
      });

    const selectedTotal = ingredients.reduce((s, i) => s + i.totalPrice, 0);
    const baseTotal = (dish?.ingredients || []).reduce((s, ing) => {
      const master = safeIngredients.find(i => i.name === ing.name) || {};
      return s + Math.round((Number(master.pricePer100g || 0) * Number(ing.quantity || 0)) / 100);
    }, 0);

    const delta = selectedTotal - baseTotal;
    const ingredientModified = selectedTotal !== baseTotal;
    const unitPrice = Math.max(0, Math.round(base + delta));
    const qty = Number(quantity || 1);

    const customizationKey = (() => {
      if (!ingredientModified && !notes?.trim() && !selectedSize) return null;
      const ingSig = ingredients.map(i => `${i.name}:${i.quantity}`).sort().join("|");
      return [selectedSize || "", spiciness || "", notes?.trim() || "", ingSig].join("__");
    })();

    const baseName = dish?.name || favouriteDish?.name || effectiveDish?.name || "Custom Dish";

    return {
      id: dish?.id || effectiveDish.id,
      customizationKey,
      name: fromBag && bagItem?.name ? bagItem.name : ingredientModified ? `Customized ${baseName}` : baseName,
      image: dish?.image || effectiveDish.image,
      categoryId: originalCategory?.id,
      quantity: qty,
      selectedSize,
      spiciness,
      ingredients,
      unitPrice,
      totalPrice: unitPrice * qty,
      notes: notes?.trim() || "",
      isCustomized: fromFavouriteCustomize ? false : ingredientModified,
      isFromFavourite: fromFavouriteCustomize === true
    };
  }, [ingredientQuantities, quantity, selectedSize, spiciness, notes, dish, effectiveDish, originalCategory, safeIngredients, sizeMultiplier, fromBag, bagItem, fromFavouriteCustomize, favouriteDish]);

  const totalPrice = previewItem.totalPrice || 0;

  /* ── Price pulse on change ── */
  useEffect(() => {
    if (!totalPrice) return;
    setPricePulse(true);
    const t = setTimeout(() => setPricePulse(false), 500);
    return () => clearTimeout(t);
  }, [totalPrice]);

  /* ── Nutrition ── */
  const baseDishBenefits = dish?.benefits || effectiveDish?.benefits || { calories: 200, protein: 20, fat: 10, fibre: 6 };

  const round = (n, d = 1) => Math.round((n + Number.EPSILON) * 10 ** d) / 10 ** d;

  const calculateNutrition = useCallback((ingredientList) => {
    const totals = { calories: 0, protein: 0, fat: 0, fibre: 0 };
    (ingredientList || []).forEach(ing => {
      const master = safeIngredients.find(i => i.name === ing.name);
      if (!master?.nutritionPer100g) return;
      const factor = ing.quantity / 100;
      const n = master.nutritionPer100g;
      totals.calories += (n.kcal || 0) * factor;
      totals.protein += (n.protein || 0) * factor;
      totals.fat += (n.fat || 0) * factor;
      totals.fibre += (n.fibre || 0) * factor;
    });
    return totals;
  }, [safeIngredients]);

  const calculateFinalBenefits = useCallback(({ baseDishBenefits, baseIngredients, selectedIngredients }) => {
    const baseNut = calculateNutrition(baseIngredients || []);
    const selNut = calculateNutrition(selectedIngredients || []);
    const delta = { calories: selNut.calories - baseNut.calories, protein: selNut.protein - baseNut.protein, fat: selNut.fat - baseNut.fat, fibre: selNut.fibre - baseNut.fibre };
    return {
      calories: round((baseDishBenefits?.calories || 0) + delta.calories),
      protein: round((baseDishBenefits?.protein || 0) + delta.protein),
      fat: round((baseDishBenefits?.fat || 0) + delta.fat),
      fibre: round((baseDishBenefits?.fibre || 0) + delta.fibre)
    };
  }, [calculateNutrition]);

  if (!category) return <p>Category not found</p>;

  /* ── JSX ── */
  return (
    <div className="food-item">
      <div className="left-panel">
        {/* HEADER */}
        <div className="fooditem-header">
          <button className="back-button" onClick={ handleBack } />
          <div className="food-item-name">
            {fromBag && bagItem?.name ? bagItem.name
              : fromFavouriteCustomize && favouriteDish ? favouriteDish.name
                : dish ? dish.name
                  : `Make Your Own ${category.name}`}
          </div>
          <div className="home-btn  home-btn-icon" onClick={handleHome} />
          {!fromBag && !fromFavouriteCustomize && currentUser && currentUser.id !== "guest" && (
            <div
              className={`wishlist-btn ${isWishlisted ? "active" : ""}`}
              onClick={() => {
                const ingredientsChanged = hasIngredientChanges();
                if (!ingredientsChanged) {
                  const benefits = calculateFinalBenefits({ baseDishBenefits, baseIngredients: dish?.ingredients || [], selectedIngredients: previewItem.ingredients });
                  onToggleFavourite({ id: `${wishlistDish.id}_${selectedSize}_${Date.now()}`, originalDishId: wishlistDish.id, name: wishlistDish.name, image: wishlistDish.image, categoryId: category.id, selectedSize, basePrice: wishlistDish.basePrice, totalPrice: previewItem.totalPrice, ingredients: dish?.ingredients || [], benefits });
                  setIsWishlisted(true);
                  return;
                }
                setFavName(wishlistDish.name);
                setFavDescription("");
                setShowFavouriteForm(true);
              }}
              role="button"
              aria-label="Add to wishlist"
            >
              ♥
            </div>
          )}
        </div>

        {/* Wishlist form overlay */}
        <AnimatePresence mode="wait">
          {showFavouriteForm && (
            <motion.div className="overlay" variants={overlayVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.22 }}>
              <motion.form className="modal" variants={modalVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
                <h3>Save to Wishlist</h3>
                <label>Name</label>
                <input autoFocus required value={favName} onChange={e => setFavName(toCamelCase(e.target.value))} />
                <label>Description</label>
                <textarea required value={favDescription} onChange={e => setFavDescription(e.target.value)} />
                <div className="modal-actions">
                  <button type="button" onClick={() => setShowFavouriteForm(false)}>Cancel</button>
                  <button type="button" className="primary" onClick={() => {
                    const benefits = calculateFinalBenefits({ baseDishBenefits, baseIngredients: dish?.ingredients || [], selectedIngredients: previewItem.ingredients });
                    onToggleFavourite({ id: `${wishlistDish.id}_${selectedSize}_${Date.now()}`, name: favName, description: favDescription, image: wishlistDish.image, categoryId: category.id, selectedSize, basePrice: wishlistDish.basePrice, totalPrice: previewItem.totalPrice, ingredients: previewItem.ingredients, benefits });
                    setIsWishlisted(true);
                    setShowFavouriteForm(false);
                  }}>Save</button>
                </div>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* IMAGE + SELECTORS */}
        <div className="image-header">
          <div className="image-header-left">
            <div className="food-item-image">
              <img src={dish?.image || "/assets/placeholder-food.jpg"} alt={dish?.name || "Make Your Own"} loading="eager" decoding="async" draggable={false} />
            </div>
          </div>

          <div className="image-header-right">
            {selectedSizeObj && (
              <div className="size-selector">
                <div>Sizes</div>
                <div className="size-selector-container">
                  {originalCategory?.sizes?.map(size => (
                    <div
                      key={size.name}
                      className={`size-selector-item ${selectedSize === size.name.toLowerCase() ? "active" : ""}`}
                      onClick={() => setSelectedSize(size.name.toLowerCase())}
                      role="button"
                    >
                      <span className="size-tick" />
                      <div className="size-selector-item-name">{size.name}</div>
                      <div className="size-selector-item-description">{size.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="hot-selector">
              <div>Spiciness</div>
              <div className="hot-selector-container">
                {SPICINESS_OPTIONS.map(opt => (
                  <div key={opt.id} className={`hot-selector-icon ${spiciness === opt.id ? "active" : ""}`} onClick={() => setSpiciness(opt.id)} role="button">
                    <img src={opt.icon} alt={opt.name} />
                    <div>{opt.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* INGREDIENT LIST */}
        <div className="ingredient-section">
          <div className="ingredients">All Ingredients</div>
          <div className="ingredient-list">
            {orderedIngredients.map(ing => {
              const qty = ingredientQuantities[ing.name] || 0;
              const disabled = isOutOfStock(ing);

              return (
                <div
                  key={ing.id}
                  className={`ingredient-item ${qty > 0 ? "selected" : ""} ${disabled ? "disabled" : ""}`}
                  onClick={() => navigate(`/ingredient/${ing.id}`)}
                  role="button"
                >
                  <div className="ingredient-item-image">
                    <img src={ing.image} alt="" loading="lazy" decoding="async" />
                  </div>
                  <div className="ingredient-item-name">{ing.name}</div>
                  <div className="ingredient-item-price">₹{ing.pricePer100g}/100g</div>
                  <div className="ingredient-modification">
                    <button className="ingredient-minus" disabled={disabled} onClick={e => { e.stopPropagation(); !disabled && handleIngredientAdjust(ing.name, -STEP); }}>−</button>
                    <div className="ingredient-quantity">{qty}g</div>
                    <button className="ingredient-plus" disabled={disabled} onClick={e => { e.stopPropagation(); !disabled && handleIngredientAdjust(ing.name, +STEP); }}>+</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="right-panel">
        <div className="top">
          <div className="ingredients-calculation">
            <span>Selected Ingredients</span>
            <div className="notes-btn" onClick={() => setShowNotes(v => !v)}>
              <img src={notesIcon} alt="Notes" />
            </div>
          </div>

          <div className={`notes-wrapper ${showNotes ? "open" : ""}`}>
            <textarea
              className="notes-box"
              placeholder="Add preparation notes..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {previewItem.ingredients.map(ing => {
            const master = safeIngredients.find(i => i.name === ing.name);
            const out = !master || Number(master.stockRemaining || 0) * 1000 < STEP;

            return (
              <div
                key={ing.name}
                className={`ingredient-item-calculation ${out ? "out-of-stock" : ""} ${blinkIngredient === ing.name ? "blink" : ""}`}
                onClick={() => { const m = safeIngredients.find(i => i.name === ing.name); if (m) navigate(`/ingredient/${m.id}`); }}
                role="button"
              >
                <div className="ingredient-item-image-calculation">
                  <img src={master?.image} alt="" />
                </div>
                <div className="ingredient-item-name-calculation">
                  {out ? <s>{ing.name}</s> : ing.name}
                </div>
                <div className="ingredient-item-quantity-calculation">{ing.quantity}g</div>
                <div className="ingredient-item-price-calculation">₹{ing.totalPrice.toFixed(0)}</div>
                <div className="ingredient-delete" onClick={e => { e.stopPropagation(); !out && handleIngredientAdjust(ing.name, -ing.quantity); }}>
                  <img src={trash} alt="Remove" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="bottom">
          <div className="price-section">
            <div className="price-label">Total Price</div>
            <div className={`food-item-total-amount ${pricePulse ? "price-pulse" : ""}`}>
              ₹{totalPrice.toFixed(0)}
            </div>
          </div>

          <div className="quantity-section">
            <div className="quantity-label">Quantity</div>
            <div className="quantity-controls">
              <button className="qty-btn" onClick={decreaseQty} disabled={quantity === 1}>−</button>
              <div className="qty-value">{quantity}x</div>
              <button className="qty-btn" onClick={increaseQty}>+</button>
            </div>
          </div>

          <button
            className="food-place-order-button"
            onClick={() => {
              const img = document.querySelector(".food-item-image img");
              const item = { ...previewItem, isCustomized: previewItem.isCustomized === true, isFromFavourite: fromFavouriteCustomize === true };
              if (isEditMode) updateBagItem(bagIndex, item);
              else addToBag(item);
              flyToBag({
                imgEl: img,
                dishId: previewItem.id,
                customizationKey: previewItem.customizationKey || ""
              });
            }}
          >
            {isEditMode ? "Update Bag" : "Add to Bag"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoodItem;