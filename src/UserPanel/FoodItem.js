import "./FoodItem.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import trash from "../assets/icons/trash.png";


const STEP = 10;


const FoodItem = ({ handleBack, foodData }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);

  const [selectedSize, setSelectedSize] = useState("medium");

const SIZE_MULTIPLIERS = {
  small: 0.8,   // 20% cheaper
  medium: 1,    // base price
  large: 1.3    // 30% more expensive
};


  const { categoryId, dishId } = location.state || {};
  const [selectedOrder, setSelectedOrder] = useState([]);

  const [ingredientQuantities, setIngredientQuantities] = useState({});

  const category = foodData.categories.find(
    (cat) => cat.id === categoryId
  );

  const dish =
    dishId && category
      ? category.dishes.find((d) => d.id === dishId)
      : null;

  useEffect(() => {
    if (!category) return;

    const initial = {};

    foodData.ingredients.forEach((ing) => {
      if (ing.usedInCategories.includes(categoryId)) {
        initial[ing.name] = 0;
      }
    });

    if (dish && dish.ingredients) {
      dish.ingredients.forEach((ing) => {
        initial[ing.name] = ing.quantity ?? 0;
      });
    }
    const initialSelected =
      dish?.ingredients?.map((ing) => ing.name) || [];

    setSelectedOrder([...new Set(initialSelected)]);


    setIngredientQuantities(initial);
  }, [categoryId, dish, foodData.ingredients, category]);

  if (!category) return <p>Category not found</p>;

  const categoryIngredients = foodData.ingredients.filter(
    (ing) => ing.usedInCategories.includes(categoryId)
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

  const removeIngredient = (name) => {
    setIngredientQuantities((prev) => ({
      ...prev,
      [name]: 0
    }));

    setSelectedOrder((prev) => prev.filter((item) => item !== name));
  };


  const ingredientTotal = Object.entries(ingredientQuantities).reduce(
    (sum, [name, qty]) => {
      if (qty <= 0) return sum;

      const ing = foodData.ingredients.find(
        (i) => i.name === name
      );
      if (!ing) return sum;

      return sum + (ing.pricePer100g * qty) / 100;
    },
    0
  );

  const dishBasePrice = dish ? dish.basePrice : 0;

  const singleItemPrice =
  (dishBasePrice * SIZE_MULTIPLIERS[selectedSize]) +
  ingredientTotal;

const totalPrice = singleItemPrice * quantity;


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
        </div>

        {/* IMAGE */}

        <div
          className="food-item-image"
        >

          <img

            src={dish?.image || "/assets/placeholder-food.jpg"}
            alt={dish?.name || "Make Your Own"}

            draggable={false}
          />

        </div>

        <div className="size-selector">
  {["small", "medium", "large"].map((size) => (
    <button
      key={size}
      className={`size-button ${selectedSize === size ? "active" : ""}`}
      onClick={() => setSelectedSize(size)}
    >
      {size.charAt(0).toUpperCase() + size.slice(1)}
    </button>
  ))}
</div>
        <div className="ingredient-section">
          <div className="ingredients">All Ingredients</div>

          <div className="ingredient-list">
            {categoryIngredients.map((ing) => {
              const quantity = ingredientQuantities[ing.name] || 0;

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
                        setIngredientQuantities((prev) => ({
                          ...prev,
                          [ing.name]: Math.max(0, quantity - STEP)
                        }))
                      }
                    >
                      -
                    </button>

                    <div className="ingredient-quantity">
                      10g
                    </div>

                    <button
                      className="ingredient-plus"
                      onClick={() =>
                        setIngredientQuantities((prev) => {
                          const newQty = quantity + STEP;

                          if (quantity === 0) {
                            setSelectedOrder((order) =>
                              order.includes(ing.name) ? order : [...order, ing.name]
                            );
                          }


                          return {
                            ...prev,
                            [ing.name]: newQty
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
                    onClick={() => removeIngredient(name)}
                  >
                    <img src={trash} alt="Trash icon" />
                  </div>
                </div>
              );
            })}

        </div>
        {/* <div className="ingredient-item-calculation" key={name}>
                <div className="ingredient-item-image-calculation">
                  <img src="" alt="" />
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
                  onClick={() => removeIngredient(name)}
                >
                  <img src={trash} alt="Trash icon" />
                </div>
              </div> */}
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

          <Link className="food-place-order-button" to="/thank-you">
            Place Order
          </Link>
        </div>

      </div>
    </div>
  );
};

export default FoodItem;
