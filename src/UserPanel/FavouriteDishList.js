import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import api from "../api";
import "./FoodCategory.css";
import "./FavouriteDishList.css";
import homeIcon from "../assets/icons/home.png";

const FavouriteDishList = ({
  foodData,
  currentUser,
  handleBack,
  handleHome
}) => {
  const navigate = useNavigate();
  const { source, categoryId } = useParams();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dishToDelete, setDishToDelete] = useState(null);

  const isMyFavourites = source === "my";

  // 🔒 BLOCK GUEST ACCESS
  if (source === "my" && !currentUser) {
    return null;
  }

  const favourites =
    source === "my"
      ? currentUser?.favourites || []
      : foodData.favourites || [];

  const dishes = favourites.filter(
    (dish) => dish.categoryId === categoryId
  );

  const category = foodData.categories.find(
    (c) => c.id === categoryId
  );

  /* ---------------- DELETE LOGIC ---------------- */

  const confirmDeleteFavourite = async () => {
    if (!dishToDelete) return;

    try {
      if (currentUser) {
        const updatedFavourites =
          (currentUser.favourites || []).filter(
            (f) => f.id !== dishToDelete.id
          );

        const updatedUser = {
          ...currentUser,
          favourites: updatedFavourites
        };

        await api.put(`/users/${currentUser.id}`, updatedUser);

        // ✅ UPDATE STATE — NO RELOAD
        setDishToDelete(null);
        setShowDeleteConfirm(false);

        // force UI refresh safely
        currentUser.favourites = updatedFavourites;
      }
    } catch (err) {
      console.error("Failed to delete favourite", err);
      alert("Failed to remove favourite dish.");
    }
  };

  /* ---------------- RENDER ---------------- */

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

      {/* LIST */}
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
              className="food-category-items favourites-list"
              role="button"
              onClick={() =>
                navigate(`/favourites/${source}/dish/${dish.id}`, {
                  state: {
                    favouriteSnapshot: dish,
                    categoryId: dish.categoryId
                  }
                })
              }
            >
              <div className="food-category-image">
                <img src={dish.image} alt={dish.name} loading="lazy" decoding="async"/>
              </div>
              <div className="food-category-name">
                {dish.name}
                {dish.customerName && (
                  <div className="fav-customer-name">
                    By {dish.customerName}
                  </div>
                )}
              </div>

              {isMyFavourites && (
                <button
                  className="fav-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDishToDelete(dish);
                    setShowDeleteConfirm(true);
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* DELETE CONFIRM OVERLAY */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            className="confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="confirm-box"
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <h3>Remove Favourite</h3>
              <p>
                Are you sure you want to remove
                <strong> {dishToDelete?.name}</strong>?
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
                  onClick={confirmDeleteFavourite}
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FavouriteDishList;