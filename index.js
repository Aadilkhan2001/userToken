import express from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import multer from "multer";
import AWS from 'aws-sdk'
import fs from 'fs';
const { sign, verify } = jwt;
const upload = multer({ dest: 'uploads/' });
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_ACCESS_SECRET,
})


import { config } from "dotenv";

const prisma = new PrismaClient();
config();
const app = express();
app.use(express.json());

const port = 3000;

const createToken = async (userData) => {
  return sign(JSON.stringify(userData), process.env.SECRET_KEY);
};

app.get("/user", async (req, res) => {
  let userData = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      countrycode: true
    }
  });
  res.status(200).json({
    message: { 'success': true },
    data: {
      user: userData
    }
  })
})


app.post("/user", async (req, res) => {
  
  let { phonenumber, countrycode } = req.body;

  let token;
  let userData;

  userData = await prisma.user.findFirst({
    where: {
      phone: parseInt(phonenumber),
      countrycode: countrycode,
    },
  });

  if (userData === null) {
    userData = await prisma.user.create({
      data: {
        phone: parseInt(phonenumber),
        countrycode: countrycode,
      },
    });
  }
  token = await createToken(userData);

  res.status(200).json({
    message: { 'success': true },
    data: {
      token: token,
      user: userData
    }
  });
});

app.patch("/user", upload.single('image') ,async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: { 'success': false, "error": "Invalid Token!!" } });
  } else {
    console.log('here========>');
  const imagePath = req.file.path
  console.log('imagepath',imagePath)
  const blob = fs.readFileSync(imagePath)

  const uploadedImage = await s3.upload({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: req.file.originalname,
    Body: blob,
  }).promise()
  console.log('--------------> location',uploadedImage.Location)
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
    const updatedData = await prisma.user.update({
      data: req.body, where: {
        id: decodedToken.id
      }
    })
    res.status(200).json(updatedData);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
