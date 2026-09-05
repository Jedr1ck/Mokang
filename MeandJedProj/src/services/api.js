const API_URL=import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const token=()=>localStorage.getItem('access_token');
export async function api(path, options={}) { const headers={'Content-Type':'application/json',...(options.headers||{})}; if(token()) headers.Authorization=`Bearer ${token()}`; const r=await fetch(`${API_URL}${path}`,{...options,headers}); const data=await r.json().catch(()=>({})); if(!r.ok) throw new Error(data.detail||'Request failed'); return data; }
export async function login(email,password){const d=await api('/auth/login',{method:'POST',body:JSON.stringify({email,password})});localStorage.setItem('access_token',d.access_token);localStorage.setItem('user',JSON.stringify(d.user));return d}
export async function register(data){return api('/auth/register',{method:'POST',body:JSON.stringify(data)})}
export const logout=()=>{localStorage.removeItem('access_token');localStorage.removeItem('user');};
