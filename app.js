const express=require('express');
const app=express();
const userModel=require("./models/user");
const postModel=require("./models/post");

 const cookieParser=require('cookie-parser');
 const bcrypt=require('bcrypt');
  const jwt=require('jsonwebtoken');


 app.set("view engine","ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());



app.get('/',function(req,res){
    res.render("index");


});

 app.get('/login',function(req,res){
     res.render("login");

 });
 app.get('/profile',isLoggedIn,async function(req,res){
    let user=await userModel.findOne({email:req.user.email}).populate("posts");
    
    res.render("Profile",{user});
 
 })
 app.get('/like/:id',isLoggedIn,async function(req,res){
   let post=await postModel.findOne({_id:req.params.id}).populate("posts");
   post.like.push(req.user.userid);
   await post.save();
   res.redirect("/profile");

})
 app.post('/post',isLoggedIn,async function(req,res){
   let user=await userModel.findOne({email:req.user.email});
   let {content}=req.body;
   let post=await postModel.create({
      user:user._id,
      content:content
   });
   user.posts.push(post._id);
   await user.save();
   res.redirect("/profile");

});


 app.post('/register', async (req,res)=>{
     let {email,password,username,name,age}=req.body;

     let user=await userModel.findOne({email});
     if(user) return res.status(500).send("user already registered");

     bcrypt.genSalt(10,  (err,salt)=>{
         bcrypt.hash(password,salt,async(err,hash)=>{
      let user= await userModel.create({
        username,
        email,
        age,
        name,
        password:hash
     });
       let token=jwt.sign({email: email, userid: user._id},"shhhh");
       res.cookie("token",token);
       res.send("registered")



           }) 
        })
    });




app.post('/login', async (req,res)=>{
        let {email,password,username,name,age}=req.body;
    
        let user=await userModel.findOne({email});
        if(!user) return res.status(500).send("something went wrong");
        
        bcrypt.compare(password,user.password,function(err,result){;
        if(result){
         let token=jwt.sign({email: email, userid: user._id},"shhhh");
         res.cookie("token",token);
          res.status(200).redirect("/profile");
        }
        else res.redirect("/login");
})
});

   app.get('/logout',(req,res)=>{
    res.cookie("token","")
    res.redirect("/login");
   })   
   function isLoggedIn(req,res,next){
    if(req.cookies.token==="")res.send("you most be logged in");
     else{
        let data=jwt.verify(req.cookies.token,"shhhh");
        req.user=data;
     }
     next();
   }         
    
app.listen(3000);