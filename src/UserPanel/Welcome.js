import "./Welcome.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import ThemeToggle from "../components/ThemeToggle";
import { motion } from "framer-motion";
import api from "../api";
import loginImg from "../assets/welcome-images/login-image.jpeg";
import signupImg from "../assets/welcome-images/signup-image.jpeg";
import guestImg from "../assets/welcome-images/guest-image.jpeg";

import logoLight from "../assets/logo-light.png";
import logoDark from "../assets/logo-dark.png";

import { useTheme } from "../components/ThemeContext";
import MatField from "./shared/MatField";
import Button3D from "./shared/Button3D";
import { useToast } from "../components/Usetoast";

const Welcome = ({ toCamelCase, setCurrentUser, fetchMenu }) => {
  const navigate = useNavigate();
  const mobileInputRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [enableAutocomplete, setEnableAutocomplete] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const [activeCard, setActiveCard] = useState(null);

  const { theme } = useTheme();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("Login")
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [animateCards, setAnimateCards] = useState(false);
  const filteredMobiles = users
    .map(u => u.mobile)
    .filter(m => m.startsWith(mobile))
    .sort();

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateCards(true);
    }, 100); // slight delay ensures visible animation
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/users");
        setUsers(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch users", err);
        toast.error("Couldn't connect. Please check your connection and reload.");
      }
    };

    fetchUsers();
  }, []);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 576);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 576);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const containerVariants = {
    hidden: {},
    visible: {}
  };

  const cardVariants = {
    hidden: (index) => ({
      opacity: 1,
      x: 0,
      position: isMobile ? "relative" : "absolute",
      left: 0,
      zIndex: 10 - index
    }),
    visible: (index) => ({
      x: isMobile ? 0 : index * 240,
      position: isMobile ? "relative" : "absolute",
      left: 0,
      transition: {
        delay: isMobile ? 0 : index * 0.4,
        type: "spring",
        stiffness: 120,
        damping: 18
      }
    })
  };

  const handleGuest = () => {
    localStorage.removeItem("userId");

    setCurrentUser({
      id: "guest",
      role: "guest"
    });

    navigate("/categories");
  };

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setMobile(value);
    setFormErrors(prev => ({ ...prev, mobile: "" }));

    if (value.length === 10) {
      setEnableAutocomplete(false);
      setTimeout(() => mobileInputRef.current?.blur(), 0);
    } else {
      setEnableAutocomplete(true);
    }
  };

  const handleSignupMobileChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, "");
    if (digitsOnly.length <= 10) {
      setMobile(digitsOnly);
      setFormErrors(prev => ({ ...prev, mobile: "" }));
    }
  };

  const handleNameChange = (e) => {
    let value = e.target.value;
    if (value.length > 100) return;
    const words = value.trim().split(/\s+/);
    if (words.length > 5) return;
    setName(toCamelCase(value));
    setFormErrors(prev => ({ ...prev, name: "" }));
  };

  const handleLogin = async () => {
    const e = {};
    if (mobile.length !== 10) e.mobile = "Enter a valid 10-digit mobile number.";
    if (Object.keys(e).length > 0) { setFormErrors(e); return; }

    alert("test")

    const matches = users.filter(u => u.mobile === mobile);

    if (matches.length === 0) {
      setFormErrors({ mobile: "No account exists with this mobile number." });
      return;
    }

    if (matches.length > 1) {
      setFormErrors({ mobile: "Multiple accounts found. Contact support." });
      return;
    }

    const user = matches[0];
    localStorage.setItem("userId", user.id);

    // SYNC USER INTO STATE
    setCurrentUser(user);

    // REFRESH MENU + FAVOURITES
    fetchMenu();
    setActiveCard(null);
    setMobile("");
    navigate("/categories");
  };

  // const handleSignup = async () => {
  //   const e = {};
  //   if (!name.trim() || name.trim().length < 2) e.name = "Enter a valid name.";
  //   if (mobile.length !== 10) e.mobile = "Enter a valid 10-digit mobile number.";
  //   if (Object.keys(e).length > 0) { setFormErrors(e); return; }

  //   try {
  //     setLoading(true);

  //     const res = await api.get("/users");
  //     const existingUsers = res.data || [];

  //     const matches = existingUsers.filter(u => u.mobile === mobile);

  //     if (matches.length > 0) {
  //       setFormErrors({ mobile: "An account already exists with this mobile number." });
  //       return;
  //     }

  //     const newUser = {
  //       id: `user_${mobile}`,
  //       name: name.trim(),
  //       mobile,
  //       favourites: [],
  //       combo: [],
  //       orders: []
  //     };

  //     await api.post("/users", newUser);

  //     // login ONLY first time
  //     localStorage.setItem("userId", newUser.id);

  //     setActiveCard(null);
  //     setName("");
  //     setMobile("");
  //     setCurrentUser(newUser);
  //     // REFRESH MENU
  //     fetchMenu();
  //     navigate("/categories");

  //   } catch (err) {
  //     console.error("Signup failed", err);
  //     toast.error("Couldn't create your account. Please try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  var loginTab = 'Login';
  var tabs = document.getElementsByClassName('openTab');

  //alert(tabs);

  function openTab(loginTab) {
    // var i;
    var x = document.getElementsById;
    //console.log(loginTab);
    if (loginTab == 'Login') {
      console.log(loginTab);
      document.getElementById('Login').style.display = "block";
      document.getElementById('Create').style.display = "none";
      // document.elementFromPoint('Login').className = "welcome-btn welcome-btn-active";
      //document.getElementsByClassName('welcome-btn').className = "welcome-btn welcome-btn-active";

    }
    if (loginTab == 'Create') {
      console.log(loginTab);
      document.getElementById('Login').style.display = "none";
      document.getElementById('Create').style.display = "block";

    }
    //alert(x);
    //document.getElementById('Login').style.display = "block";
    //alert(document.getElementById('Login'));
  }


  // tabs.addEventListener.Object.openTab('Login');

  return (
    <div className="welcome-page">
      {/* Wave background */}
      <div className="welcome-waves" aria-hidden="true">
        <div className="welcome-wave" />
        <div className="welcome-wave" />
        <div className="welcome-wave" />
      </div>
      <ThemeToggle />
      <datalist id="user-mobiles">
        {filteredMobiles.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>

      <div className="welcome-container">
        <div className="welcome-title">
          <img
            src={logoDark}
            alt="Cafe"
          />
        </div>

        <div className="welcome-slogan">
          Where every bite feels right
        </div>

        <div className="welcome-card-wrapper">
          <div className="welcome-btn-container">
            <button
              className={`welcome-btn ${activeTab === "Login" ? "active" : ""}`}
              onClick={() => {
                openTab('Login')
                setActiveTab("Login")
              }}
            >
              Login
            </button>
            <button
              className={`welcome-btn ${activeTab === "Create" ? "active" : ""}`}
              onClick={() => {
                openTab('Create')
                setActiveTab("Create")
              }}>Create Account</button>
          </div>

          <div
            className="profile-card openTab" id="Login"
          >
            <h3>Login</h3>

            <div
              className="section"
            //onClick={(e) => e.stopPropagation()}
            >
              <MatField
                label="Mobile Number"
                type="tel"
                style={{ paddingLeft: "4px" }}
                inputRef={mobileInputRef}
                list={enableAutocomplete ? "user-mobiles" : undefined}
                maxLength={10}
                value={mobile}
                onChange={handleMobileChange}
                error={formErrors.mobile}
                wrapperClassName=""
              />
            </div>


            <Button3D
              className="btn-3d red"
              onClick={(e) => {
                e.stopPropagation();
                handleLogin();
              }}
            >
              Login
            </Button3D>
          </div>

          <div
            className="profile-card openTab"
            style={{ display: "none" }}
            id="Create"
          >
            <h3>Create Profile</h3>

            <div
              className="section"
            //onClick={(e) => e.stopPropagation()}
            >
              <MatField
                label="Full Name"
                type="text"
                maxLength={100}
                value={name}
                onChange={handleNameChange}
                error={formErrors.name}
                wrapperClassName=""
              />
            </div>

            <div
              className="section"
            //onClick={(e) => e.stopPropagation()}
            >
              <MatField
                label="Mobile Number"
                type="tel"
                maxLength={10}
                value={mobile}
                onChange={handleSignupMobileChange}
                error={formErrors.mobile}
                wrapperClassName=""
              />
            </div>


            <Button3D
              className="btn-3d red"
            // onClick={(e) => {
            //   e.stopPropagation();
            //   handleSignup();
            // }}
            // disabled={loading}
            >
              Sign Up
            </Button3D>
          </div>

          <Button3D className="btn-3d white" >
            Enter as Guest
          </Button3D>
          <span className="subtext">(No login needed)</span>
        </div>
      </div>
    </div >

  );
};

export default Welcome;
