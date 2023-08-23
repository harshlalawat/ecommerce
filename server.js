const express = require('express');
const app = express();
const session = require("express-session");
const db = require('./database/db');
const ecommerceModel = require("./database/User");
const mongoose = require("mongoose");
const fs = require('fs');
const nodemailer = require("nodemailer"); 
const multer = require("multer");
require("dotenv").config();
const notifier = require('node-notifier');


let isAlreadyRegistered=false;
let erError= null;
let emailValid= true;

app.use(function(req, res, next){
    console.log(req.method, req.url);
    next();
})

app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));
const upload = multer({ dest: 'public/' });
app.use(upload.single("productImage"));
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


app.get("/cart", function(req, res){
    if(req.session.username){
        ecommerceModel.findOne({email: req.session.email}).then(function(user){
            if(user){
                res.render("cart", {username: req.session.username, cartItems: user.cart});
            }
        })
    }else{
        res.redirect("/login");
    }
})


app.get("/admin", function(req, res){
    if(req.session.username){
        ecommerceModel.findOne({email: req.session.email}).then(function(user){
            if(user.isAdmin){
                getProducts(function(err, products){
                    if(err){
                        throw new Error("Something went wrong in admin page");
                    }else{
                        res.render("admin", {username: req.session.username, products: products});
                    }
                })
            }else{
                notifier.notify({
                    title: 'ERROR 401!',
                    message: 'You are not authorized to view this page. This page is for admin only',
                    sound: true,
                    wait: true
                  })
                res.redirect("/");
            }
        })
    }else{
        res.redirect("/login");
    }
})


