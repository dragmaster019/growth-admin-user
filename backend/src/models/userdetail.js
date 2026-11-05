let mong=require("mongoose");
let sch=mong.Schema({
    name:{type:String,
        default:"",
        maxlength:80,
    },
    email:{type:String,
        default:"",
        trim:true,
        lowercase:true,
        maxlength:254,
        unique:true,
    },
    Id:{
        type:Number,
        default:null,
    },
    points:{
        type:Number,
        default:0,
    },
    mobile:{
        type:Number,
        default:null,
    },
    pass:{
        type:String,
        default:"",
    },
    parent:{
        type:String,
        default:"",
    },
    // --- Referral / ternary-tree fields ---
    referralCode:{
        type:String,
        unique:true,
        sparse:true,
        index:true,
    },
    referredBy:{
        type:String,
        default:"",
    },
    position:{
        type:String,
        enum:["ROOT","LEFT","MIDDLE","RIGHT"],
        default:"ROOT",
    },
    role:{
        type:String,
        enum:["admin","user"],
        default:"user",
    },
    isFounder:{
        type:Boolean,
        default:false,
    },
    auth_key:{
        type:String,
        default:"",
    },
    resetTokenHash:{
        type:String,
        default:"",
        index:true,
        sparse:true,
    },
    resetTokenExpires:{
        type:Date,
        default:null,
    }
});

// Tree placement / downline queries filter on referredBy (optionally + position).
sch.index({ referredBy: 1, position: 1 });

module.exports=mong.model("usersdetail",sch);