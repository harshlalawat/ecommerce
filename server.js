const express = require('express');
const app = express();
const session = require("express-session");
const db = require('./database/db');
const ecommerceModel = require("./database/User");
const mongoose = require("mongoose");
const fs = require('fs');
const nodemailer = require("nodemailer");
require("dotenv").config();


let isAlreadyRegistered=false;
let erError= null;
let emailValid= true;

app.use(function(req, res, next){
    console.log(req.method, req.url);
    next();
})

app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.set("view engine", "ejs");
app.use(session({
    secret: 'iAmSecret',
    resave: true,
    saveUninitialized: true
  }))



  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: 'harshlalawathlhl@gmail.com',
      pass: process.env.PASSWORD
    }
  });



app.get("/", function(req, res){
    res.render("index", {username : req.session.username});
})

app.get("/login", function(req, res){
    if(req.session.username){
        res.redirect("/");
    }else{
        let newError = erError;
        erError = null;
        res.render("login", {username: req.session.username, error: newError});
    }
})


app.get("/validate/:userId", function(req, res){
    ecommerceModel.find({_id: req.params.userId}).then(function(userData){
        if(userData.length){
            ecommerceModel.updateOne({_id: req.params.userId}, {isVerified: true}).then(function(){
                res.redirect("/login");    
            }).catch(function(err){
                console.log(err);
            })
        }else{
            erError = "Invalid user";
            res.redirect("/login");
        }
    })
})

app.get("/forgotpassword",function(req, res){
    if(req.session.username){
        res.redirect("/")
    }else{
        if(emailValid){
            res.render("forgotpassword", {username : req.session.username, error:null})
        }else{
            emailValid = true;
            res.render("forgotpassword", {username : req.session.username, error: "Invalid email"})
        }
    }
})


app.get("/resetpassword/:userId", function(req, res){
    ecommerceModel.find({_id: req.params.userId}).then(function(userData){
        if(userData.length){
            req.session.identity = req.params.userId;
            res.render("reset", {username : req.session.username});   
        }else{
            erError = "Invalid user";
            res.redirect("/login");
        }
    })
})


app.get("/signup", function(req, res){
    if(req.session.username){
        res.redirect("/");
    }else{
        if(isAlreadyRegistered){
            isAlreadyRegistered = false;
            res.render("signup", {isAlreadyRegistered: true, username: req.session.username});
        }else{
            res.render("signup", {isAlreadyRegistered: false, username: req.session.username});
        }
    }
})


app.get("/products", function(req, res){
    getProducts(function(err, products){
        if(err){
            res.status(500);
            res.json({error: err})
        }else{
            res.status(200);
            res.json(products);
        }
    })
})

app.post("/signup", function(req, res){
    let data = req.body;
    ecommerceModel.find({email: data.email}).then(function(users){
        if(users[0]){
            isAlreadyRegistered = true;
            res.redirect("/signup");
        }else{
            isAlreadyRegistered = false;
            const newUser = new ecommerceModel(data);
            newUser.save();
            ecommerceModel.find(data).then(function(user){
                validate(user[0].email, user[0]._id).then(() => {
                    console.log("successful send mail")
                    res.redirect("/login");
                  })
                  .catch((err) => {
                    console.log(err.statusCode);
                    console.log(err);
                  });
            })
        }
    }) 
})



app.post("/resetpassword", function(req, res){
    let data = req.body;
    ecommerceModel.updateOne({_id: req.session.identity},{password: data.confirmPassword}).then();
    res.redirect("/login");
})



app.post("/forgotpassword", function(req, res){
    let data = req.body;
    ecommerceModel.find(data).then(function(users){
        if(users.length){
            resetPassword(users[0].email, users[0]._id).then(() => {
                console.log("successful send reset password mail")
                res.redirect("/login");
                })
                .catch((err) => {
                console.log(err.statusCode);
                console.log(err);
            });
        }else{
            emailValid = false;
            res.redirect("/forgotpassword");
        }
    }) 
})



app.post("/login", function(req, res){
    const data = req.body;
    const email = data.email;
    const password = data.password;
    ecommerceModel.find({email: email, password: password}).then(function(users){
        if(users[0]){
            if(users[0].isVerified){
                erError = null;
                req.session.username = users[0].username;
                res.redirect("/");
            }else{
                erError = "Please verify your email first";
                res.redirect("/login");
            }
        }else{
            erError = "Invalid email/password";
            res.redirect("/login");
        }
    })

})

app.get('/logout',  function (req, res, next)  {
    if (req.session) {
      req.session.destroy(function (err) {
        if (err) {
          console.log(err);
        } else {
          res.redirect('/');
        }
      });
    }
  });

db.init().then(function(){
    app.listen(3000, function(){
        console.log("server is running on port 3000");
    })
})



function getProducts(callback){
    fs.readFile("./public/products.json", "utf-8", function(err, data){
        if(err){
            callback(err);
        }else{
            if(data.length === 0){
                data = "[]";
            }
            try{
                let products = JSON.parse(data);
                callback(null, products);
            }
            catch(err){
                callback(null, []);
            }
        }
    })
}


async function validate(email, id) {
    const info = await transporter.sendMail({
      from: '"Shoes store" <harshlalawathlhl@gmail.com>',
      to: email,
      subject: "Activate your shoes store account",
      html: `<h3>Dear customer,<a href= "http://localhost:3000/validate/${id}">Click here</a>! to activate your account</h3>`,
    });
}



async function resetPassword(email, id) {
    const info = await transporter.sendMail({
      from: '"Shoes store" <harshlalawathlhl@gmail.com>',
      to: email,
      subject: "Reset your shoes store password",
      html: `<h3>Dear customer,<a href= "http://localhost:3000/resetpassword/${id}">Click here</a>! to reset your password</h3>`,
    });
}