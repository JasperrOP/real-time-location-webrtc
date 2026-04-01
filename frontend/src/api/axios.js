import axios from 'axios';
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

API.interceptors.request.use((req)=>{
    const profile = localStorage.getItem('userProfile');
    if(profile){
        req.headers.Authorization = `Bearer ${JSON.parse(profile).token}`;
    }
    return req;
});

export default API;