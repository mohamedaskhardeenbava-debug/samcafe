import "./WishlistButton.css";

/**
 * WishlistButton
 * ---------------
 * Lightweight heart toggle for use on food list / grid / expanded pages
 * where a full "name your custom dish" form isn't needed — clicking simply
 * adds or removes the dish (as-is, base size) from currentUser.favourites.
 *
 * Reuses the same favourite id convention as FoodItem.js's simple wishlist
 * toggle (`${dishId}_regular`) so a dish favourited from a list page shows
 * as already-wishlisted if opened in FoodItem, and vice versa.
 *
 * Props:
 *  - dish: the dish object (id, name, image, basePrice, description...)
 *  - categoryId: id of the category/subCategory the dish belongs to
 *  - currentUser: current user object (or null/guest)
 *  - onToggleFavourite: (dish) => void — from App.js
 *  - size: "sm" | "md" — visual size, defaults to "sm"
 *  - className: extra classes for positioning within a card
 */
const WishlistButton = ({
  dish,
  categoryId,
  currentUser,
  onToggleFavourite,
  size = "sm",
  className = "",
}) => {
  if (!dish || !onToggleFavourite) return null;

  const favouriteId = `${dish.id}_regular`;
  const favourites = currentUser?.favourites || [];
  const isWishlisted = favourites.some((f) => f.id === favouriteId);

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (isWishlisted) {
      onToggleFavourite({ id: favouriteId, _remove: true });
      return;
    }

    onToggleFavourite({
      id: favouriteId,
      originalDishId: dish.id,
      name: dish.name,
      description: dish.description || "",
      image: dish.image,
      categoryId: categoryId || dish.categoryId,
      selectedSize: "regular",
      basePrice: dish.basePrice,
      totalPrice: dish.basePrice,
      ingredients: dish.ingredients || [],
      benefits: dish.benefits || {},
    });
  };

  return (
    <button
      type="button"
      className={`wishlist-toggle-btn wishlist-toggle-btn--${size} ${isWishlisted ? "active" : ""} ${className}`}
      onClick={handleClick}
      aria-label={isWishlisted ? `Remove ${dish.name} from wishlist` : `Add ${dish.name} to wishlist`}
      aria-pressed={isWishlisted}
    >
      <span className="wishlist-toggle-shadow" />
      <span className="wishlist-toggle-edge" />
      <span className="wishlist-toggle-front">♥</span>
    </button>
  );
};

export default WishlistButton;
