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