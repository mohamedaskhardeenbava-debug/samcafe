import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import "./FoodCategory.css";
import "./FavouriteDishList.css";
import PageHeader from "./shared/PageHeader";
import Button3D from "./shared/Button3D";
import ConfirmDialog from "./shared/ConfirmDialog";
<<<<<<< HEAD
=======
import { useToast } from "../components/Usetoast";
>>>>>>> 656ff502cab1f2fdbb0bf4277e7fcba04fabeae8

const FavouriteDishList = ({
  foodData,
  currentUser,
  setCurrentUser,
  handleBack,
  handleHome
}) => {
  const navigate = useNavigate();
  const { source, categoryId } = useParams();
  const { toast } = useToast();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dishToDelete, setDishToDelete] = useState(null);

  const isMyFavourites = source === "my";

  // BLOCK GUEST ACCESS
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

  const findCategoryOrSubCategory = (id) => {
    for (const cat of foodData.categories) {
      if (cat.id === id) return cat;
      const sub = (cat.subCategories || []).find((s) => s.id === id);
      if (sub) return sub;
    }
    return null;
  };

  const category = findCategoryOrSubCategory(categoryId);

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

        // Re-fetch the user from the server so we always have the
        // authoritative copy — avoids stale-closure overwrites from
        // any concurrent socket data-change events.
        const refreshed = await api.get(`/users/${currentUser.id}`);
        setCurrentUser(refreshed.data);

        // Clear dialog state only after state is committed
        setShowDeleteConfirm(false);
        setDishToDelete(null);
      }
    } catch (err) {
      console.error("Failed to delete favourite", err);
      toast.error("Failed to remove favourite dish.");
      setShowDeleteConfirm(false);
      setDishToDelete(null);
    }
  };

  /* ---------------- RENDER ---------------- */

  return (
    <div className="food-list fav-dish-page">
      {/* HEADER */}
      <PageHeader
        title={category?.name || "Favourites"}
        wrapperClassName="food-header"
        titleClassName="food-list-title"
        onBack={handleBack}
        onHome={handleHome}
      />

      {/* LIST */}
      <div className="food-category" style={{ padding: "0px" }}>
        <div className="food-category-container">
          {dishes.length === 0 && (
            <p style={{ padding: "16px" }}>
              No favourite dishes in this category.
            </p>
          )}

          {dishes.map((dish) => (
            <div
              key={dish.id}
              className="food-category-items"
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
                <img src={dish.image} alt={dish.name} loading="lazy" decoding="async" />
              </div>
              <div className="food-category-name">
                {dish.name}
              </div>

              {dish.customerName && (
                <div className="fav-customer-name">
                  By {dish.customerName}
                </div>
              )}

              {isMyFavourites && (
                <Button3D
                  className="btn-3d red"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDishToDelete(dish);
                    setShowDeleteConfirm(true);
                  }}
                >
                  Delete
                </Button3D>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* DELETE CONFIRM OVERLAY */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Remove Favourite"
        message={<>Are you sure you want to remove <strong>{dishToDelete?.name}</strong>?</>}
        onConfirm={confirmDeleteFavourite}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};

export default FavouriteDishList;
