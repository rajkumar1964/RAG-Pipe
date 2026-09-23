import {Router } from "express"
import { registercontroller } from "../controller/auth.controller.js";
import { registerValidator } from "../../validator/auth.validator.js";
import {loginValidator} from "../../validator/auth.validator.js"
import { verifyemail , getme } from "../controller/auth.controller.js";
import { logincontroller } from "../controller/auth.controller.js";
import {authmiddleware} from "../middleware/auth.middleware.js"
const authrouter = Router()

authrouter.post("/register",registerValidator,registercontroller)

authrouter.get("/verify",verifyemail)

authrouter.post("/login", loginValidator, logincontroller )

authrouter.get("/getme", authmiddleware, getme)


export default authrouter;