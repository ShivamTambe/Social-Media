const express = require("express");
const path = require("path");
const ejs = require("ejs");
const app = express();
const bodyparser = require('body-parser');
const mongoose = require("mongoose");
var multer = require('multer');
var fs = require('fs');
const { userInfo } = require("os");
// const sgMail = require('@sendgrid/mail')
const dotenv = require('dotenv');


dotenv.config();

const port = process.env.PORT || 5000;
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');


app.use(bodyparser.urlencoded({ extended: true }))
app.use(express.json());
mongoose.connect(process.env.MongoConnect, { useNewUrlParser: true });


const commentSchema = {
    uid : String,
    comments: []
};
const postSchema = {
    caption:String,
    likes:Number,
    img:
    {
        data: Buffer,
        contentType: String
    }
};

const PostsModel = mongoose.model("PostsModel", postSchema);
const commentModel = mongoose.model("commentModel", commentSchema);


var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
});

var upload = multer({
    storage: storage,
    limits: { fileSize: 2000000 } // limit file size to 2MB
});
// var upload = multer({ storage: storage });


app.post('/upload', upload.single('image'), (req, res, next) => {
    if (req.file.size > 2000000) {
        // Show danger message
        res.render('index', { message: 'File size should be less than 2MB', messageType: 'danger' });
        // Delete uploaded file
        fs.unlinkSync(req.file.path);
    }else{
        var obj = {
            caption: "My New Post",
            img:{
                data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
                contentType: 'image/png'
            }
        }
        PostsModel.create(obj)
            .then(item => {
                let newPost = new commentModel({
                    uid : item._id,
                    comment:["NICE"]
                })
                newPost.save();
                console.log('Item saved to database');
                res.redirect('/');
            })
            .catch(err => {
                console.log(err);
                res.status(400).send("Unable to save item to database");
        });
    }
    // PostsModel.create(obj, (err, item) => {
    //     if (err) {
    //         console.log(err);
    //     }
    //     else {
    //         // item.save();
    //         res.redirect('/');
    //     }
    // });
});

app.get("/",function(req,res){
    PostsModel.find().then(userinfo => {
        res.render("index",{message:"",items:userinfo});
    }).catch(err => console.log(err));
})
app.get("/login",function(req,res){
    res.render("login");
})
app.post("/pcomment",async function(req,res){
    let id = req.body.id;
    let comment = req.body.comment;
    console.log(id);
    await commentModel.findOneAndUpdate({ uid: id }, { $push: { comments: comment} },{ new: true}).then(comment => {
        PostsModel.find().then(result => {
            result.forEach(element => {
                if(element._id == id){
                    res.render("comment",{message:"",item:element,comments:comment.comments,image:element});
                }
            });
        }).catch(err => console.log(err));                   
    }).catch(err => console.log(err));
    // PostsModel.find().then(result => {
    //     result.forEach(async element => {
    //         if(element.uid == id){
    //             console.log("fnid");
                
    //         }
    //     });
    // }).catch(err => console.log(err));
})
app.post("/comment",function(req,res){
    let id = req.body.id;
    console.log(id);
    commentModel.find({ uid: id }).then(comment => {
        console.log(comment);
        PostsModel.find().then(result => {
            result.forEach(element => {
                if(element._id == id){
                    res.render("comment",{message:"",item:element,comments:comment[0].comments,image:element});
                }
            });
        }).catch(err => console.log(err));                   
    }).catch(err => console.log(err));
    // PostsModel.find().then(result => {
    //     result.forEach(element => {
    //         // console.log(element._id);
    //         if(element._id == id){
    //             res.render("comment",{message:"",item:element});
    //         }
    //     });
    // }).catch(err => console.log(err));
})
app.listen(port, function () {
    console.log("server is running on prot " + port);
})