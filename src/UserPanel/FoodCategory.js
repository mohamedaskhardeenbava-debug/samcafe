import React from "react";
import "./FoodCategory.css";
import { Link } from "react-router-dom";

const FoodCategory = ({ foodData }) => {
  const categoriesToRender = [
    {
      id: "favourites",
      name: "Favourites",
      image: "/assets/category-assets/pizza.png",
      dishes: foodData.favourites || []
    },
    {
      id: "combo",
      name: "Combos",
      image: "/assets/category-assets/pizza.png",
      dishes: [] // handled by ComboPage
    },
    ...(foodData.categories || [])
  ];

  return (
    <div className="food-category">
      <div className="food-category-container">
        {categoriesToRender.map((category) => {
          const isFavouriteCategory = category.id === "favourites";

          return (
            <Link
              key={category.id}
              className={`food-category-items ${isFavouriteCategory ? "favourites" : ""}`} to={
                category.id === "favourites"
                  ? "/favourites"
                  : category.id === "combo"
                    ? "/combo"
                    : `/foods/${category.id}`
              }
            >
              <div className="food-category-image">
                <img src={category.image} alt={category.name} />
              </div>
              <div className="food-category-name" >{category.name}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default FoodCategory;
