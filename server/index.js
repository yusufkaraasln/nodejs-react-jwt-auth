const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const users = [
  { id: 1, username: "Yusuf", password: "yusuf", isAdmin: true },
  { id: 2, username: "Sude", password: "sude", isAdmin: false },
];

const cors = require("cors");




app.use(express.json());

let refreshTokens = [];

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, isAdmin: user.isAdmin },
    "myLongSecretJwtKey",
    {
      expiresIn: "10s",
    }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, isAdmin: user.isAdmin },
    "myLongRefreshSecretJwtKey"
  );
};

const verify = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, "myLongSecretJwtKey", (err, user) => {
      if (err) {
        res.status(403).json({ message: "Geçersiz Token !" });
      } else {
        req.user = user;
        next();
      }
    });
  } else {
    res.status(403).json({ message: "Kimlik doğrulama yapman gerek!" });
  }
};

app.delete("/api/users/:id", verify, (req, res) => {
  if (req.user.id == req.params.id || req.user.isAdmin) {
    res.status(200).json({ message: "Kullanıcı silindi" });
  } else {
    res.status(403).json({ message: "Bu kullanıcıyı silmek için yetkin yok" });
  }
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (user) => user.password === password && user.username === username
  );
  const usernameValid = users.find(
    (user) => user.password === password && user.username !== username
  );
  const passwordValid = users.find(
    (user) => user.password !== password && user.username === username
  );

  if (user) {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    refreshTokens.push(refreshToken);

    res.status(200).json({
      message: "Giriş başarılı",
      user: {
        id: user.id,
        isAdmin: user.isAdmin,
        accessToken,
        refreshToken,
      },
    });
  } else if (usernameValid || passwordValid) {
    res.status(403).json({
      message: "Kullanıcı adı veya şifre hatalı",
    });
  } else {
    res.status(404).json({
      message: "Kullanıcı bulunamadı",
    });
  }
});

app.post("/api/logout", verify, (req, res) => {
  const refreshToken = req.body.refreshToken;
  // const index = refreshTokens.indexOf(refreshToken);
  // if(index !== -1){
  //     refreshTokens.splice(index,1);
  // }
  refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
  res.status(200).json({ message: "Oturum kapatıldı" });
});

app.post("/api/refresh", (req, res) => {
  const refreshToken = req.body.refreshToken;

  if (!refreshToken) {
    return res.status(403).json({
      message: "Oturum açman gerekli",
    });
  }

  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).json({
      message: "Yenileme tokeni geçersiz",
    });
  }

  jwt.verify(refreshToken, "myLongRefreshSecretJwtKey", (err, user) => {
    if (err) {
      return res.status(403).json({
        message: "Burada bir hata oluştu",
      });
    }

    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    refreshTokens.push(newRefreshToken);
    res.status(200).json({
      message: "Yenileme başarılı",
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  });
});

app.listen(8080, () => {
  console.log("server is running on port 8080");
});
