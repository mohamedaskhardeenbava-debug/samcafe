import React from "react";
import { useParams, Link } from "react-router-dom";
import "./FoodCategory.css"; // 🔥 reuse SAME css

const FavouriteDishList = ({ foodData, handleBack }) => {
  const { categoryId } = useParams();

  const category = foodData.categories.find(
    (c) => c.id === categoryId
  );

  const dishes = foodData.favourites.filter(
    (d) => d.categoryId === categoryId
  );

  return (
    <div className="food-list">
      {/* SAME HEADER */}
      <div className="food-header">
        <button className="back-button" onClick={handleBack} />
        <div className="food-list-title">
          {category?.name || "Favourites"}
        </div>
      </div>

      <div className="food-category">
        <div className="food-category-container">
          {dishes.map((dish) => (
            <Link
              key={dish.id}
              to={`/favourite/${dish.id}`}
              className="food-category-items favourites"
            >
              <div className="food-category-image">
                <img src={dish.image} alt={dish.name} />
              </div>
              <div className="food-category-name">
                {dish.name}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FavouriteDishList;
