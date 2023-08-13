const mongoose = require('mongoose');

module.exports.init = async function(){
    await mongoose.connect("mongodb+srv://ecommerceUser:RsvvCDzCJNqFGAwt@atlascluster.xxmyg3n.mongodb.net/ecommerceStore?retryWrites=true&w=majority");
    console.log("Successfully connected to DB");
}
