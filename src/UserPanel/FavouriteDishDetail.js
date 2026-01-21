import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./FavouriteDishDetail.css";
import caloriesIcon from "../assets/icons/calorie.png";
import proteinIcon from "../assets/icons/protein.png";
import fibreIcon from "../assets/icons/fiber.png";
import fatIcon from "../assets/icons/fat.png";
import homeIcon from "../assets/icons/home.png";

const FavouriteDishDetail = ({ foodData, addToBag, handleBack, handleHome }) => {
  const { dishId } = useParams();
  const navigate = useNavigate();

  const dish = foodData.favourites?.find(
    (d) => d.id === dishId
  );

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
          <div className="home-btn" onClick={handleHome}>
            <img src={homeIcon} alt="" />
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
        <div className="food-list-title">
          {dish.name}
        </div>
        <div className="home-btn" onClick={handleHome}>
          <img src={homeIcon} alt="" />
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
            />
          </div>

          <div className="fav-name-header">
            <h2 className="fav-title">{dish.name}</h2>

            <div className="fav-price">
              ₹{Math.round(dish.totalPrice)}
            </div>
          </div>

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
              {dish.ingredients.map((ing) => (
                <li key={ing.name} className="fav-ingredient-item">
                  <div className="fav-ingredient-img">
                    <img
                      src=""
                      alt=""
                    />
                  </div>

                  <div className="fav-ingredient-info">
                    <div className="fav-ingredient-name">
                      {ing.name}
                    </div>
                    <div className="fav-ingredient-qty">
                      {ing.quantity} g
                    </div>
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
              className="fav-add-btn"
              onClick={() => {
                addToBag({
                  ...dish,                 // favourite snapshot
                  quantity: 1,
                  unitPrice: dish.totalPrice,
                  totalPrice: dish.totalPrice,

                  // IMPORTANT FLAGS
                  isCustomized: false,     // favourites are already finalized
                  isFromFavourite: true    // critical to prevent "Customized" prefix
                });
                navigate("/thank-you");
              }}
            >
              Add to Bag
            </button>

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
          </div>
        </div>
      </div>
    </div>
  );
};

export default FavouriteDishDetail;
