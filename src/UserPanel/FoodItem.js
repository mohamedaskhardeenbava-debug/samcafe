import './FoodItem.css'
import { Link, useParams, useLocation } from 'react-router-dom'

const FoodItem = ({ handleBack, foodData }) => {
  const { id: varietyId } = useParams()
  const location = useLocation()
  const { categoryId } = location.state || {}

  const category = foodData.categories.find(
    (cat) => cat.id === categoryId
  )

  if (!category) {
    return <p>Category not found</p>
  }

  const variety = category.varieties.find(
    (v) => v.id === varietyId
  )

  if (!variety) {
    return <p>Food variety not found</p>
  }

  const ingredients = foodData.ingredients.filter((ingredient) =>
    ingredient.usedInCategories.includes(categoryId)
  )

  return (
    <div className="food-item">
      <div className="left-panel">

        <div className="header">
          <button
            className="back-button"
            aria-label="Go back"
            onClick={handleBack}
          ></button>
          <div className="food-item-name-section">
          <div className="food-item-name">
            {category.name} - {variety.name}
          </div>
          <div className="food-item-price">
            ₹{variety.basePrice}
          </div>
        </div>
        </div>

        <div className="food-item-image">
          <img src="" alt=""/>
        </div>

        

        <div className="ingredient-section">
          <div className="ingredients">Ingredients</div>

          <div className="ingredient-list">
            {ingredients.map((ingredient) => (
              <div className="ingredient-item" key={ingredient.id}>
                <Link
                  className="ingredient-item-image"
                  to={`/ingredient/${ingredient.id}`}
                >
                  <img src="" alt="" />
                </Link>

                <Link
                  className="ingredient-item-name"
                  to={`/ingredient/${ingredient.id}`}
                >
                  {ingredient.name}
                </Link>

                <div className="ingredient-item-price">
                  ₹{ingredient.pricePer100g}/100g
                </div>

                <div className="ingredient-modification">
                  <div className="ingredient-minus">-</div>
                  <div className="ingredient-item-quantity">50g</div>
                  <div className="ingredient-plus">+</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="right-panel">
        <div className="top">
          <div className="ingredients-calculation">
            Ingredients calculation
          </div>

          <div className="ingredient-list-calculation">
            <div className="ingredient-item-calculation">
              <div className='ingredient-item-image-calculation'>
                <img src="" alt="" />
              </div>
              <div className='ingredient-item-name-calculation'>Name</div>
              <div className="ingredient-item-quantity-calculation">50g</div>
              <div className="ingredient-item-price-calculation">₹200</div>
            </div>

            <div className="ingredient-item-calculation">
              <div className='ingredient-item-image-calculation'>
                <img src="" alt="" />
              </div>
              <div className='ingredient-item-name-calculation'>Name</div>
              <div className="ingredient-item-quantity-calculation">50g</div>
              <div className="ingredient-item-price-calculation">₹200</div>
            </div>

            <div className="ingredient-item-calculation">
              <div className='ingredient-item-image-calculation'>
                <img src="" alt="" />
              </div>
              <div className='ingredient-item-name-calculation'>Name</div>
              <div className="ingredient-item-quantity-calculation">50g</div>
              <div className="ingredient-item-price-calculation">₹200</div>
            </div>
          </div>

        </div>

        <div className="bottom">
          <div className="price-section">
            <div className="total-price">Total Price</div>
            <div className="food-item-total-amount">
              ₹500
            </div>
          </div>

          <div className="quatity-section">
            <div className="total-quantity">Total Quantity</div>
            <div className="food-item-total-quantity">
              300 grams
            </div>
          </div>

          <div className="Add-to-cart-button" role="button">
            Add to Cart
          </div>
        </div>
      </div>
    </div>
  )
}

export default FoodItem
