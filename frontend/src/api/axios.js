import axios from 'axios';
const API = axios.create({
    baseURL: 'https://geosync-backend-7b2h.onrender.com/api', // <-- Updated to your IP
});

API.interceptors.request.use((req)=>{
    const profile = localStorage.getItem('userProfile');
    if(profile){
        req.headers.Authorization = `Bearer ${JSON.parse(profile).token}`;
    }
    return req;
});

export default API;