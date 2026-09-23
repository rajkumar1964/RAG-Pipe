import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { register, login, getme } from "../service/auth.api.js";
import { setUser, setLoading, setError } from "../auth.slice.js";


export function useAuth() {
    const dispatch = useDispatch()

    async function handleRegister({ email, username, password }) {
        try {
            dispatch(setLoading(true))
            const data = await register({ email, username, password })
            dispatch(setUser(data.user))
            toast.success(data.message || "Email Send Succesfully")
            return true
        } catch (error) {
            const message = error.response?.data?.message || "Registration failed"
            dispatch(setError(message))
            toast.error(message)
            return false
        } finally {
            dispatch(setLoading(false))
        }
    }

    async function handleLogin({ email, password }) {
        try {
            dispatch(setLoading(true))
            const data = await login({ email, password })
            dispatch(setUser(data.user))
            toast.success("Login successful!")
            return true 
        } catch (err) {
            const message = err.response?.data?.message || "Login failed"
            dispatch(setError(message))
            toast.error(message)
            return false 
        } finally {
            dispatch(setLoading(false))
        }
    }

    async function handleGetMe() {
        try {
            dispatch(setLoading(true))
            const data = await getme()
            dispatch(setUser(data.user))
            
        } catch (err) {
            const message = err.response?.data?.message || "Failed to fetch user data"
            dispatch(setError(message))
           
        } finally {
            dispatch(setLoading(false))
        }
    }

    return {
        handleRegister,
        handleLogin,
        handleGetMe,
    }

}