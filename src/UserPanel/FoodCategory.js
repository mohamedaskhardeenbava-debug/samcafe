import React from "react";
import { Link } from "react-router-dom";
import "./FoodCategory.css";

const FoodCategory = ({ foodData, currentUser }) => {
  const myFavourites = currentUser?.favourites || [];

  const othersFavourites = (foodData.favourites || []).filter(
    (fav) => !myFavourites.some((mf) => mf.id === fav.id)
  );

  const categoriesToRender = [];

  /* LOGGED-IN USER */
  if (currentUser) {
    categoriesToRender.push(
      {
        id: "my",
        name: "My Favourites",
        image: "/assets/category-assets/pizza.png",
        route: "/favourites/my"
      },
      {
        id: "others",
        name: "Crowd Picks",
        image: "/assets/category-assets/pizza.png",
        route: "/favourites/others"
      }
    );
  }

  /* GUEST USER */
  if (!currentUser) {
    categoriesToRender.push(
      {
        id: "my",
        name: "My Favourites",
        image: "/assets/category-assets/pizza.png",
        route: "/favourites/my"
      },
      {
        id: "others",
        name: "Crowd Picks",
        image: "/assets/category-assets/pizza.png",
        route: "/favourites/others"
      }
    );
  }

  /* COMBO */
  categoriesToRender.push({
    id: "combo",
    name: "Combos",
    image: "/assets/category-assets/pizza.png",
    route: "/combo"
  });

  /* NORMAL CATEGORIES */
  (foodData.categories || []).forEach((category) => {
    categoriesToRender.push({
      id: category.id,
      name: category.name,
      image: category.image,
      route: `/foods/${category.id}`
    });
  });

  return (
    <div className="food-category">
      <div className="food-category-container">
        {categoriesToRender.map((category) => (
          <Link
            key={category.id}
            to={category.route}
            className={`food-category-items
              ${category.id === "my" ? "my-favourites" : ""}
              ${category.id === "others" ? "crowd-picks" : ""}
              ${category.id === "combo" ? "combo-category" : ""}
            `}
          >
            <div className="food-category-image">
              <img src={category.image} alt={category.name} />
            </div>

            <div className="food-category-name">
              {category.name}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FoodCategory;
