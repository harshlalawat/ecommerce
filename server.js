const express = require('express');
const app = express();
const session = require("express-session");
const db = require('./database/db');
const ecommerceModel = require("./database/User");
const mongoose = require("mongoose");
const fs = require('fs');


let isAlreadyRegistered=false;
let isNotValid = false;

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

app.get("/", function(req, res){
    res.render("index", {username : req.session.username});
})

app.get("/login", function(req, res){
    if(req.session.username){
        res.redirect("/");
    }else{
        if(isNotValid){
            isNotValid = false;
            res.render("login", {isNotValid: true, username: req.session.username});
        }else{
            res.render("login", {isNotValid: false, username: req.session.username});
        }
    }
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
        // console.log(products);
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
    ecommerceModel.find(data).then(function(users){
        console.log(users[0]);
        if(users[0]){
            isAlreadyRegistered = true;
            res.redirect("/signup");
        }else{
            isAlreadyRegistered = false;
            const newUser = new ecommerceModel(data);
            newUser.save();
            res.redirect("/login");
        }
    })
})

app.post("/login", function(req, res){
    const data = req.body;
    const username = data.username;
    const password = data.password;
    ecommerceModel.find(data).then(function(users){
        if(users[0]){
            isNotValid = false;
            req.session.username = username;
            res.redirect("/");
        }else{
            isNotValid = true;
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