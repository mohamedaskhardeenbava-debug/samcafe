import "./FoodItem.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import trash from "../assets/icons/trash.png";
import mild from "../assets/icons/mild.png";
import hot from "../assets/icons/hot.png";
import extreme from "../assets/icons/extreme.png";
import notesIcon from "../assets/icons/notes.png";
import homeIcon from "../assets/icons/home.png";
import { AnimatePresence, motion } from "framer-motion";

const STEP = 10;

const SPICINESS_OPTIONS = [
  { id: "mild", name: "Mild", icon: mild },
  { id: "hot", name: "Hot", icon: hot },
  { id: "extreme", name: "Extreme", icon: extreme }
];

const FoodItem = ({ handleHome, foodData, updateBagItem, onToggleFavourite, addToBag, handleBack, toCamelCase }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    categoryId,
    dishId,
    fromBag,
    bagIndex,
    bagItem,
    fromFavouriteCustomize,
    originalFavouriteId
  } = location.state || {};

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
  const { favouriteSnapshot } = location.state || {};

  const isEditMode = fromBag === true && typeof bagIndex === "number";

  // find category and dish (minimal safe lookup)
  const category =
    foodData.categories.find((c) => c.id === categoryId) ||
    foodData.categories.find((c) => c.dishes.some((d) => d.id === dishId));

  const dish = category && dishId ? category.dishes.find((d) => d.id === dishId) : null;

  const originalCategory =
    foodData.categories.find((c) => c.dishes.some((d) => d.id === dish?.id)) || category;

  const favouriteDish = fromFavouriteCustomize ? favouriteSnapshot : null;

  const effectiveDish = isEditMode
    ? {
      ...dish,
      ingredients: bagItem?.ingredients || []
    }
    : fromFavouriteCustomize
      ? {
        ...dish,
        ingredients: favouriteDish?.ingredients || dish.ingredients
      }
      : dish || {
        id: "__custom__",
        name: category ? `Make Your Own ${category.name}` : "Custom Dish",
        basePrice: 200,
        ingredients: []
      };

  const wishlistDish =
    dish ||
    effectiveDish ||
    {
      id: "__custom__",
      name: `Make Your Own ${category?.name || ""}`,
      image: "/assets/placeholder-food.jpg",
      basePrice: originalCategory?.basePrice ?? 200
    };

  const favouriteId = `${wishlistDish.id}_${selectedSize}_${Date.now()}`;

  // sizes
  const selectedSizeObj =
    originalCategory?.sizes?.find((s) => s.name.toLowerCase() === selectedSize) || originalCategory?.sizes?.[0];

  const sizeMultiplier = Number(selectedSizeObj?.priceMultiplier ?? 1);

  useEffect(() => {
    // initialize size
    if (originalCategory?.sizes?.length) setSelectedSize(originalCategory.sizes[0].name.toLowerCase());

    // initialize ingredient quantities
    const initial = {};
    // start with used-in-category ingredients (default 0)
    foodData.ingredients.forEach((ing) => {
      if (ing.usedInCategories.includes(originalCategory?.id)) initial[ing.name] = 0;
    });

    // overlay dish or bag quantities
    const source = isEditMode && bagItem ? bagItem.ingredients : effectiveDish.ingredients || [];
    const selected = [];
    source.forEach((ing) => {
      initial[ing.name] = Number(ing.quantity) || 0;
      if (Number(ing.quantity) > 0) selected.push(ing.name);
    });

    // ensure selectedOrder preserves selected items (bag or dish order)
    setSelectedOrder(selected);

    setIngredientQuantities(initial);
    if (isEditMode && bagItem) {
      setQuantity(Number(bagItem.quantity) || 1);
      setSelectedSize(bagItem.selectedSize || selectedSizeObj?.name?.toLowerCase());
      setSpiciness(bagItem.spiciness || "mild");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foodData.ingredients.length, effectiveDish.id, bagItem?.id, fromFavouriteCustomize]);

  // reset wishlist color when entering page
  useEffect(() => {
    setIsWishlisted(false);
  }, [effectiveDish.id]);

  const handleWishlist = () => {
    if (fromFavouriteCustomize || fromBag) return;

    const bagItem = buildBagItem(); // calculate ONCE

    const favouriteSnapshot = {
      id: dish.id,
      name: dish.name,
      image: dish.image,
      categoryId: category.id,

      // ✅ NEW
      selectedSize,
      sizeMultiplier,

      // prices
      basePrice: dish.basePrice,
      totalPrice: Math.round(bagItem.totalPrice),

      // ingredients snapshot
      ingredients: bagItem.ingredients,

      // nutrition snapshot
      benefits: bagItem.benefits || dish.benefits,

      description: dish.description,
      history: dish.history
    };

    onToggleFavourite(favouriteSnapshot);
    setIsWishlisted(true);
  };

  const increaseQty = () => setQuantity((q) => q + 1);
  const decreaseQty = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

  const handleIngredientAdjust = (name, delta) => {
    setIngredientQuantities((prev) => {
      const curr = Number(prev[name] || 0);
      const next = Math.max(0, curr + delta);
      return { ...prev, [name]: next };
    });
  };

  // keep selectedOrder in sync when quantities change
  useEffect(() => {
    // add newly selected to top, remove zero qtys
    Object.entries(ingredientQuantities).forEach(([name, qty]) => {
      const has = selectedOrder.includes(name);
      if (Number(qty) > 0 && !has) {
        setSelectedOrder((prev) => [name, ...prev.filter((n) => n !== name)]);
      }
      if (Number(qty) === 0 && has) {
        setSelectedOrder((prev) => prev.filter((n) => n !== name));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingredientQuantities]);

  const buildBagItem = () => {
    // 1️⃣ Base price (ALWAYS from original dish/category)
    const base =
      Number(dish?.basePrice ?? originalCategory?.basePrice ?? 200) *
      sizeMultiplier;

    const isCustomized = fromFavouriteCustomize
      ? false
      : Object.entries(ingredientQuantities).some(([name, qty]) => {
        const baseQty =
          (dish?.ingredients || []).find(i => i.name === name)?.quantity || 0;
        return Number(qty) !== Number(baseQty);
      });

    // 2️⃣ Build selected ingredients
    const ingredients = Object.entries(ingredientQuantities)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([name, qty]) => {
        const master = foodData.ingredients.find((i) => i.name === name) || {};
        const pricePer100g = Number(master.pricePer100g || 0);
        const totalPrice = Math.round((pricePer100g * qty) / 100);

        return {
          name,                 // ✅ ingredient name ONLY
          quantity: Number(qty),
          pricePer100g,
          totalPrice
        };

      });

    // 3️⃣ Ingredient price totals
    const selectedIngredientsTotal = ingredients.reduce(
      (sum, i) => sum + i.totalPrice,
      0
    );

    const baseDishIngredients = dish?.ingredients || [];

    const baseIngredientsTotal = baseDishIngredients.reduce((sum, ing) => {
      const master = foodData.ingredients.find((i) => i.name === ing.name) || {};
      return (
        sum +
        Math.round(
          (Number(master.pricePer100g || 0) * Number(ing.quantity || 0)) / 100
        )
      );
    }, 0);

    // 4️⃣ Ingredient delta
    const ingredientDeltaPrice =
      selectedIngredientsTotal - baseIngredientsTotal;

    // 5️⃣ Final prices
    const unitPrice = Math.max(0, Math.round(base + ingredientDeltaPrice));
    const qty = Number(quantity || 1);
    const totalPrice = unitPrice * qty;

    return {
      id: dish?.id || effectiveDish.id,
      name:
        fromBag && bagItem?.name
          ? bagItem.name
          : fromFavouriteCustomize && favouriteDish
            ? favouriteDish.name
            : effectiveDish.name,

      image: dish?.image || effectiveDish.image,
      categoryId: originalCategory?.id,
      quantity: qty,
      selectedSize,
      spiciness,
      ingredients,
      unitPrice,
      totalPrice,
      isCustomized: fromFavouriteCustomize ? false : isCustomized,
      isFromFavourite: fromFavouriteCustomize === true
    };
  };

  const previewItem = buildBagItem();

  const totalPrice = previewItem.totalPrice || 0;

  const hasIngredientChanges = () => {
    const base = dish?.ingredients || [];

    // map base ingredients for quick lookup
    const baseMap = {};
    base.forEach((ing) => {
      baseMap[ing.name] = Number(ing.quantity || 0);
    });

    // compare with current quantities
    return Object.entries(ingredientQuantities).some(
      ([name, qty]) => Number(qty) !== Number(baseMap[name] || 0)
    );
  };

  const baseIngredientSet = new Set(
    (dish?.ingredients || []).map((ing) => ing.name)
  );

  const calculateNutritionFromIngredients = (ingredients) => {
    const totals = { calories: 0, protein: 0, fat: 0, fibre: 0 };

    ingredients.forEach((ing) => {
      const master = foodData.ingredients.find(
        (i) => i.name === ing.name
      );
      if (!master?.nutritionPer100g) return;

      const factor = ing.quantity / 100;
      const n = master.nutritionPer100g;

      totals.calories += (n.kcal || 0) * factor;
      totals.protein += (n.protein || 0) * factor;
      totals.fat += (n.fat || 0) * factor;
      totals.fibre += (n.fibre || 0) * factor;
    });

    return totals;
  };

  const round = (num, decimals = 1) =>
    Math.round((num + Number.EPSILON) * 10 ** decimals) / 10 ** decimals;

  const baseDishBenefits =
    dish?.benefits ||
    effectiveDish?.benefits ||
    {
      calories: 200,
      protein: 20,
      fat: 10,
      fibre: 6
    };

  const calculateFinalBenefits = ({
    baseDishBenefits,
    baseIngredients,
    selectedIngredients
  }) => {
    // nutrition from base dish ingredients
    const baseIngNutrition =
      calculateNutritionFromIngredients(baseIngredients || []);

    // nutrition from selected ingredients
    const selectedIngNutrition =
      calculateNutritionFromIngredients(selectedIngredients || []);

    // delta = added / removed ingredient nutrition
    const delta = {
      calories: selectedIngNutrition.calories - baseIngNutrition.calories,
      protein: selectedIngNutrition.protein - baseIngNutrition.protein,
      fat: selectedIngNutrition.fat - baseIngNutrition.fat,
      fibre: selectedIngNutrition.fibre - baseIngNutrition.fibre
    };

    // final benefits = dish benefits + delta
    return {
      calories: round((baseDishBenefits?.calories || 0) + delta.calories),
      protein: round((baseDishBenefits?.protein || 0) + delta.protein),
      fat: round((baseDishBenefits?.fat || 0) + delta.fat),
      fibre: round((baseDishBenefits?.fibre || 0) + delta.fibre)
    };
  };

  if (!category) return <p>Category not found</p>;
  const categoryIngredients = foodData.ingredients.filter((ing) => ing.usedInCategories.includes(originalCategory?.id));
  const sortedCategoryIngredients = (() => {
    const selected = [];
    const unselected = [];

    categoryIngredients.forEach((ing) => {
      const qty = Number(ingredientQuantities[ing.name] || 0);
      if (qty > 0) selected.push(ing);
      else unselected.push(ing);
    });

    // selected first, but original order preserved
    return [...selected, ...unselected];
  })();

  const orderedIngredients = (() => {
    const base = [];
    const rest = [];

    categoryIngredients.forEach((ing) => {
      if (baseIngredientSet.has(ing.name)) {
        base.push(ing);        // 1️⃣ base dish ingredients
      } else {
        rest.push(ing);        // 2️⃣ everything else
      }
    });

    // Order = base dish ingredients first, then others
    // Selection does NOT affect position
    return [...base, ...rest];
  })();

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

  return (
    <div className="food-item">
      <div className="left-panel">
        <div className="fooditem-header">
          <button
            className="back-button"
            onClick={() => handleBack()}
          />
          <div className="food-item-name">
            {fromBag && bagItem?.name
              ? bagItem.name
              : fromFavouriteCustomize && favouriteDish
                ? favouriteDish.name
                : dish
                  ? dish.name
                  : `Make Your Own ${category.name}`}
          </div>
          <div className="home-btn" onClick={handleHome}>
            <img src={homeIcon} alt="" />
          </div>
          {!fromBag && !fromFavouriteCustomize && (
            <div
              className={`wishlist-btn ${isWishlisted ? "active" : ""}`}
              onClick={() => {
                if (fromBag || fromFavouriteCustomize) return;

                const bagItem = buildBagItem();

                const benefits = calculateFinalBenefits({
                  baseDishBenefits,
                  baseIngredients: dish?.ingredients || [],
                  selectedIngredients: bagItem.ingredients
                });

                const ingredientsChanged = hasIngredientChanges();

                // 🔹 CASE 1: NO ingredient change → auto save
                if (!ingredientsChanged) {
                  const benefits = calculateFinalBenefits({
                    baseDishBenefits,
                    baseIngredients: dish?.ingredients || [],
                    selectedIngredients: bagItem.ingredients
                  });
                  onToggleFavourite({
                    id: `${wishlistDish.id}_${selectedSize}_${Date.now()}`,
                    originalDishId: wishlistDish.id,
                    name: wishlistDish.name,
                    image: wishlistDish.image,
                    categoryId: category.id,
                    selectedSize,
                    basePrice: wishlistDish.basePrice,
                    totalPrice: bagItem.totalPrice,
                    ingredients: dish.ingredients || [],
                    benefits
                  });
                  setIsWishlisted(true);
                  return;
                }

                // 🔹 CASE 2: ingredient changed → open form
                setFavName(wishlistDish.name);
                setFavDescription("");
                setShowFavouriteForm(true);
              }}
            >
              ♥
            </div>
          )}
        </div>

        <AnimatePresence>
          {showFavouriteForm && (
            <motion.div
              className="overlay"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <motion.form
                className="modal"
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <h3>Save to Wishlist</h3>

                <label>Name</label>
                <input
                  autoFocus
                  required
                  value={favName}
                  onChange={(e) => setFavName(toCamelCase(e.target.value))}
                />

                <label>Description</label>
                <textarea
                  required
                  value={favDescription}
                  onChange={(e) => setFavDescription(e.target.value)}
                />

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowFavouriteForm(false)}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="primary"
                    onClick={() => {
                      const bagItem = buildBagItem();
                      const benefits = calculateFinalBenefits({
                        baseDishBenefits,
                        baseIngredients: dish?.ingredients || [],
                        selectedIngredients: bagItem.ingredients
                      });

                      onToggleFavourite({
                        id: `${wishlistDish.id}_${selectedSize}_${Date.now()}`,
                        name: favName,
                        description: favDescription,
                        image: wishlistDish.image,
                        categoryId: category.id,
                        selectedSize,
                        basePrice: wishlistDish.basePrice,
                        totalPrice: bagItem.totalPrice,
                        ingredients: bagItem.ingredients,
                        benefits
                      });

                      setIsWishlisted(true);
                      setShowFavouriteForm(false);
                    }}
                  >
                    Save
                  </button>
                </div>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="image-header">
          <div className="image-header-left">
            <div className="food-item-image">
              <img src={dish?.image || "/assets/placeholder-food.jpg"} alt={dish?.name || "Make Your Own"} draggable={false} />
            </div>
          </div>

          <div className="image-header-right">
            {selectedSizeObj && (
              <div className="size-selector">
                <div>Sizes</div>
                <div className="size-selector-container">
                  {originalCategory?.sizes?.map((size) => (
                    <div
                      key={size.name}
                      className={`size-selector-item ${selectedSize === size.name ? "active" : ""}`}
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
                {SPICINESS_OPTIONS.map((option) => (
                  <div key={option.id} className={`hot-selector-icon ${spiciness === option.id ? "active" : ""}`} onClick={() => setSpiciness(option.id)} role="button">
                    <img src={option.icon} alt={option.id} />
                    <div>{option.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="ingredient-section">
          <div className="ingredients">All Ingredients</div>
          <div className="ingredient-list">
            {orderedIngredients.map((ing) => {
              const qty = ingredientQuantities[ing.name] || 0;
              return (
                <div
                  className={`ingredient-item ${qty > 0 ? "selected" : ""}`}
                  key={ing.id}
                >
                  <div className="ingredient-item-image">
                    <img src={ing.image} alt="" />
                  </div>
                  <div className="ingredient-item-name">{ing.name}</div>
                  <div className="ingredient-item-price">₹{ing.pricePer100g}/100g</div>
                  <div className="ingredient-modification">
                    <button className="ingredient-minus" onClick={() => handleIngredientAdjust(ing.name, -STEP)}>-</button>
                    <div className="ingredient-quantity">{qty}g</div>
                    <button className="ingredient-plus" onClick={() => handleIngredientAdjust(ing.name, STEP)}>+</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="right-panel">
        <div className="top">
          <div className="ingredients-calculation">
            Selected Ingredients

            <img src={notesIcon} alt="" className="note-icon"
              onClick={() => setShowNotes((v) => !v)}
              title="Add notes" />
          </div>

          <div className={`notes-wrapper ${showNotes ? "open" : ""}`}>
            <textarea
              className="notes-box"
              placeholder="Add preparation notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {previewItem.ingredients.map((ing) => (
            <div className="ingredient-item-calculation" key={ing.name}>
              <div className="ingredient-item-image-calculation"><img src={(foodData.ingredients.find(i => i.name === ing.name) || {}).image} alt="" /></div>
              <div className="ingredient-item-name-calculation">{ing.name}</div>
              <div className="ingredient-item-quantity-calculation">{ing.quantity}g</div>
              <div className="ingredient-item-price-calculation">₹{ing.totalPrice.toFixed(0)}</div>
              <div className="ingredient-delete" onClick={() => handleIngredientAdjust(ing.name, -ing.quantity)}><img src={trash} alt="Trash" /></div>
            </div>
          ))}
        </div>

        <div className="bottom">
          <div className="price-section">
            <div className="price-label">Total Price</div>
            <div className="food-item-total-amount">₹{totalPrice.toFixed(0)}</div>
          </div>

          <div className="quantity-section">
            <div className="quantity-label">Quantity</div>
            <div className="quantity-controls">
              <button className="qty-btn" onClick={decreaseQty} disabled={quantity === 1}>-</button>
              <div className="qty-value">{quantity}x</div>
              <button className="qty-btn" onClick={increaseQty}>+</button>
            </div>
          </div>

          <button
            className="food-place-order-button"
            onClick={() => {
              const item = {
                ...buildBagItem(),
                isCustomized: fromFavouriteCustomize ? false : buildBagItem().isCustomized,
                isFromFavourite: fromFavouriteCustomize === true
              };
              if (isEditMode) updateBagItem(bagIndex, item); else addToBag(item);
              navigate("/thank-you");
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
