import React from 'react'
import './AdminLogin.css'

const AdminLogin = () => {
  return (
  
  <div className="login-wrapper">
      <div className="login-card">
        <h1 className="login-title">Admin Panel</h1>
        <p className="login-subtitle">
          Sign in to manage the restaurant
        </p>

        <form className="login-form">
          <div className="field">
            <label>Email</label>
            <input type="email" placeholder="admin@restaurant.com" />
          </div>

          <div className="field">
            <label>Password</label>
            <input type="password" placeholder="••••••••" />
          </div>

          <button className="login-btn">
            Login
          </button>
        </form>

        <p className="login-footer">
          Authorized access only
        </p>
      </div>
    </div>
  )
}

export default AdminLogin