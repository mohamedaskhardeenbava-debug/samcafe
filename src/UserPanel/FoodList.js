import React from 'react'
import './FoodList.css'
import { Link, useParams } from 'react-router-dom'

const FoodList = ({ handleBack, foodData }) => {
  const { categoryId } = useParams();

  const category = foodData.categories.find(
    (cat) => cat.id === categoryId
  )

  if (!category) {
    return <p>Category not found</p>
  }
  return (
    <div className='food-list'>
      <div className="food-header">
        <button class="back-button" aria-label="Go back" onClick={handleBack}></button>
        <div className="food-list-title">{category.name}</div>
      </div>
      <div className='food-list-container'>
        {category.varieties.map((variety) => (
          <Link
            key={variety.id}
            className="food-list-items"
            to={`/food/${variety.id}`}
            state={{ categoryId }} >
            <div className="food-list-image"><img src="" alt="" /></div>
            <div className='food-list-name'>{variety.name}</div>
            <div className='food-list-price'>Starting @ ₹{variety.basePrice}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default FoodList