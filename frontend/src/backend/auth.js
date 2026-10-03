// import axios from 'axios'
// import api from './axiosConfig.js'

// class AuthService {
//     constructor() {
        
//     }

//     async createAccount({ email, password, username, fullName }) {
//         // email, password, username kese milega ise ham comp me handle kr lenge
//         const options = {
//             method: 'POST',
//             url: 'http://localhost:3000/api/auth/register',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             data: {
//                 email: email,
//                 password: password,
//                 username: username,
//                 fullName: fullName
//             }
//         }

//         try {
//             const { data } = await axios.request(options)
//             if (data) {
//                 return data;
//                 // return this.loginAccount({ username, password })
//             }
//         } catch (error) {
//             console.log("createAccount error::", error)
//         }

//     }

//     async verifyEmail({userId, otp}){
//         const options = {
//             method: 'POST',
//             url: 'http://localhost:3000/api/auth/verify-email',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             data: {
//                 userId,
//                 otp
//             }
//         }

//         try {
//             const { data } = await axios.request(options)
//             if (data) {
//                 return data;
//             }
//         } catch (error) {
//             console.log("createAccount error::", error)
//         } 
//     }

//     async loginAccount({ username, password }) {
//         // login page se username, password kese mil rha h, ye ham vhi handle krenge
//         const options = {
//             method: 'POST',
//             url: 'http://localhost:3000/api/auth/login',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             data: {
//                 password: password,
//                 username: username
//             }
//         }

//         try {
//             const { data } = await axios.request(options)
//             if (data) {
//                 // login hote hi store me update hona chahiye, ye kaam ham vha krenge jaga loginAccoutn ko use krenge
//                 return data;
//             }
//         } catch (error) {
//             console.log("loginAccoutn error::", error)
//         }
//     }

//     async getCurrentUser() {
//         //is this correct, is it taking the token from the cookies?
//         const options = {
//             method: 'GET',
//             url: 'http://localhost:3000/api/auth/me'
//         }

//         try {
//             const { data } = await api.request(options)
//             if (data) return data
//         } catch (error) {
//             console.log("getCurrentUser error::", error)
//         }
//     }

//     async logoutAccount() {
//         const options = {
//             method: 'POST',
//             url: 'http://localhost:3000/api/auth/logout'
//         }

//         try {
//             const { data } = await api.request(options)
//             return data
//         } catch (error) {
//             console.error(error)
//         }
//     }
// }

// const authService = new AuthService()
// export default authService



import api from "./axiosConfig.js";

class AuthService {

    async createAccount({ email, password, username, fullName }) {
        const { data } = await api.post("/auth/register", {
            email,
            password,
            username,
            fullName
        });

        return data;
    }

    async verifyEmail({ userId, otp }) {
        const { data } = await api.post("/auth/verify-email", {
            userId,
            otp
        });

        return data;
    }

    async loginAccount({ identifier, password }) {
        const { data } = await api.post("/auth/login", {
            identifier,
            password
        });

        return data;
    }

    async getCurrentUser() {
        const { data } = await api.get("/auth/me");

        return data;
    }

    async logoutAccount() {
        const { data } = await api.post("/auth/logout");

        return data;
    }
}

const authService = new AuthService();

export default authService;