const express = require("express");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const fs = require("fs");
const https = require("https");
const Schema = require("./schema");
const cors=require("cors");
const axios = require("axios");
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary.js');
const Up=require("./upload.js");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname)));
const generateToken = (user) => jwt.sign(
    { email: user.Email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
);
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'uploads', // Cloudinary ke andar ek folder banayega
      format: async (req, file) => 'png', // Image format define karein
      public_id: (req, file) => file.originalname.split('.')[0] // File ka naam
    }
  });
  
  const upload = multer({ storage: storage });

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;
    console.log(req.headers);
  
    if (!token) {
      return res.status(404).json({ message: 'Token is required' });
    }
  
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(404).json({ message: 'Invalid or expired token' });
      }
      req.user = decoded;
      next();
    });
  };


const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, "server.key")), 
    cert: fs.readFileSync(path.join(__dirname, "server.cert"))
};


const router = express.Router();
app.use("/", router);
router.get("/test", (req, res) => {
    res.json({ message: "✅ Router is working!" });
});
const GOOGLE_API_KEY = 'AIzaSyAZXp1qf2pU3pkiqavT6u-WSqFxp8ij0ec';


app.get("/api/address-suggestions",verifyToken, async (req, res) => {
    const query = req.query.query;
    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    const googlePlacesUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=address&key=${GOOGLE_API_KEY}`;

    try {
        const response = await fetch(googlePlacesUrl);
        const data = await response.json();
        res.json(data); 
    } catch (error) {
        console.error('Error fetching places:', error);
        res.status(500).json({ error: 'Failed to fetch places' });
    }
});

app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        
        res.json({ imageUrl: req.file.path });
        Up.updateOne({Title:"OMAXE"}, {$push: { Images: req.file.path }}).then(()=>{
            console.log("updated");
        });
        

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        Up.updateOne({Title:"OMAXE"}, {$push: { amenities: req.file.path }}).then(()=>{
            console.log("updated");
        })
        res.json({ imageUrl: req.file.path });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/listing/propertyinfo',(req,res)=>{

    const pinf=req.body;
    console.log(pinf);

    Up.create({Title:pinf.title,Type:pinf.propertyType,Bed:pinf.bedrooms,Bath:pinf.bathrooms,Location:pinf.location,Area:pinf.area,Description:pinf.description}).then(()=>{
        console.log("data sent");
    });


});

router.get("/listing/properties", (req, res) => {
    const { search, type } = req.query;
    res.json({ City: search, Type: type });
});

router.post("/user/signup", async (req, res) => {
    try {
        const { uname, email, password } = req.body;
        const existingUser = await Schema.findOne({ Email: email });
        if (existingUser) return res.status(400).json({ message: "Account already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        await Schema.create({ Username: uname, Email: email, Pass: hashedPassword });
        res.status(201).json({ message: "Signup successful" });
    } catch (error) {
        res.status(500).json({ error: "Server Error" });
    }
});

router.post("/user/login", async (req, res) => {
    try {

        const   usercred=req.body;
   
       const  dbfetch=await  Schema.findOne({Email:usercred.Email});
         console.log(dbfetch);
     
   
           const isMatch = await bcrypt.compare(usercred.Pass, dbfetch.Pass);
         if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
         else{
           console.log(dbfetch.Username);
          const t=generateToken(dbfetch);
           console.log(t);
           res.status(201).json({ message: 'successful',Token:t, Username:dbfetch.Username });
   
         }
     
       } catch (error) {
           res.status(400).json({ message: "Email does not exist" });
       }
   
   
});

router.get('/photo/up',(req,res)=>{
    res.sendFile(path.join(__dirname,'photo.html'));
});





const allowedPages = [
    "landingpage",
    "listedproperty",
    "listing",
    "Login_profile",
    "signup_profile",
    "admin_signin",
    "admin_signup",
    "User_Signup",
    "User_signin",
    "listinggg",
];

router.get("/:page", (req, res) => {
    const { page } = req.params;
    if (allowedPages.includes(page)) {
        res.sendFile(path.join(__dirname, page, `${page}.html`));
    } else {
        res.status(404).send("Page Not Found");
    }
});


const PORT = process.env.PORT || 10000;
const MONGO_URI = "mongodb+srv://raghavdhiman2006:123@raghav.loyrcrt.mongodb.net/"

mongoose
    .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("✅ MongoDB Connected");
        app.listen(PORT, () => {
            console.log(`🚀 HTTPS Server running on port ${PORT}`);
        });
    })
    .catch(err => console.error(" MongoDB Connection Error:", err));
