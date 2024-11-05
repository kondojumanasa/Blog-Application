import {useState} from "react";
import {useNavigate,Link} from "react-router-dom";

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate=useNavigate();

  async function register(ev) {
    ev.preventDefault();
    const response = await fetch('http://localhost:5000/register', {
      method: 'POST',
      body: JSON.stringify({username,password}),
      headers: {'Content-Type':'application/json'},
    });
    if (response.status === 200) {
      alert('registration successful');
      navigate('/login');
    } else {
      alert('registration failed');
    }
  }
  return (
    <form className="register" onSubmit={register}>
      <h1>Register</h1>
      <input type="text"
             placeholder="username"
             value={username}
             onChange={ev => setUsername(ev.target.value)}/>
      <input type="password"
             placeholder="password"
             value={password}
             onChange={ev => setPassword(ev.target.value)}/>
      <button>Register</button>
      <p>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </form>
  );
}