app.post("/addProduct", function(req, res){
    if(req.session.username){
        if(req.file){
            addNewProduct(req.body, req.file.filename, function(err){
                if(err){
                    throw new Error("Something went wrong in adding a new product");
                }else{
                    res.redirect("/");
                }
            })
        }else{
            res.redirect("/admin");
        }
    }else{
        res.redirect("/login");
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



app.post("/addToCart", function(req, res){
    if(req.session.username){
        const productToAddInCart = req.body.ProductToAddInCart ;
        ecommerceModel.find({email: req.session.email}).then(function(users){
            if(users.length){
                let productAlreadyAdded= false;
                const user = users[0];
                let updatedCart = [];
                updatedCart = user.cart.filter((product)=>{
                    if(product.name === productToAddInCart){
                        productAlreadyAdded = true;
                        product.quantity++;
                    }
                    return product;
                })
                if(!productAlreadyAdded){
                    getProducts(function(err, products){
                        if(err){
                            throw new Error("Something went wrong in adding item to cart")
                        }else{
                            let productObject = {
                                name: productToAddInCart,
                                quantity : 1,
                                
                            }
                            products.forEach(function(element){
                                if(element.name === productObject.name){
                                    productObject.price = element.price;
                                    productObject.image = element.image
                                }
                            })
                            updatedCart.push(productObject);
                            ecommerceModel.updateOne({email: req.session.email}, {cart: updatedCart}).then(function(){
                                res.status(200);
                                res.json();
                            });
                        }
                    })
                }else{
                    ecommerceModel.updateOne({email: req.session.email}, {cart: updatedCart}).then(function(){
                        res.status(200);
                        res.json();
                    });
                }
            }else{
                throw new Error("Something went wrong in adding product to cart")
            }
        })
    }else{
        res.status(301);
        res.json();
    }
})



app.post("/updateProduct", function(req, res){
    if(req.session.username){
        const updateProductObject = req.body ;
        updateProduct(updateProductObject ,function(err){
            if(err){
                res.status(403);
                res.json({error: err})
            }else{
                res.status(200);
                res.json();
            }
        })
    }else{
        res.status(301);
        res.json();
    }
})



app.post("/deleteProduct", function(req, res){
    if(req.session.username){
        const deleteProductImage = req.body.image ;
        deleteProduct(deleteProductImage ,function(err){
            if(err){
                res.status(403);
                res.json({error: err})
            }else{
                res.status(200);
                res.json();
            }
        })
    }else{
        res.status(301);
        res.json();
    }
})



app.post("/cartItemDelete", function(req, res){
    if(req.session.username){
        const productToDeleteInCart = req.body.ProductToDeleteInCart ;
        ecommerceModel.find({email: req.session.email}).then(function(users){
            if(users.length){
                const user = users[0];
                let updatedCart = [];
                updatedCart = user.cart.filter((product)=>{
                    if(product.name != productToDeleteInCart){
                        return product;
                    }
                })
                ecommerceModel.updateOne({email: req.session.email}, {cart: updatedCart}).then();
                res.status(200);
                res.json();
            }else{
                throw new Error("Something went wrong in deleting product to cart")
            }
        })
    }else{
        res.status(301);
        res.json();
    }
})


app.post("/increaseProductNumber", function(req, res){
    if(req.session.username){
        const ProductToIncreaseInCart = req.body.ProductToIncreaseInCart ;
        let stock = 0;
        getProducts(function(err, products){
            if(err){
                console.log(err);
            }else{
                products.forEach(function(element){
                    if(element.name === ProductToIncreaseInCart){
                        stock = element.stock;
                    }
                })
            }
        })
        ecommerceModel.find({email: req.session.email}).then(function(users){
            if(users.length){
                const user = users[0];
                let updatedCart = [];
                updatedCart = user.cart.filter((product)=>{
                    if(product.name === ProductToIncreaseInCart){    
                        if(product.quantity < stock){
                            product.quantity +=1;
                        }
                    }
                    return product;
                })
                ecommerceModel.updateOne({email: req.session.email}, {cart: updatedCart}).then(function(){
                    res.status(200);
                    res.json();
                });
            }else{
                throw new Error("Something went wrong in deleting product to cart")
            }
        })
    }else{
        res.status(301);
        res.json();
    }
})


app.post("/decreaseProductNumber", function(req, res){
    if(req.session.username){
        const ProductToDecreaseInCart = req.body.ProductToDecreaseInCart ;
        ecommerceModel.find({email: req.session.email}).then(function(users){
            if(users.length){
                const user = users[0];
                let updatedCart = [];
                updatedCart = user.cart.filter((product)=>{
                    if(product.name === ProductToDecreaseInCart){ 
                        if(product.quantity > 1){
                            product.quantity -=1;
                        } 
                    }
                    return product;
                })
                ecommerceModel.updateOne({email: req.session.email}, {cart: updatedCart}).then(function(){
                    res.status(200);
                    res.json();
                });
            }else{
                throw new Error("Something went wrong in deleting product to cart")
            }
        })
    }else{
        res.status(301);
        res.json();
    }
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
                req.session.email = users[0].email;
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


function addNewProduct(newProduct, newProductImageUrl, callback){
    getProducts(function(err, products){
        if(err){
            callback(err);
        }else{
            const newProductObject = {
                name: newProduct.productName,
                image: newProductImageUrl,
                price: newProduct.productPrice,
                details: newProduct.productDetails,
                stock: newProduct.productStock
            }
            products.unshift(newProductObject);
            fs.writeFile("./public/products.json", JSON.stringify(products), function(error){
                if(error){
                    callback(error);
                }else{
                    callback(null)
                }
            })
        }
    })
}


function updateProduct(updateProductObject, callback){
    getProducts(function(err, products){
        if(err){
            callback(err);
        }else{
            const updatedProductObject = products.filter(function(element){
                if(element.image === updateProductObject.image){
                    element.name = updateProductObject.name,
                    element.price = updateProductObject.price,
                    element.stock = updateProductObject.stock,
                    element.details = updateProductObject.details
                }
                return element;
            })
            fs.writeFile("./public/products.json", JSON.stringify(updatedProductObject), function(error){
                if(error){
                    callback(error);
                }else{
                    callback(null)
                }
            })
        }
    })
}


function deleteProduct(deleteProductImage, callback){
    getProducts(function(err, products){
        if(err){
            callback(err);
        }else{
            const updatedProducts = products.filter(function(element){
                if(element.image !== deleteProductImage){
                    return element;
                }
            })
            fs.rm("public/"+deleteProductImage, function(err){
                if(err){
                    console.log(err);
                }
            })
            fs.writeFile("./public/products.json", JSON.stringify(updatedProducts), function(error){
                if(error){
                    callback(error);
                }else{
                    callback(null)
                }
            })
        }
    })
}


async function validate(email, id) {
    const info = await transporter.sendMail({
      from: '"Shoes store" <harshlalawathlhl@gmail.com>',
      to: email,
      subject: "Activate your shoes store account",
      html: `<h3>Dear customer,<a href= "http://localhost:3000/validate/${id}">Click here</a>! to activate your account</h3>`,
    }).then(function(){
        notifier.notify({
            title: 'Verification link send!',
            message: `Check ${email} mailbox and verify your account`,
            sound: true,
            wait: true
          })
    });
}



async function resetPassword(email, id) {
    const info = await transporter.sendMail({
      from: '"Shoes store" <harshlalawathlhl@gmail.com>',
      to: email,
      subject: "Reset your shoes store password",
      html: `<h3>Dear customer,<a href= "http://localhost:3000/resetpassword/${id}">Click here</a>! to reset your password</h3>`,
    }).then(function(){
        notifier.notify({
            title: 'Reset link send!',
            message: `Check ${email} mailbox and reset your password`,
            sound: true,
            wait: true
          })
    });
}