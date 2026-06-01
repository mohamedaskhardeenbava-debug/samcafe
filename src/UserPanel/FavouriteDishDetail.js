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

  // ── Resolve dish ────────────────────────────────────────────────────────
  // "my"     → look in currentUser.favourites
  // "others" → look in foodData.favourites first, then scan all categories
  //            (crowd-picks / promo navigation sends dishes that may only
  //             exist in the menu, not yet in the favourites collection)
  let dish = null;

  if (source === "my") {
    dish = currentUser?.favourites?.find((d) => d.id === dishId) || null;
  } else {
    // 1. Check shared favourites list
    dish = foodData.favourites?.find((d) => d.id === dishId) || null;

    // 2. Fall back: scan all categories + subCategories
    if (!dish) {
      for (const cat of foodData.categories || []) {
        const found = cat.dishes?.find(d => d.id === dishId);
        if (found) { dish = { ...found, categoryId: cat.id }; break; }
        for (const sub of cat.subCategories || []) {
          const foundSub = sub.dishes?.find(d => d.id === dishId);
          if (foundSub) { dish = { ...foundSub, categoryId: cat.id }; break; }
        }
        if (dish) break;
      }
    }
  }

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
          <div className="home-btn  home-btn-icon" onClick={handleHome} >
            <span className="shadow"></span>
            <span className="edge"></span>
            <span className="front"><img src={homeIcon} alt="home-btn" /></span>
          </div>
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
        <div className="home-btn  home-btn-icon" onClick={handleHome}>
          <span className="shadow"></span>
          <span className="edge"></span>
          <span className="front"><img src={homeIcon} alt="home-btn" /></span>
        </div>
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
              ₹{Math.round(dish.totalPrice ?? dish.basePrice ?? 0)}
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
              className="customize-button"
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
              <span className="shadow"></span>
              <span className="edge"></span>
              <span className="front">Customize</span>
            </button>

            <button
              className="place-order-button"
              onClick={() => {
                const img = document.querySelector(
                  `.fav-image[data-fav-dish-id="${dish.id}"]`
                );

                const price = dish.totalPrice ?? dish.basePrice ?? 0;
                addToBag({
                  ...dish,
                  quantity: 1,
                  unitPrice: price,
                  totalPrice: price,
                  isCustomized: false,
                  isFromFavourite: true
                });
                flyToBag({
                  imgEl: img,
                  dishId: dish.id
                });
              }}
            >
              <span className="shadow"></span>
              <span className="edge"></span>
              <span className="front">Add to Bag</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FavouriteDishDetail;