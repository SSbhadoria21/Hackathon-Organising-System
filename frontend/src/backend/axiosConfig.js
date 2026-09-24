// import axios from "axios";
// import store from "../store/store";
// import { login, logout } from "../store/authSlice";

// // NOTE: const token = useSelector(state => state.auth.token)
// // yha par do galatiya thi: useselector yaha use krna or token ko api create krte waqt hi de dena
// const api = axios.create({
//     baseURL: "https://api.freeapi.app/api/v1"
// });

// api.interceptors.request.use(
//     function (config) {
//         // const token = store.getState().auth().token
//         const token = localStorage.getItem("accessToken")
//         if (token) config.headers.Authorization = `Bearer ${token}`
//         return config;
//     }
// )

// api.interceptors.response.use(
//     function (response) { return response },
//     async (error) => {
//         if (error.response?.status === 401) {
//             try {
//                 // const refreshToken = store.getState().auth().refreshToken
//                 const refreshToken = localStorage.getItem("refreshToken")
//                 const { data } = await axios.post(`https://api.freeapi.app/api/v1/users/refresh-token`, { refreshToken });
//                 localStorage.setItem("accessToken", data.data.accessToken)
//                 localStorage.setItem("refreshToken", data.data.refreshToken)
//                 // store.dispatch(login()) //⚠️login k andar data pass kro ya maybe is kaam ko yaha krne ki jroorat h hi nhi to ham ise app vgera me hi kr lenge

//                 error.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
//                 return api(error.config);
//             } catch (refreshError) {
//                 store.dispatch(logout())
//                 window.location.href = "/login";
//             }
//         }
//         return Promise.reject(error);
//     }
// )

// export default api


import axios from "axios";
import store from "../store/store";
import { logout } from "../store/authSlice";

const api = axios.create({
    baseURL: "http://localhost:3000/api",
    withCredentials: true,
});

api.interceptors.response.use(
    (response) => response,

    async (error) => {
        if (error.response?.status === 401) {
            try {
                await axios.post(
                    "http://localhost:3000/api/auth/refresh-token",
                    {},
                    { withCredentials: true }
                );

                return api(error.config);

            } catch (refreshError) {
                store.dispatch(logout());
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

export default api;