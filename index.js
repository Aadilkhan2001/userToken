import express from 'express'
import { PrismaClient } from '@prisma/client';
import pkg from 'jsonwebtoken';
const { Jwt } = pkg;

const prisma = new PrismaClient();

const app = express()
app.use(express.json());

const port = 3000

app.post('/user', async(req, res) => {
  let { phonenumber , countrycode } = req.body;
  let token;
    const data = await prisma.user.findFirst({where:{
      phonenumber : phonenumber,
      countrycode : countrycode,
    }});
     token = Jwt.sign(
      {userId: data.data.id},
      "secretkeyappearshere",
      { expiresIn: "1h" }
    );
    res.status(200).json({
      "token" : token
    })
  
})

// app.path('/user',async(req,res)=>{

// })

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})