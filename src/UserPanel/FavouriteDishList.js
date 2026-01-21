import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./FoodCategory.css"; // reuse SAME css
import "./FavouriteDishList.css";
import homeIcon from "../assets/icons/home.png";

const FavouriteDishList = ({ foodData, handleBack, handleHome }) => {
  const { categoryId } = useParams();
  const navigate = useNavigate();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteDishId, setDeleteDishId] = useState(null);

  const category = foodData.categories.find(
    (c) => c.id === categoryId
  );

  const dishes = foodData.favourites.filter(
    (d) => d.categoryId === categoryId
  );

  /* DELETE HANDLERS */
  const handleDeleteClick = (dishId) => {
    setDeleteDishId(dishId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
  const updatedFavourites = foodData.favourites.filter(
    (f) => f.id !== deleteDishId
  );

  foodData.setFoodData((prev) => ({
    ...prev,
    favourites: updatedFavourites
  }));

  setShowDeleteConfirm(false);
  setDeleteDishId(null);
};


  return (
    <div className="food-list fav-dish-page">
      {/* HEADER */}
      <div className="food-header">
        <button className="back-button" onClick={handleBack} />
        <div className="food-list-title">
          {category?.name || "Favourites"}
        </div>
        <div className="home-btn" onClick={handleHome}>
          <img src={homeIcon} alt="" />
        </div>
      </div>

      <div className="food-category">
        <div className="food-category-container">
          {dishes.length === 0 && (
            <p style={{ padding: "16px" }}>
              No favourite dishes in this category.
            </p>
          )}

          {dishes.map((dish) => (
            <div
              key={dish.id}
              className="food-category-items favourites"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/favourite/${dish.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  navigate(`/favourite/${dish.id}`);
                }
              }}
            >
              <div className="food-category-image">
                <img src={dish.image} alt={dish.name} />
              </div>

              <div
                className="food-category-name"
                style={{ color: "black" }}
              >
                {dish.name}
              </div>

              {/* DELETE BUTTON */}
              <button
                className="fav-delete-btn"
                onClick={(e) => {
                  e.stopPropagation(); // 🔥 critical
                  handleDeleteClick(dish.id);
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* DELETE CONFIRM OVERLAY */}
      {showDeleteConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <h3>Remove Favourite</h3>
            <p>
              Are you sure you want to remove this favourite dish?
            </p>
            <div className="confirm-actions">
              <button
                className="confirm-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="confirm-remove"
                onClick={confirmDelete}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FavouriteDishList;
