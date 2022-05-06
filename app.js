const express = require('express');
const bodyparser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;
require('./model/db');
const {BookModel,userModel} = require('./model/schema');
const hbs = require('hbs');
const path = require('path');
const async = require('hbs/lib/async');
var alert = require('alert');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');


app.use(bodyparser.json());
app.use(express.urlencoded({extended:false}));

const staticPath = path.join('__dirname',"../public");
console.log(staticPath);
app.use(express.static(staticPath));


app.use(session({
	secret: "verygoodsecret",
	resave: false,
	saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

//views engine

app.set('view engine','hbs');
app.set('views','./views');

//Insertion of Data(CREATE OPERATION)
app.get('/insert',isAuthenticate,(req,res)=>{
    res.render('Insert');
});

app.get('/',(req,res)=>{
    res.render('home');
});

app.get('/login',(req,res)=>{
    res.render('login');
})



app.post('/insert',async(req,res)=>{
    var name = req.body.name;
    var sold = req.body.sold;
    try{
        const insertDatas = new BookModel({
            name : `${name}`,
            sold : `${sold}`,
        });
        await insertDatas.save()
        res.redirect('/list');
    }
    catch(err){
        alert("Already existed");
    }
    

});




//Read Operation
app.get('/list',isAuthenticate,async(req,res)=>{
    try{
        const datas = await BookModel.find();
        res.render('datalist',{list:datas});
    }
    catch(err){
        res.send("error", +err);
    }
});

app.get("/list/edit/:id",isAuthenticate,async(req,res)=>{
    const id = req.params.id;
    BookModel.findById(id, function (err, docs) {
        if (err){
            console.log(err);
        }
        else{
            console.log(docs);
            console.log(req.params.id);
            res.render('update',{
                dataList:docs,
                ide:req.params.id,
            });   
        }
    });
  
});

app.post("/list/edit/:id",async(req,res)=>{
    try{
    const result = await BookModel.findByIdAndUpdate(req.params.id,req.body);
    console.log(result);
    console.log(req.body);
    res.redirect('/list');
    }
    catch(err){
    console.log(err);
    }
})


app.get("/list/delete/:id",isAuthenticate,(req,res)=>{
    const ids = req.params.id;
    res.render('delete',{da:ids});
})



//local streightegy
passport.use(new LocalStrategy(
    function(username, password, done) {
      userModel.findOne({ username: username }, function (err, user) {
         var passwords = user.password;
         console.log(password);
         console.log(passwords);
        if (err) { return done(err); }
        if (!user) { return done(null, false,{message:"Incorrect Username."}); }
        if (passwords!=password) { return done(null, false,{message:"Incorrect Password."}); }
        console.log(user);
        return done(null, user);
      });
    }
));



//serializeUser and deserialize
passport.serializeUser((user,done)=>{
    if(user){
        return done(null,user.id);
    }
    return done(null,false);
});


passport.deserializeUser((id,done)=>{
    userModel.findById(id,(err,user)=>{
        if(err) return done(null,false);
        return done(null,user);
    })
});

app.get('/logout',(req,res)=>{
    res.redirect('/login');
});

function isAuthenticate(req,res,done){
    console.log(req.user);
    if(req.user){
        return done();
    }
    else{
        res.redirect('/login');
    }
}

// function isAuthenticate(req,res,next){
//     if(req.isAuthenticate()){
//         return next();
//     }
//     return res.redirect('/login');
// }


app.post("/list/delete/:id",async(req,res)=>{
    try{
        const resut = await BookModel.findByIdAndDelete(req.params.id);
        console.log(resut);
        console.log("deleted");
        res.redirect('/list');
    }
    catch(error){
        console.log(error);
    }

});

app.get('/register',(req,res)=>{
    res.render('registration');
})

//registration of user

app.post('/register',(req,res,done)=>{
    userModel.findOne({username:req.body.username},(err,user)=>{
        if(err) done(null,false);
        else if(user) res.redirect('/login');
        else{
                const data =new userModel({
                    username:req.body.username,
                    password:req.body.password
                });
                data.save().then((datas)=>console.log(datas)).catch((err)=>console.log(err));
                res.redirect('/login');
        }
    })
});



//authenticate
app.post('/login', 
  passport.authenticate('local',{ failureRedirect: '/login', failureMessage: true }),
  function(req, res) {
    res.redirect('/insert');
  });

const crudRouter = require('./Router/crud_router');
app.use(crudRouter);

//The application is running on the port 3000
app.listen(PORT,()=>console.log(`The Application is running on the port ${PORT}`));