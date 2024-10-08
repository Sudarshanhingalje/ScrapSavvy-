import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../Common/Navbar";
import {
  Box,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  TextField,
} from "@mui/material";
import { ValidateEmail, ValidatePassword } from "./Validation";
import Toast from "../Common/Snackbar";
import AuthService from "../../Services/AuthService";
import { useDispatch } from "react-redux";
import { ActionCreator } from "../../State/Actions/ActionCreator";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const Signin = () => {
  const navigate = useNavigate();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // LoggedInUser(localStorage.getItem("userId"))
  });
  const validate = () => {
    const tempErrors = {};
    let isValid = true;
    isValid = ValidateEmail(email, tempErrors) && isValid;
    isValid = ValidatePassword(password, tempErrors, "password") && isValid;

    setErrors(tempErrors);
    return isValid;
  };

  // const LoggedInUser = (userProfileId)=>{
  //   if (userProfileId !== undefined){
  //     AuthService.VerifyUser(userProfileId)
  //     .then(response =>{
  //       redirectBasedOnRole(response.data.userProfile.userRole)
  //     })
  //     .catch(error=>{
  //       // localStorage.clear();
  //       //navigate("/signin");
  //     })
  //   }
  // }
  const redirectBasedOnRole = (role) => {
    setTimeout(() => {
      if (role === "company") {
        navigate("/company-dashboard");
      } else if (role === "scrapyard") {
        navigate("/scrapyard-dashboard");
      } else if (role === "customer") {
        navigate("/customer-dashboard");
      }
    }, 2000);
  };
  const handleSignin = async (e) => {
    e.preventDefault();
    if (validate()) {
      const formData = {
        email: email,
        password: password,
      };

      await AuthService.SignIn(formData)
        .then((response) => {
          if (response.status === 200) {
            localStorage.setItem("name", response.data.userProfile.name);
            localStorage.setItem("email", response.data.userProfile.emailId);
            localStorage.setItem("mobile", response.data.userProfile.mobile);
            handleSnackbar("Sign-in successful!", "success", true);
            localStorage.setItem("token", response.data.token);
            localStorage.setItem(
              "userId",
              response.data.userProfile.userProfileId
            );
            redirectBasedOnRole(response.data.userProfile.userRole);
            dispatch(ActionCreator.SetUserToken(response.data.token));
          } else {
            handleSnackbar("Server error!", "error", true);
          }
        })
        .catch((error) => {
          handleSnackbar(error.response.data, "error", true);
        });
    } else {
      handleSnackbar("Invalid credentials!", "error", true);
    }
  };

  const handleSnackbar = (message, severity, show) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(show);
  };
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  return (
    <>
      <Navbar />
      <div className="centered">
        <div className="sm-container mb-3">
          <div className="header-div">
            <h1>Sign in</h1>
          </div>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Email"
              variant="outlined"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              margin="normal"
            />

            {/* <TextField
              
              
              onChange={(e) => setPassword(e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
              margin="normal"
            /> */}

            {/* <button onClick={changeVisibility} >Visibility</button> */}

            <FormControl variant="outlined">
              <InputLabel htmlFor="outlined-adornment-password">
                Password
              </InputLabel>
              <OutlinedInput
                id="outlined-adornment-password"
                type={showPassword ? "text" : "password"}
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!errors.password}
                helperText={errors.password}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
                label="Password"
              />
            </FormControl>

            <button
              type="button"
              className="btn btn-primary w-100 mt-3"
              onClick={handleSignin}
            >
              Sign in
            </button>
            <Link to="/forgotPassword">Forgot password ?</Link>
            <Link to="/signup" className="btn btn-light w-100 ">
              Don't have an account?
            </Link>
          </Box>
        </div>
        <Toast
          open={snackbarOpen}
          close={handleSnackbarClose}
          message={snackbarMessage}
          severity={snackbarSeverity}
        />
      </div>
    </>
  );
};

export default Signin;
