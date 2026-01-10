import React from "react";
import { Link } from "react-router-dom";
import "./FoodCategory.css"; // 🔥 reuse SAME css

const FavouriteCategories = ({ foodData, handleBack }) => {
  const grouped = foodData.favourites.reduce((acc, dish) => {
    acc[dish.categoryId] = acc[dish.categoryId] || [];
    acc[dish.categoryId].push(dish);
    return acc;
  }, {});

  const categories = Object.keys(grouped)
    .map((id) => foodData.categories.find((c) => c.id === id))
    .filter(Boolean);

  return (
    <div className="food-list">
      {/* SAME HEADER AS FoodList */}
      <div className="food-header">
        <button className="back-button" onClick={handleBack} />
        <div className="food-list-title">Favourites</div>
      </div>

      <div className="food-category">
        <div className="food-category-container">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/favourites/${category.id}`}
              className="food-category-items favourites"
            >
              <div className="food-category-image">
                <img src={category.image} alt={category.name} />
              </div>
              <div className="food-category-name" style={{color:"black"}}>
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
