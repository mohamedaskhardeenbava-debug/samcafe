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
import { flyToBag } from "./flyToBag";

const STEP = 10;

const MIN_GRAMS = STEP;

const isOutOfStock = (ingredient) =>
  Number(ingredient.stockRemaining || 0) * 1000 < MIN_GRAMS;

const SPICINESS_OPTIONS = [
  { id: "mild", name: "Mild", icon: mild },
  { id: "hot", name: "Hot", icon: hot },
  { id: "extreme", name: "Extreme", icon: extreme }
];

const FoodItem = ({ handleHome, foodData, updateBagItem, onToggleFavourite, addToBag, handleBack, toCamelCase, currentUser }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    categoryId,
    dishId,
    fromBag,
    bagIndex,
    bagItem,
    fromFavouriteCustomize,
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
  const [blinkIngredient, setBlinkIngredient] = useState(null);
  const [pricePulse, setPricePulse] = useState(false);
  const { favouriteSnapshot } = location.state || {};

  const isEditMode = fromBag === true && typeof bagIndex === "number";
  const safeIngredients = Array.isArray(foodData?.ingredients)
    ? foodData.ingredients
    : [];

  // find category and dish (minimal safe lookup)
  let category = foodData.categories.find(c => c.id === categoryId);

  if (!category) {
    for (const cat of foodData.categories) {
      const sub = cat.subCategories?.find(s => s.id === categoryId);
      if (sub) {
        category = sub;
        break;
      }
    }
  }

  const dish = category && dishId ? category.dishes.find((d) => d.id === dishId) : null;

  let originalCategory = foodData.categories.find(
    (c) =>
      Array.isArray(c.dishes) &&
      c.dishes.some((d) => d.id === dish?.id)
  );

  if (!originalCategory) {
    for (const cat of foodData.categories) {
      const sub = cat.subCategories?.find(
        (s) =>
          Array.isArray(s.dishes) &&
          s.dishes.some((d) => d.id === dish?.id)
      );

      if (sub) {
        originalCategory = sub;
        break;
      }
    }
  }

  originalCategory = originalCategory || category;

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

  // sizes
  const selectedSizeObj =
    originalCategory?.sizes?.find((s) => s.name.toLowerCase() === selectedSize) || originalCategory?.sizes?.[0];

  const sizeMultiplier = Number(selectedSizeObj?.priceMultiplier ?? 1);

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

  useEffect(() => {
    // initialize size
    if (originalCategory?.sizes?.length) setSelectedSize(originalCategory.sizes[0].name.toLowerCase());

    // initialize ingredient quantities
    const initial = {};
    const selected = [];
    // start with used-in-category ingredients (default 0)
    // 1️⃣ Ingredients explicitly used by the dish
    const dishIngredientNames = new Set(
      (dish?.ingredients || []).map(i => i.name)
    );

    // 2️⃣ Ingredients allowed by category
    const categoryIngredients = safeIngredients.filter(ing => {
      const usedInCategory =
        ing.usedInCategories?.includes(originalCategory?.id);

      if (!usedInCategory) return false;

      const isGloballyDisabled = ing.isDisabledGlobally === true;

      const isDisabledForDish =
        Array.isArray(ing.disabledForDishes) &&
        ing.disabledForDishes.includes(dish?.id);

      if (isGloballyDisabled) return false;
      if (isDisabledForDish) return false;

      return true;
    });

    // 3️⃣ Fallback: if dish has no ingredients, allow category ingredients
    const allowedIngredients =
      dishIngredientNames.size > 0
        ? safeIngredients.filter(ing => dishIngredientNames.has(ing.name))
        : categoryIngredients;

    // 4️⃣ Initialize quantities
    allowedIngredients.forEach(ing => {
      initial[ing.name] = 0;
    });

    // overlay dish or bag quantities
    const source = isEditMode && bagItem
      ? bagItem.ingredients
      : effectiveDish.ingredients || [];

    source.forEach((ing) => {
      const master = safeIngredients.find(
        (i) =>
          i.id === ing.id ||
          i.name === ing.name
      );

      if (!master) return;

      const isGloballyDisabled =
        master.isDisabledGlobally === true;

      const isDisabledForDish =
        Array.isArray(master.disabledForDishes) &&
        master.disabledForDishes.includes(dish?.id);

      if (isGloballyDisabled || isDisabledForDish) {
        return; // 🚫 DO NOT initialize disabled ingredient
      }

      initial[ing.name] = Number(ing.quantity) || 0;

      if (Number(ing.quantity) > 0) {
        selected.push(ing.name);
      }
    });

    // ensure selectedOrder preserves selected items (bag or dish order)
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

  // reset wishlist color when entering page
  useEffect(() => {
    setIsWishlisted(false);
  }, [effectiveDish.id]);

  const increaseQty = () => setQuantity((q) => q + 1);
  const decreaseQty = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

  const handleIngredientAdjust = (name, delta) => {
    setIngredientQuantities((prev) => {
      const curr = Number(prev[name] || 0);
      const next = Math.max(0, curr + delta);
      return { ...prev, [name]: next };
    });

    // trigger blink on right panel
    setBlinkIngredient(name);

    // auto-clear after animation
    setTimeout(() => {
      setBlinkIngredient(null);
    }, 600);
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

    // 2️⃣ Build selected ingredients
    const ingredients = Object.entries(ingredientQuantities)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([name, qty]) => {
        const master = safeIngredients.find((i) => i.name === name) || {};
        const pricePer100g = Number(master.pricePer100g || 0);
        const totalPrice = Math.round((pricePer100g * qty) / 100);

        return {
          id: master.id,
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
      const master = safeIngredients.find((i) => i.name === ing.name) || {};
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

    const isCustomized =
      selectedIngredientsTotal !== baseIngredientsTotal;

    // 5️⃣ Final prices
    const unitPrice = Math.max(0, Math.round(base + ingredientDeltaPrice));
    const qty = Number(quantity || 1);
    const totalPrice = unitPrice * qty;

    const ingredientModified = hasIngredientChanges();

    // 🔑 build a stable signature for customization
    const customizationKey = (() => {
      if (!ingredientModified && !notes?.trim() && !selectedSize) return null;

      const ingSignature = ingredients
        .map(i => `${i.name}:${i.quantity}`)
        .sort()
        .join("|");

      return [
        selectedSize || "",
        spiciness || "",
        notes?.trim() || "",
        ingSignature
      ].join("__");
    })();

    return {
      id: dish?.id || effectiveDish.id,

      // 🔑 THIS IS THE IMPORTANT PART
      customizationKey,

      name: (() => {
        const baseName =
          dish?.name ||
          favouriteDish?.name ||
          effectiveDish?.name ||
          "Custom Dish";

        if (fromBag && bagItem?.name) return bagItem.name;

        if (ingredientModified) {
          return `Customized ${baseName}`;
        }

        return baseName;
      })(),

      image: dish?.image || effectiveDish.image,
      categoryId: originalCategory?.id,
      quantity: qty,
      selectedSize,
      spiciness,
      ingredients,
      unitPrice,
      totalPrice,
      notes: notes?.trim() || "",
      isCustomized: fromFavouriteCustomize ? false : ingredientModified,
      isFromFavourite: fromFavouriteCustomize === true
    };
  };

  const previewItem = buildBagItem();

  const totalPrice = previewItem.totalPrice || 0;

  useEffect(() => {
    if (totalPrice === 0) return;

    setPricePulse(true);

    const t = setTimeout(() => {
      setPricePulse(false);
    }, 500);

    return () => clearTimeout(t);
  }, [totalPrice]);

  const calculateNutritionFromIngredients = (ingredients) => {
    const totals = { calories: 0, protein: 0, fat: 0, fibre: 0 };

    (dish?.ingredients || []).forEach((ing) => {
      const master = safeIngredients.find(
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
  const categoryIngredients = safeIngredients.filter((ing) => {
    const usedInCategory =
      ing.usedInCategories?.includes(originalCategory?.id);

    if (!usedInCategory) return false;

    const isGloballyDisabled = ing.isDisabledGlobally === true;

    const isDisabledForDish =
      Array.isArray(ing.disabledForDishes) &&
      ing.disabledForDishes.includes(dish?.id);

    if (isGloballyDisabled) return false;
    if (isDisabledForDish) return false;

    return true;
  });

  const orderedIngredients = (() => {
    const available = [];
    const unavailable = [];

    categoryIngredients.forEach((ing) => {
      if (isOutOfStock(ing)) unavailable.push(ing);
      else available.push(ing);
    });

    return [...available, ...unavailable];
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
          {!fromBag && !fromFavouriteCustomize && currentUser && currentUser.id !== "guest" && (
            <div
              className={`wishlist-btn ${isWishlisted ? "active" : ""}`}
              onClick={() => {
                if (fromBag || fromFavouriteCustomize) return;

                const bagItem = buildBagItem();

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

        <AnimatePresence mode="wait">
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
              <img
                src={dish?.image || "/assets/placeholder-food.jpg"}
                alt={dish?.name || "Make Your Own"}
                loading="eager"        // hero image
                decoding="async"
                draggable={false}
              />
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
              const disabled = isOutOfStock(ing); // ✅ CORRECT SCOPE

              return (
                <div
                  key={ing.id}
                  className={`ingredient-item 
    ${qty > 0 ? "selected" : ""} 
    ${disabled ? "disabled" : ""}
  `}
                  onClick={() => {
                    navigate(`/ingredient/${ing.id}`);
                  }}
                  role="button"
                >
                  <div className="ingredient-item-image" >
                    <img src={ing.image} alt="" loading="lazy" decoding="async" />
                  </div>

                  <div className="ingredient-item-name" >{ing.name}</div>

                  <div className="ingredient-item-price">
                    ₹{ing.pricePer100g}/100g
                  </div>

                  <div className="ingredient-modification">
                    <button
                      className="ingredient-minus"
                      disabled={disabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        !disabled && handleIngredientAdjust(ing.name, -STEP);
                      }}
                    >
                      -
                    </button>

                    <div className="ingredient-quantity">{qty}g</div>

                    <button
                      className="ingredient-plus"
                      disabled={disabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        !disabled && handleIngredientAdjust(ing.name, STEP);
                      }}
                    >
                      +
                    </button>
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
            <div
              className="notes-btn"
              onClick={() => setShowNotes(v => !v)}
            >
              <img src={notesIcon} alt="Notes" />
            </div>
          </div>

          <div className={`notes-wrapper ${showNotes ? "open" : ""}`}>
            <textarea
              className="notes-box"
              placeholder="Add preparation notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {previewItem.ingredients.map((ing) => {
            const master = safeIngredients.find(i => i.name === ing.name);
            const out =
              !master ||
              Number(master.stockRemaining || 0) * 1000 < STEP; // kg → g check

            return (
              <div
                className={`ingredient-item-calculation 
    ${out ? "out-of-stock" : ""}
    ${blinkIngredient === ing.name ? "blink" : ""}
  `}
                key={ing.name}
                onClick={() => {
                  const master = safeIngredients.find(i => i.name === ing.name);
                  if (master) navigate(`/ingredient/${master.id}`);
                }}
                role="button"
              >
                <div className="ingredient-item-image-calculation">
                  <img src={master?.image} alt="" />
                </div>

                <div className="ingredient-item-name-calculation">
                  {out ? <s>{ing.name}</s> : ing.name}
                </div>

                <div className="ingredient-item-quantity-calculation">
                  {ing.quantity}g
                </div>

                <div className="ingredient-item-price-calculation">
                  ₹{ing.totalPrice.toFixed(0)}
                </div>

                <div
                  className="ingredient-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    !out && handleIngredientAdjust(ing.name, -ing.quantity);
                  }}
                >
                  <img src={trash} alt="Trash" />
                </div>
              </div>
            );
          })}

        </div>

        <div className="bottom">
          <div className="price-section">
            <div className="price-label">Total Price</div>
            <div
              className={`food-item-total-amount ${pricePulse ? "price-pulse" : ""
                }`}
            >
              ₹{totalPrice.toFixed(0)}
            </div>
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
              const img = document.querySelector(".food-item-image img");
              const builtItem = buildBagItem();
              const item = {
                ...builtItem,
                isCustomized: builtItem.isCustomized === true,
                isFromFavourite: fromFavouriteCustomize === true
              };
              if (isEditMode) updateBagItem(bagIndex, item);
              else addToBag(item);

              flyToBag({
                imgEl: img,
                dishId: builtItem.id,
                customizationKey: builtItem.customizationKey || ""
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
