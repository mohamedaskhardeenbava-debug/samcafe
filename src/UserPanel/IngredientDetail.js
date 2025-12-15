import './IngredientDetail.css'
import { useParams } from 'react-router-dom'

const IngredientDetail = ({ handleBack, foodData }) => {
  const { id } = useParams()

  const ingredient = foodData.ingredients.find(
    (item) => item.id === id
  )

  if (!ingredient) {
    return <p>Ingredient not found</p>
  }

  const { kcal, protein, fat, fibre } = ingredient.nutritionPer100g

  return (
    <div className="ingredient-detail">
      <button
        className="back-button"
        style={{top:"40px"  ,left:"40px"}}
        aria-label="Go back"
        onClick={handleBack}
      ></button>
      <div className="left">
        
        <div className="ingredient-detail-image">
        <img src="" alt='' />
      </div>

        
      </div>
      

      <div className="right">
        <div className="ingredient-header">
        <h2 className="ingredient-name">
          {ingredient.name}
        </h2>

        <div className="ingredient-cost">
          ₹{ingredient.pricePer100g} / 100g
        </div>
      </div>

      <div className="description-section">
        <p>{ingredient.description}</p>
      </div>

      <div className="benefits-section">
        <h3>Health Benefits (per 100g)</h3>
        <ul className="health-benefits-list">
          <li>
            <span className="benefit-name">Calories</span>
            <span className="benefit-value">{kcal} kcal</span>
          </li>
          <li>
            <span className="benefit-name">Protein</span>
            <span className="benefit-value">{protein} g</span>
          </li>
          <li>
            <span className="benefit-name">Fat</span>
            <span className="benefit-value">{fat} g</span>
          </li>
          <li>
            <span className="benefit-name">Fibre</span>
            <span className="benefit-value">{fibre} g</span>
          </li>
        </ul>
      </div>

      

      

      <div className="history-section">
        <h3>History</h3>
        <p>{ingredient.history}</p>
      </div>
      </div>
    </div>
  )
}

export default IngredientDetail
