import axios from 'axios';
const API = axios.create({
    baseURL: 'http://localhost:5000', // <-- Updated to your IP
});

API.interceptors.request.use((req)=>{
    const profile = localStorage.getItem('userProfile');
    if(profile){
        req.headers.Authorization = `Bearer ${JSON.parse(profile).token}`;
    }
    return req;
});

export default API;