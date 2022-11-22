import express from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const { sign, verify } = jwt;
import { config } from "dotenv";

const prisma = new PrismaClient();
config();
const app = express();
app.use(express.json());

const port = 3000;

const createToken = async (userData) => {
  return sign(JSON.stringify(userData), process.env.SECRET_KEY);
};

app.get("/user" , async (req,res) => {
  let userData = await prisma.user.findMany({select :{
    id:true,
    name : true,
    email:true,
    phone:true,
    countrycode : true
  }});
  res.status(200).json(userData)
})
app.post("/user", async (req, res) => {
  let { phonenumber, countrycode } = req.body;
  let token;
  let userData;

  userData = await prisma.user.findFirst({
    where: {
      phone: phonenumber,
      countrycode: countrycode,
    },
  });

  if (userData === null) {
    userData = await prisma.user.create({
      data: {
        phone: phonenumber,
        countrycode: countrycode,
      },
    });
  }
  token = await createToken(userData);

  res.status(200).json({ token: token });
});

app.patch("/user", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    res.status(401).json({ success: false, message: "Unauthorized!!" });
  } else {
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
    const updatedData = await prisma.user.update({data:req.body,where:{
      id:decodedToken.id
    }})
    res.status(200).json(updatedData);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
