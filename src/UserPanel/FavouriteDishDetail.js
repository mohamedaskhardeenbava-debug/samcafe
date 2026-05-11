import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./FavouriteDishDetail.css";
import caloriesIcon from "../assets/icons/calorie.png";
import proteinIcon from "../assets/icons/protein.png";
import fibreIcon from "../assets/icons/fiber.png";
import fatIcon from "../assets/icons/fat.png";
import homeIcon from "../assets/icons/home.png";
import { flyToBag } from "./flyToBag";

const FavouriteDishDetail = ({ foodData, addToBag, handleBack, handleHome, currentUser }) => {
  const { dishId, source } = useParams();
  const navigate = useNavigate();

  // 🔒 Only block "my" favourites for guests
  if (source === "my" && !currentUser) {
    return null;
  }

  const dish =
    source === "my"
      ? currentUser?.favourites?.find((d) => d.id === dishId)
      : foodData.favourites?.find((d) => d.id === dishId);

  if (!dish) {
    return (
      <div className="food-list">
        <div className="food-header">
          <button
            className="back-button"
            onClick={handleBack}
          />
          <div className="food-list-title">
            Dish not found
          </div>
          <div className="home-btn  home-btn-icon" onClick={handleHome} />
        </div>
      </div>
    );
  }

  return (
    <div className="food-list">
      {/* HEADER – same as FoodList */}
      <div className="food-header">
        <button
          className="back-button"
          onClick={handleBack}
        />
        <h2 className="fav-title">{dish.name}</h2>
        <div className="home-btn  home-btn-icon" onClick={handleHome} />
      </div>

      <div className="fav-detail-container">
        {/* LEFT PANEL */}
        <div className="fav-left">
          <div className="fav-image-container">
            <img
              src={dish.image}
              alt={dish.name}
              className="fav-image"
              data-fav-dish-id={dish.id}
            />
          </div>

          <div className="fav-name-header">
            <h2 className="fav-title">{dish.name}</h2>

            <div className="fav-price">
              ₹{Math.round(dish.totalPrice)}
            </div>
          </div>

          {dish.customerName && (
            <div className="fav-customer-name">
              Saved by {dish.customerName}
            </div>
          )}

          {dish.description && (
            <p className="fav-description">
              {dish.description}
            </p>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="fav-right">
          <div className="fav-ingredient-container">
            <h4>Add-ons</h4>
            <ul className="fav-ingredients-grid">
              {(dish.ingredients || [])
                .filter((ing) => {
                  const full = foodData.ingredients.find(i => i.id === ing.id);

                  if (!full) return true;

                  const isGloballyDisabled = full.isDisabledGlobally === true;
                  const isDisabledForDish =
                    Array.isArray(full.disabledForDishes) &&
                    full.disabledForDishes.includes(dish.id);

                  if (isGloballyDisabled) return false;
                  if (isDisabledForDish) return false;

                  return true;
                })
                .map((ing) => (
                  <li key={ing.name} className="fav-ingredient-item" onClick={() => {
                    navigate(`/ingredient/${ing.id}`);
                  }}>
                    <div className="fav-ingredient-img" />
                    <div className="fav-ingredient-info">
                      <div className="fav-ingredient-name">{ing.name}</div>
                      <div className="fav-ingredient-qty">{ing.quantity} g</div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>


          {dish.benefits && (
            <div className="fav-nutrition-container">
              <h4>Nutritional Benefits</h4>
              <div className="fav-nutrition">

                {[
                  [caloriesIcon, "Calories", dish.benefits?.calories, "kcal"],
                  [proteinIcon, "Protein", dish.benefits?.protein, "g"],
                  [fibreIcon, "Fibre", dish.benefits?.fibre, "g"],
                  [fatIcon, "Fat", dish.benefits?.fat, "g"]
                ]
                  .filter(([_, __, value]) => value !== undefined)
                  .map(([icon, label, value, unit]) => (
                    <div className="fav-nutrition-item" key={label}>
                      <div className="fav-nutrition-image">
                        <img src={icon} alt={label} />
                      </div>

                      <div className="fav-nutrition-value">
                        {value} {unit}
                      </div>

                      <div className="fav-nutrition-name">
                        {label}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}


          {/* ACTIONS */}
          <div className="fav-actions">
            <button
              className="fav-customize-btn"
              onClick={() =>
                navigate(`/food/${dish.id}`, {
                  state: {
                    fromFavouriteCustomize: true,
                    favouriteSnapshot: dish, // ✅ PASS FULL DATA
                    categoryId: dish.categoryId,
                    dishId: dish.id
                  }
                })
              }
            >
              Customize
            </button>

            <button
              className="fav-add-btn"
              onClick={() => {
                const img = document.querySelector(
                  `.fav-image[data-fav-dish-id="${dish.id}"]`
                );

                addToBag({
                  ...dish,                 // favourite snapshot
                  quantity: 1,
                  unitPrice: dish.totalPrice,
                  totalPrice: dish.totalPrice,

                  // IMPORTANT FLAGS
                  isCustomized: false,     // favourites are already finalized
                  isFromFavourite: true    // critical to prevent "Customized" prefix
                });
                flyToBag({
                  imgEl: img,
                  dishId: dish.id
                });
              }}
            >
              Add to Bag
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FavouriteDishDetail;
