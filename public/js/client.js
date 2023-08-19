const parentProductDiv = document.getElementById("products-container");
const loadMoreButton = document.getElementById("load-more-button");
let visibleProductCount = 5;
let showProductCount = 0;

let modal = document.getElementById("myModal");
let span;

if(loadMoreButton){
    showProducts();
    loadMoreButton.addEventListener("click", () => {
        visibleProductCount += 5;
        showProducts();
    });
}


function addProductToDOM(name, image, quantity, details){

        const productDiv = document.createElement("div");
        productDiv.classList.add("product");

        const img = document.createElement("img");
        img.src = image;
        productDiv.appendChild(img);

        const productName = document.createElement("p");
        productName.textContent = name;
        productDiv.appendChild(productName);

        const viewDetailsButton = document.createElement("button");
        viewDetailsButton.textContent = "View Details";
        viewDetailsButton.classList.add("button");
        viewDetailsButton.setAttribute("onclick", "handleViewDetailsButton(this)")
        
        productDiv.appendChild(viewDetailsButton);

        parentProductDiv.appendChild(productDiv);
}


function showProducts(){
    fetch("/products")
    .then(function(response){
        if(response.status !== 200){
            throw new Error("Something went wrong in show products");
        }
        return response.json();
    }).then(function(products){
        products = products.filter(function(element,i){
            if(visibleProductCount>showProductCount && i>=showProductCount){
                showProductCount++;
                return element;
            }
        })
        products.forEach(function(element) {
            addProductToDOM(element.name,element.image, element.quantity, element.details );
        });
    }).catch(function(err){
        alert(err);
    })
}


function handleViewDetailsButton(clickedItem){
    let clickedProductTitle = clickedItem.parentElement.getElementsByTagName("p")[0].innerText;
    showPopup(clickedProductTitle);
    modal.style.display = "block";
    span = document.getElementsByClassName("close")[0];
    span.onclick = function() {
        modal.style.display = "none";
    }
}


function showPopup(clickedProductTitle){
    fetch("/products")
    .then(function(response){
        if(response.status !== 200){
            throw new Error("Something went wrong in show popup");
        }
        return response.json();
    }).then(function(products){
        products = products.filter(function(element){
            if(clickedProductTitle === element.name){
                return element;
            }
        })
        const element = products[0];
            popupContent(element.name,element.image, element.price, element.details );
    }).catch(function(err){
        alert(err);
    })
}

function popupContent(name, image, price, details){
    document.getElementById("modal-h2").innerText = name;
    document.getElementById("modal-img").setAttribute("src", image);
    document.getElementById("modal-h3").innerText = price;
    document.getElementById("modal-p").innerText = details;
}

const input1 = document.getElementById('newPassword');
const input2 = document.getElementById('confirmPassword');
const signupPasswordInput = document.getElementById("signup-password");

function myFunction() {
    if (input1.type === "password") {
      input1.type = "text";
      input2.type = "text";
    } else {
      input1.type = "password";
      input2.type = "password";
    }
  }

const submitButton = document.getElementById('reset-button');
const signupSubmitButton = document.getElementById('signup-submit-button');

input2?.addEventListener('input', checkInputs);
signupPasswordInput?.addEventListener('input', validatePassword);
    
function validatePassword(){
    console.log(signupPasswordInput.value);
    if(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{8,15}$/.test(signupPasswordInput.value)){
        signupSubmitButton.disabled = false;
        document.getElementById("signup-strong-password").innerText = "";
    } else {
        signupSubmitButton.disabled = true;
        document.getElementById("signup-strong-password").innerText = "Must contain a uppercase, lowercase, number and minimum 8 characters";
    }
}    


function checkInputs() {
    if (input1.value === input2.value) {
        if(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{8,15}$/.test(input1.value)){
            submitButton.disabled = false;
            document.getElementById("strong-password-p").innerText = "";
        } else {
            submitButton.disabled = true;
            document.getElementById("strong-password-p").innerText = "Must contain a uppercase, lowercase, number and minimum 8 characters";
        }
        document.getElementById("reset-error-p").innerText = "";
    }else{
        submitButton.disabled = true;
        document.getElementById("reset-error-p").innerText = "Password doesn't match";
    }
}