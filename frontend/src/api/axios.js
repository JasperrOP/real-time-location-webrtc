import axios from 'axios';
const API = axios.create({
    baseURL: 'http://192.168.29.128:5000/api', // <-- Updated to your IP
});

API.interceptors.request.use((req)=>{
    const profile = localStorage.getItem('userProfile');
    if(profile){
        req.headers.Authorization = `Bearer ${JSON.parse(profile).token}`;
    }
    return req;
});

export default API;