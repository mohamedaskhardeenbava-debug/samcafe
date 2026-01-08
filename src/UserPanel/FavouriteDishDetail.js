import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./FavouriteDishDetail.css";

const FavouriteDishDetail = ({ foodData, addToBag }) => {
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
            onClick={() => navigate(-1)}
          />
          <div className="food-list-title">
            Dish not found
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
          onClick={() => navigate(-1)}
        />
        <div className="food-list-title">
          {dish.name}
        </div>
      </div>

      <div className="fav-detail-container">
        {/* LEFT PANEL */}
        <div className="fav-left">
          <img
            src={dish.image}
            alt={dish.name}
            className="fav-image"
          />

          <h2 className="fav-title">{dish.name}</h2>

          <div className="fav-price">
            ₹{dish.totalPrice}
          </div>

          {dish.description && (
            <p className="fav-description">
              {dish.description}
            </p>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="fav-right">
          <h4>Ingredients</h4>
          <ul className="fav-ingredients">
            {dish.ingredients.map((ing) => (
              <li key={ing.name}>
                {ing.name} – {ing.quantity}g
              </li>
            ))}
          </ul>

          {dish.benefits && (
            <>
              <h4>Nutritional Benefits</h4>
              <ul className="fav-benefits">
                {Object.entries(dish.benefits).map(
                  ([key, value]) => (
                    <li key={key}>
                      {key}: {value}
                    </li>
                  )
                )}
              </ul>
            </>
          )}

          {/* ACTIONS */}
          <div className="fav-actions">
            <button
              className="fav-add-btn"
              onClick={() => {
                addToBag({
  ...dish,
  quantity: 1,
  unitPrice: dish.totalPrice, // 🔥 normalize
  totalPrice: dish.totalPrice
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
                    fromFavourite: true,
                    dishSnapshot: dish,
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
