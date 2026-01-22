import React from "react";
import { Link, useParams } from "react-router-dom";
import "./FoodCategory.css";
import "./FavouriteCategories.css";
import homeIcon from "../assets/icons/home.png";

const FavouriteCategories = ({
  foodData,
  currentUser,
  handleBack,
  handleHome
}) => {
  const { source } = useParams(); // "my" | "others"

  const guestFavourites =
    JSON.parse(localStorage.getItem("guestFavourites")) || [];

  const favourites =
    source === "my"
      ? currentUser
        ? currentUser.favourites || []
        : guestFavourites
      : foodData.favourites || [];

  const grouped = favourites.reduce((acc, dish) => {
    if (!dish.categoryId) return acc;
    acc[dish.categoryId] = acc[dish.categoryId] || [];
    acc[dish.categoryId].push(dish);
    return acc;
  }, {});

  const categories = Object.keys(grouped)
    .map((id) => foodData.categories.find((c) => c.id === id))
    .filter(Boolean);

  return (
    <div className="food-list fav-category-list">
      <div className="food-header">
        <button className="back-button" onClick={handleBack} />
        <div className="food-list-title">Favourites</div>
        <div className="home-btn" onClick={handleHome}>
          <img src={homeIcon} alt="" />
        </div>
      </div>

      <div className="food-category">
        <div className="food-category-container">
          {categories.length === 0 && (
            <p style={{ padding: "16px" }}>
              No favourite categories found.
            </p>
          )}

          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/favourites/${source}/${category.id}`}
              className="food-category-items favourites"
            >
              <div className="food-category-image">
                <img src={category.image} alt={category.name} />
              </div>
              <div className="food-category-name" style={{ color: "black" }}>
                {category.name}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FavouriteCategories;
