import React from 'react'
import './FoodCategory.css'
import { Link } from 'react-router-dom'

const FoodCategory = ({ foodData }) => {
  return (
    <div className='food-category'>
      <div className='food-category-container'>
        {foodData.categories.map((category) => (
          <Link key={category.id} className='food-category-items' to={`/foods/${category.id}`}>
            <div className="food-category-image"><img src="" alt="" /></div>
            <div className='food-category-name'>{category.name}</div>
          </Link>
        ))
        }
      </div>
    </div>
  )
}

export default FoodCategory