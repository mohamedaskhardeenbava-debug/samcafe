import "./FoodItem.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import trash from "../assets/icons/trash.png";
import mild from "../assets/icons/mild.png";
import hot from "../assets/icons/hot.png";
import extreme from "../assets/icons/extreme.png";

const STEP = 10;
const MAX_ADDITIONS = 2;
const MAX_QTY = STEP * MAX_ADDITIONS;

const SPICINESS_OPTIONS = [
  { id: "mild", name: "Mild", icon: mild },
  { id: "hot", name: "Hot", icon: hot },
  { id: "extreme", name: "Extreme", icon: extreme }
];


const FoodItem = ({ handleBack, foodData, updateBagItem, onToggleFavourite, addToBag }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [spiciness, setSpiciness] = useState("mild");
  const { fromBag, bagIndex, bagItem } = location.state || {};
const isEditMode = fromBag === true && typeof bagIndex === "number";
  const [selectedSize, setSelectedSize] = useState(null);
  const { categoryId, dishId } = location.state || {};
  const [selectedOrder, setSelectedOrder] = useState([]);
  const [ingredientQuantities, setIngredientQuantities] = useState({});
  const [hasCustomized, setHasCustomized] = useState(false);
  const [showFavForm, setShowFavForm] = useState(false);
  const [favName, setFavName] = useState("");
  const [favDescription, setFavDescription] = useState("");
  const [favCustomerName, setFavCustomerName] = useState("");
const [isWishlisted, setIsWishlisted] = useState(false);

  const category =
    foodData.categories.find(cat => cat.id === categoryId) ||
    foodData.categories.find(
      cat =>
        cat.id !== "favourites" &&
        cat.dishes.some(d => d.id === dishId)
    );

  const dish = isEditMode
    ? bagItem
    : category && dishId
      ? category.dishes.find(d => d.id === dishId)
      : null;

  /* EFFECTIVE DISH */
  const effectiveDish = isEditMode
    ? {
      ...bagItem,
      basePrice: bagItem.unitPrice, // single item price
    }
    : dish || {
      id: "__custom__",
      name: category ? `Make Your Own ${category.name}` : "Custom Dish",
      image: "/assets/placeholder-food.jpg",
      basePrice: 200,
      ingredients: []
    };

    const isCustomDish = effectiveDish?.id === "__custom__";

  /*  ORIGINAL CATEGORY*/
  const originalCategory =
    foodData.categories.find(
      cat =>
        cat.id !== "favourites" &&
        cat.dishes.some(d => d.id === dish?.id)
    ) || category;

  /* SIZE MULTIPLIER*/
  const selectedSizeObj =
    originalCategory?.sizes?.find(
      s => s.name.toLowerCase() === selectedSize
    ) || originalCategory?.sizes?.[0];

  const sizeMultiplier = Number(selectedSizeObj?.priceMultiplier ?? 1);
  const normalizedBasePrice =
    Number(effectiveDish.basePrice || 0) * sizeMultiplier;

  /* BUILD CUSTOMIZED DISH */
  const buildCustomizedDish = () => {
    const base = effectiveDish;

    const customId =
      base.id === "__custom__"
        ? `custom_${originalCategory.id}_${Date.now()}`
        : base.id;

    /* ---- quantities chosen by user ---- */
    const modifiedIngredients = (base.ingredients || [])
      .map(ing => {
        const qty =
          ingredientQuantities?.[ing.name] ??
          ing.quantity ??
          0;

        return {
          name: ing.name,
          quantity: qty
        };
      })
      .filter(ing => ing.quantity > 0);

    /* ---- RIGHT PANEL SNAPSHOT (PRICE FROM MASTER LIST) ---- */
    const finalIngredients = modifiedIngredients.map(ing => {
      const masterIng = foodData.ingredients.find(
        i => i.name === ing.name
      );

      const pricePer100g = Number(masterIng?.pricePer100g || 0);
      const totalPrice = Math.round(
        (pricePer100g * ing.quantity) / 100
      );

      return {
        name: ing.name,
        quantity: ing.quantity,
        pricePer100g,
        totalPrice
      };
    });

    const ingredientPrice = finalIngredients.reduce(
      (sum, ing) => sum + ing.totalPrice,
      0
    );

    const totalPrice = normalizedBasePrice + ingredientPrice;

    return {
      id: customId,
      customerName: favCustomerName || "",
      name: favName || base.name,
      description: favDescription || base.description,
      categoryId: originalCategory.id,
      image: base.image,

      ingredients: finalIngredients,
      basePrice: normalizedBasePrice,
      ingredientPrice,
      totalPrice,

      selectedSize,
      spiciness,
      isCustom: true
    };
  };

  const defaultIngredientQtyRef = useRef({});
  const effectiveDishId = effectiveDish?.id;
  const categoryIdStable = originalCategory?.id;

  //  INIT INGREDIENT STATE
  useEffect(() => {
    if (!effectiveDish || !originalCategory) return;

    if (isEditMode && bagItem) {
      const initial = {};
      const selected = [];

      foodData.ingredients.forEach((ing) => {
        const saved = bagItem.ingredients.find(
          (i) => i.name === ing.name
        );

        if (saved) {
          initial[ing.name] = saved.quantity;
          selected.push(ing.name);
        } else if (
          ing.usedInCategories.includes(originalCategory.id)
        ) {
          initial[ing.name] = 0;
        }
      });

      setIngredientQuantities(initial);
      setSelectedOrder(selected);
      setQuantity(Number(bagItem.quantity) || 1);
      setSelectedSize(bagItem.selectedSize);
      setSpiciness(bagItem.spiciness);

      if (!defaultIngredientQtyRef.current[effectiveDish.id]) {
        const defaults = {};
        bagItem.ingredients.forEach((ing) => {
          defaults[ing.name] = ing.quantity || 0;
        });
        defaultIngredientQtyRef.current[effectiveDish.id] = defaults;
      }

      return;
    }

    const initial = {};
    const selected = [];

    foodData.ingredients.forEach((ing) => {
      if (ing.usedInCategories.includes(originalCategory.id)) {
        initial[ing.name] = 0;
      }
    });

    effectiveDish.ingredients.forEach((ing) => {
      initial[ing.name] = ing.quantity ?? 0;
      selected.push(ing.name);
    });

    setIngredientQuantities(initial);
    setSelectedOrder(selected);

    if (!defaultIngredientQtyRef.current[effectiveDish.id]) {
      const defaults = {};
      effectiveDish.ingredients.forEach((ing) => {
        defaults[ing.name] = ing.quantity || 0;
      });
      defaultIngredientQtyRef.current[effectiveDish.id] = defaults;
    }
  }, [
    effectiveDishId,
    categoryIdStable,
    isEditMode,
    bagItem?.id,
    foodData.ingredients.length
  ]
  );

  useEffect(() => {
  if (!effectiveDish) return;

  // 🔥 DO NOT override local state for Make Your Own
  if (isCustomDish && isWishlisted) return;

  const exists = foodData.favourites.some(
    f => f.id === effectiveDish.id
  );

  setIsWishlisted(exists);
}, [
  effectiveDish?.id,
  foodData.favourites,
  isCustomDish,
  isWishlisted
]);

  useEffect(() => {
    if (!originalCategory?.sizes?.length) return;
    setSelectedSize(originalCategory.sizes[0].name.toLowerCase());
  }, [originalCategory]);

  useEffect(() => {
    if (isEditMode) {
      setShowFavForm(false);
    }
  }, [isEditMode]);

  if (!category) return <p>Category not found</p>;

  const categoryIngredients = foodData.ingredients.filter(
    (ing) =>
      originalCategory &&
      ing.usedInCategories.includes(originalCategory.id)
  );

  const increaseQty = () => {
    setQuantity((q) => q + 1);
  };

  const decreaseQty = () => {
    setQuantity((q) => (q > 1 ? q - 1 : 1));
  };

  const handleIngredientClick = (ingredientId) => {
    navigate(`/ingredient/${ingredientId}`, {
      state: { ingredientId }
    });
  };

  const handleRemoveIngredient = (name) => {
    setIngredientQuantities(prev => ({
      ...prev,
      [name]: defaultIngredientQtyRef.current[effectiveDish.id]?.[name] || 0
    }));

    setSelectedOrder(prev =>
      prev.filter(n => n !== name)
    );
  };

  const ingredientTotal = Object.entries(ingredientQuantities).reduce(
    (sum, [name, qty]) => {
      const defaultQty =
        defaultIngredientQtyRef.current[effectiveDish.id]?.[name] || 0;

      const deltaQty = qty - defaultQty;

      if (deltaQty <= 0) return sum;

      const ing = foodData.ingredients.find(
        (i) => i.name === name
      );

      if (!ing?.pricePer100g) return sum;

      return sum + (ing.pricePer100g * deltaQty) / 100;
    },
    0
  );

  const safeQuantity = Number(quantity || 1);

  const singleItemPrice =
    normalizedBasePrice + Number(ingredientTotal || 0);

  const totalPrice = singleItemPrice * safeQuantity;

  const unitPrice = isEditMode
    ? Number(bagItem.unitPrice)
    : Number(normalizedBasePrice + ingredientTotal);

  const isCustomized =
    effectiveDish.id === "__custom__" ||
    Object.entries(ingredientQuantities).some(([name, qty]) => {
      const originalQty =
        effectiveDish.ingredients.find((i) => i.name === name)?.quantity ?? 0;
      return qty !== originalQty;
    });

  const baseName =
    effectiveDish.id === "__custom__"
      ? category.name
      : effectiveDish.name.replace(/^Customized\s+/i, "");

  let displayName = baseName;

  if (effectiveDish.id === "__custom__" || hasCustomized) {
    displayName = `Customized ${baseName}`;
  }

  const customizedDish = buildCustomizedDish();

  const buildBagItem = () => {
  const ingredients = Object.entries(ingredientQuantities)
    .filter(([_, qty]) => qty > 0)
    .map(([name, qty]) => {
      const master = foodData.ingredients.find(i => i.name === name);
      const pricePer100g = Number(master?.pricePer100g || 0);
      const totalPrice = Math.round((pricePer100g * qty) / 100);

      return {
        name,
        quantity: qty,
        pricePer100g,
        totalPrice
      };
    });

  const ingredientPrice = ingredients.reduce(
    (s, i) => s + i.totalPrice,
    0
  );

  const unitPrice = Math.round(
    normalizedBasePrice + ingredientPrice
  );

  return {
    id: effectiveDish.id,
    name: favName || effectiveDish.name,
    image: effectiveDish.image,
    categoryId: originalCategory.id,

    quantity: Number(quantity || 1),
    unitPrice,
    totalPrice: unitPrice * Number(quantity || 1),

    selectedSize,
    spiciness,
    ingredients
  };
};


  const shouldShowWishlist =
    effectiveDish.id === "__custom__" ||
    Object.values(ingredientQuantities).some((qty) => qty > 0);

  return (
    <div className="food-item">
      {/* LEFT PANEL */}
      <div className="left-panel">
        <div className="fooditem-header">
          <button className="back-button" onClick={handleBack} />
          <div className="food-item-name">
            {dish
              ? `${dish.name}`
              : `Make Your Own ${category.name}`}
          </div>
          {shouldShowWishlist && (
            <div
  className={`wishlist-btn ${isWishlisted ? "active" : ""}`}
  onClick={() => {
    if (isWishlisted) {
      onToggleFavourite(effectiveDish);
      setIsWishlisted(false);
      return;
    }

    setFavCustomerName("");
    setFavName(displayName);
    setFavDescription("");
    setShowFavForm(true);
  }}
>
  ♥
</div>

          )}

        </div>

        {/* IMAGE */}

        <div className="image-header">
          <div className="image-header-left">
            <div
              className="food-item-image"
            >

              <img
                src={dish?.image || "/assets/placeholder-food.jpg"}
                alt={dish?.name || "Make Your Own"}
                draggable={false}
              />

            </div>
          </div>

          <div className="image-header-right">
            {selectedSizeObj &&
              <div className="size-selector">
                <div>Sizes</div>

                <div className="size-selector-container">
                  {originalCategory?.sizes?.map((size) => (
                    <div
                      key={size.name}
                      className={`size-selector-item ${selectedSize === size.name ? "active" : ""
                        }`}
                      onClick={() => {
                        console.log("SIZE CLICKED:", size.name.toLowerCase());
                        setSelectedSize(size.name.toLowerCase());
                      }}
                      role="button"
                    >
                      <span className="size-tick" />
                      <div className="size-selector-item-name">
                        {size.name.charAt(0).toUpperCase() + size.name.slice(1)}
                      </div>
                      <div className="size-selector-item-description">
                        {size.description}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            }

            <div className="hot-selector">
              <div>Spiciness</div>
              <div className="hot-selector-container">
                {SPICINESS_OPTIONS.map((option) => (
                  <div
                    key={option.id}
                    className={`hot-selector-icon ${spiciness === option.id ? "active" : ""
                      }`}
                    onClick={() => setSpiciness(option.id)}
                    role="button"
                  >
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
            {categoryIngredients.map((ing) => {
              const quantity = ingredientQuantities[ing.name] || 0;
              const baseQty = effectiveDish.ingredients.find(i => i.name === ing.name)?.quantity ?? 0;

              return (
                <div className="ingredient-item" key={ing.id}>
                  <div
                    className="ingredient-item-image"
                    onClick={() => handleIngredientClick(ing.id)}
                  >
                    <img src={ing.image} alt="" />
                  </div>

                  <div
                    className="ingredient-item-name"
                    onClick={() => handleIngredientClick(ing.id)}
                  >
                    {ing.name}
                  </div>

                  <div className="ingredient-item-price">
                    ₹{ing.pricePer100g}/100g
                  </div>

                  <div className="ingredient-modification">
                    <button
                      className="ingredient-minus"
                      onClick={() =>
                        setIngredientQuantities((prev) => {
                          setHasCustomized(true);

                          const currentQty = Number(prev[ing.name] || 0);
                          const newQty = Math.max(0, currentQty - STEP);

                          return {
                            ...prev,
                            [ing.name]: newQty
                          };
                        })
                      }
                    >
                      -
                    </button>

                    <div className="ingredient-quantity">
                      {ingredientQuantities[ing.name] || 0}g
                    </div>

                    <button
                      className="ingredient-plus"
                      onClick={() =>
                        setIngredientQuantities((prev) => {
                          setHasCustomized(true);

                          const currentQty = Number(prev[ing.name] || 0);
                          const maxQty = baseQty + STEP * 2;

                          if (currentQty >= maxQty) return prev; // block only after 2 adds

                          if (currentQty === 0) {
                            setSelectedOrder((order) =>
                              order.includes(ing.name) ? order : [...order, ing.name]
                            );
                          }

                          return {
                            ...prev,
                            [ing.name]: currentQty + STEP
                          };
                        })
                      }
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
          </div>

          {selectedOrder
            .filter((name) => ingredientQuantities[name] > 0)
            .map((name) => {

              const qty = ingredientQuantities[name];
              if (qty <= 0) return null;

              const ing = foodData.ingredients.find(
                (i) => i.name === name
              );
              if (!ing) return null;

              const price = (ing.pricePer100g * qty) / 100;

              return (
                <div className="ingredient-item-calculation" key={name}>
                  <div className="ingredient-item-image-calculation">
                    <img src={ing.image} alt={name} />
                  </div>

                  <div className="ingredient-item-name-calculation">
                    {name}
                  </div>

                  <div className="ingredient-item-quantity-calculation">
                    {qty}g
                  </div>

                  <div className="ingredient-item-price-calculation">
                    ₹{price.toFixed(0)}
                  </div>

                  <div
                    className="ingredient-delete"
                    onClick={() => handleRemoveIngredient(name)}
                  >
                    <img src={trash} alt="Trash icon" />
                  </div>
                </div>
              );
            })}

        </div>
        <div className="bottom">
          <div className="price-section">
            <div className="price-label">Total Price</div>
            <div className="food-item-total-amount">
              ₹{totalPrice.toFixed(0)}
            </div>
          </div>

          {/* Quantity Section */}
          <div className="quantity-section">
            <div className="quantity-label">Quantity</div>

            <div className="quantity-controls">
              <button
                className="qty-btn"
                onClick={decreaseQty}
                disabled={quantity === 1}
              >
                -
              </button>

              <div className="qty-value">{quantity}x</div>

              <button className="qty-btn" onClick={increaseQty}>
                +
              </button>
            </div>
          </div>

          {showFavForm && (
            <div className="fav-confirm-overlay">
              <div className="fav-confirm-box">
                <h3>Save to Favourites</h3>

                <input
                  type="text"
                  placeholder="Customer name"
                  value={favCustomerName}
                  onChange={(e) => setFavCustomerName(e.target.value)}
                />

                <input
                  type="text"
                  placeholder="Dish name"
                  value={favName}
                  onChange={(e) => setFavName(e.target.value)}
                />

                <textarea
                  placeholder="Description"
                  value={favDescription}
                  onChange={(e) => setFavDescription(e.target.value)}
                />

                <div className="fav-confirm-actions">
                  <button
                    className="fav-confirm-cancel"
                    onClick={() => setShowFavForm(false)}
                  >
                    Cancel
                  </button>

                  <button
                    className="fav-confirm-yes"
                    onClick={() => {
                      const favDish = {
                        ...buildCustomizedDish(),
                        customerName: favCustomerName,
                        name: favName,
                        description: favDescription
                      };

                      onToggleFavourite(favDish);
                      setIsWishlisted(true);
                      setShowFavForm(false);
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
  className="food-place-order-button"
  onClick={() => {
    const item = buildBagItem();

    if (isEditMode) {
      updateBagItem(bagIndex, item); // ✅ replace
    } else {
      addToBag(item); // ✅ add
    }

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
