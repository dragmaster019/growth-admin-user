let mong=require("mongoose");
let sch=mong.Schema({
    Product_name:{type:String,
        default:"",
    },
    Price:{
        type:Number,
        default:null,
    },
    Quantity:{
        type:Number,
        default:0,
    },
    Description:{
        type:String,
        default:"",
    },
    Image:{
        type:String,
        default:"",
    },

});

module.exports=mong.model("product_detail",sch);