import React from "react";
import "./App.css";
import axios from "axios";
import jwtDecode from "jwt-decode";

function App() {
  
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [user, setUser] = React.useState(null);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState(false);
  
 

  const refreshToken = async () => {
    try {
      const res = await axios.post("/refresh", {
        refreshToken: user.user.refreshToken,
      });
      setUser({
        ...user,
        user: {
          ...user.user,
          accessToken: res.data.tokens.accessToken,
          refreshToken: res.data.tokens.refreshToken,

        },
      });
      console.log(user);
      return res.data;
    } catch (error) {
      console.log(error);
    }
  };

  const axiosJWT = axios.create()




  axiosJWT.interceptors.request.use(
    async (config) => {
      let currentDate = new Date();
      const decodedToken = jwtDecode(user.user.accessToken);
      if (decodedToken.exp*1000 < currentDate.getTime() ) {
        const data = await refreshToken();
        config.headers["authorization"] = `Bearer ${data.tokens.accessToken}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("/login", {
        username,
        password,
      });
      localStorage.setItem("user",  JSON.stringify(res.data.user));
      setUser(res.data);
    } catch (error) {
      console.log(error);
    }
  };




  const handleClick = async (id) => {
    setError(false);
    setSuccess(false);

    try {
      await axiosJWT.delete(`/users/${id}`, {
        headers: {
          authorization: `Bearer ${user.user.accessToken}`,
        },
      });
      setSuccess(true);
    } catch (e) {
      setError(true);

      console.log(e);
    }
  };

  return (
    <div className="App">
      {user ? (
        <div className="main">
          <h4>
            Merhabalar Sayın,{" "}
            <strong style={{ color: "red" }}>
              {user.user.isAdmin ? "Admin" : "Kullanıcı"}
            </strong>
          </h4>
          <button onClick={() => handleClick(1)}>Yusuf'u Sil</button>
          <button onClick={() => handleClick(2)}>Sude'yi Sil</button>
          {success && <h4>Kullanıcı Silindi</h4>}
          {error && <h4>Buna yetkin yok</h4>}
        </div>
      ) : (
        <div className="container">
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Kullanıcı Adı"
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="Şifre"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">Giriş Yap</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
