import axios from 'axios'
import api from './axiosConfig.js'

class AuthService {
    constructor() {
        
    }

    async createAccount({ email, password, username }) {
        // email, password, username kese milega ise ham comp me handle kr lenge
        const options = {
            method: 'POST',
            url: 'https://api.freeapi.app/api/v1/users/register',
            headers: {
                'Content-Type': 'application/json'
            },
            data: {
                email: email,
                password: password,
                username: username
            }
        }

        try {
            const { data } = await axios.request(options)
            if (data) {
                return this.loginAccount({ username, password })
            }
        } catch (error) {
            console.log("createAccount error::", error)
        }

    }

    async loginAccount({ username, password }) {
        // login page se username, password kese mil rha h, ye ham vhi handle krenge
        const options = {
            method: 'POST',
            url: 'https://api.freeapi.app/api/v1/users/login',
            headers: {
                'Content-Type': 'application/json'
            },
            data: {
                password: password,
                username: username
            }
        }

        try {
            const { data } = await axios.request(options)
            if (data) {
                // login hote hi store me update hona chahiye, ye kaam ham vha krenge jaga loginAccoutn ko use krenge
                return data;
            }
        } catch (error) {
            console.log("loginAccoutn error::", error)
        }
    }

    async getCurrentUser() {
        const options = {
            method: 'GET',
            url: 'https://api.freeapi.app/api/v1/users/current-user'
        }

        try {
            const { data } = await api.request(options)
            if (data) return data
        } catch (error) {
            console.log("getCurrentUser error::", error)
        }
    }

    async logoutAccount() {
        const options = {
            method: 'POST',
            url: 'https://api.freeapi.app/api/v1/users/logout'
        }

        try {
            const { data } = await api.request(options)
            return data
        } catch (error) {
            console.error(error)
        }
    }
}

const authService = new AuthService()
export default authService