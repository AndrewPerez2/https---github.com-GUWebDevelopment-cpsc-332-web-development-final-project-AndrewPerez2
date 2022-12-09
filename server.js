//<!-- GU CPSC 332 Example NodeJS server with Mongoose connecting to MongoDB -->

//used for our express module / routing
//https://expressjs.com/en/guide/routing.html
const express = require("express");
const app = express();

//method in express to recognize the incoming Request Object as strings or arrays.
//used for our POST method
app.use(express.urlencoded({
    extended: true
}));
app.use(express.static("public"));

//we want to use embedded javascript "template" files
app.set("view engine", "ejs");

//app.use(express.static("public"));

const PORT = process.env.PORT || 8080; //port we will connect to. process.evn.PORT used for Heroku later

//start listening for requests on the specified port
app.listen(PORT, function () {
    console.log("Server listening on port " + PORT);
});

//START of Mongoose configuration code
//MongoDB / Mongoose section of code
//used for our MongoDB database connection
//https://mongoosejs.com/docs/guide.html
const mongoose = require("mongoose");

//configure our schema to use with our database
const emailSchema = new mongoose.Schema({
    username: String,
    email: String,
    message: String,
});

const EmailResult = mongoose.model("EmailResult", emailSchema);

const movieSchema = new mongoose.Schema({
    index: String,
    title: String,
    video: String,
    director: String,
    year: String,
    rating: String,
    time: String,
    img: String,
    summary: String,
});

const MovieResult = mongoose.model("MovieResult", movieSchema);

//used for our database connections
const url = "mongodb://127.0.0.1:27017/"; //part of the database connection string
const DB_NAME = "MovieDB"; //database name

//connecting to our database.
//NOTE: for some reason localhost would not work for me but the localhost IP address worked.
mongoose.connect(url + DB_NAME, { useNewUrlParser: true });
//END of Mongoose configuration code

//START User Authentication

//used for encryption (salting and hashing our passwords)
const bcrypt = require("bcrypt");

//schema for our user
var UserSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
    }
});

//bcrypt methods
//hashing a password before saving it to the database
UserSchema.pre('save', function (next) {
    var user = this;
    //https://stackoverflow.com/questions/6832445/how-can-bcrypt-have-built-in-salts
    bcrypt.hash(user.password, 10, function (err, hash) {
        if (err) {
            return next(err);
        }
        user.password = hash;
        next();
    })
});

//Method to authenticate input against database
UserSchema.statics.authenticate = function (userData, req, res) {
    UserCredentials.findOne({
        username: userData.username
    })
        .exec(function (err, user) {
            if (err) {
                return res.render("error.ejs", {
                    errors: 2
                });
            } else if (!user) {
                var err = new Error('User not found.');
                err.status = 401;
                //error
                return res.render("error.ejs", {
                    errors: 2
                });
            }
            //if we get here, we did not hit an error...
            bcrypt.compare(userData.password, user.password, function (err, result) {
                if (result === true) { //password hashes match
                    //set up session cookie
                    req.session.userId = user._id;
                    req.session.username = req.body.username;
                    return res.redirect('/');
                } else {
                    return res.redirect("/login");
                }
            })
        });
}
//model for our user
const UserCredentials = mongoose.model("UserCredential", UserSchema);

//session configuration
const session = require('express-session');
//use sessions for tracking logins
app.use(session({
    secret: "This is a secret string that should be stored in an environment variable!",
    resave: true,
    saveUninitialized: false
}));


//END user Authentication

const VALID_AGREE_VALUES = ["Yes", "Maybe", "No"];

//add path to root
//root path -- could probably change index.html to the /login HTML content, but we want error output
app.get("/", function (req, res) {
    return res.redirect("/index");
});

app.route("/index")
    .get((req, res) => {
        let userInfo = {
            userID: req.session.userId,
            username: req.session.username,
        };
        console.log(userInfo)
        res.render("../public/index.ejs", userInfo);
    });

app.route("/content/:index")
    .get((req, res) => {
        let index = req.params.index;
        MovieResult.findOne({index: index }, function (err, docs) {
            if (err){
                console.log(err)
            }
            else{
                console.log("Found result: ");
                console.log(docs)

                //Build our object to pass on to our ejs to be rendered as HTML
                let movieInfo = {
                    title: docs.title,
                    video: docs.video,
                    director: docs.director,
                    year: docs.year,
                    rating: docs.rating,
                    time: docs.time,
                    img: docs.img,
                    summary: docs.summary,
                };
                res.render("content.ejs", movieInfo);
            }
        });
    });
//CRUD
//CREATE
//READ
//respond to GET requests at specified URL, e.g., /localhost:8080/show/
app.route("/form")
    .get((req, res) => {
        if (req.session.userId) {
            let userInfo = {
                userID: req.session.userId,
                username: req.session.username,
            };
            console.log(userInfo)
            res.render("form.ejs", userInfo);
        } else {
            res.redirect("/login");
        }
    })
    .post(function (req, res) {  
        if (req.session.userId) {    
            validateSession(req.session.userId, res);
            console.log("Email Data:");
            console.log(req.body);
            let result = EmailResult(
                {
                    username: req.body.username,
                    email: req.body.email,
                    message: req.body.message
                });

            //Saving the model data to our database as configured above
            result.save(
                (err, result) => {
                    if (err) {
                        //note that we are not handling this error! You'll want to do this yourself!
                        return console.log("Error: " + err);
                    }
                    console.log(`Success! Inserted data with _id: ${result._id} into the database.`);
                    console.log(result._doc);
                    res.redirect("/index");
                });
        } else {
            res.redirect("/login");
        }
    });
    

//UPDATE
app.route("/edit/")
    .get((req, res) => { //respond to GET requests at specified URL, e.g., /localhost:8080/edit/someIdValue
        if (req.session.userId) {
            //authenticate        
            validateSession(req.session.userId, res);
            res.render("edit.ejs");
        } else { //no session data, log in first
            return res.redirect("/login");
        }
    })
    .post(function (req, res) { //respond to POST requests at specified URL, e.g., /localhost:8080/edit/someIdValue

        if (req.session.userId) {
            if (req.body.username &&
                req.body.password &&
                req.body.passwordConf && req.body.passwordConf == req.body.password) {
                var userData = UserCredentials({
                    username: req.body.username,
                    password: req.body.password,
                });
                //use schema.create to insert data into the db
                userData.save(function (err, user) {
                    if (err) {
                        let errors = {
                            usernameError: "Invalid username"
                        }
                        res.render("edit.ejs", errors);
                    } else {
                        UserCredentials.deleteOne(
                            { _id: req.session.userId },
                            (err, result) => {
                                console.log(result);
                                console.log(`${result.deletedCount} record deleted`);
                                console.log(user);
                            });
                        req.session.destroy(function (err) {
                            if (err) {
                                return next(err);
                            } else {
                                return res.redirect('/login');
                            }
                        });
                    }
                });
            } else {
                return res.redirect("/edit");
            }

        } else { //no session data, log in first
            return res.redirect("/login");
        }

    });

//DELETE
//respond to GET requests at specified URL, e.g., /localhost: 8080 / delete /someIdValue/
//clearly this is not safe! It just deletes the matching record with no validation
app.route("/delete")
    .get((req, res) => {
        if (req.session.userId) {
            //authenticate        
            validateSession(req.session.userId, res);
            UserCredentials.deleteOne(
                { _id: req.session.userId },
                (err, result) => {
                    console.log(result);
                    console.log(`${result.deletedCount} record deleted`);
                    res.redirect("/logout");
                });

        } else { //no session data, log in first
            return res.redirect("/");
        }
    });

//for user authentication
//POST route for creating a user
app.route("/register")
    .get((req, res) => {
        let errors = {
            usernameError: ""
        }
        res.render("register.ejs", errors);
    })
    .post((req, res) => {
        if (req.body.username &&
            req.body.password &&
            req.body.passwordConf && req.body.passwordConf == req.body.password) {
            var userData = UserCredentials({
                username: req.body.username,
                password: req.body.password,
            });
            //use schema.create to insert data into the db
            userData.save(function (err, user) {
                if (err) {
                    let errors = {
                        usernameError: "Invalid username"
                    }
                    res.render("register.ejs", errors);
                } else {
                    return res.redirect("/login");
                }
            });
        } else {
            return res.redirect("/register");
        }
    });

app.route("/login")
    .get((req, res) => {
        let errors = {
            usernameError: ""
        }
        res.render("login.ejs", errors);
    })
    .post((req, res) => {
        if (req.body.username &&
            req.body.password) {
            var userData = {
                username: req.body.username,
                password: req.body.password,
            }
            let temp = UserCredentials.authenticate(userData, req, res);
            let temp2 = 0;
        }
    });

function validateSession(_id, res) {
    if (_id != "" && _id != undefined) {
        //authenticate
        UserCredentials.findOne({
            _id: _id
        }).exec(function (err, user) {
            if (err) {
                return res.render("error.ejs", {
                    errors: 2
                });
            } else if (!user) {
                var err = new Error('User not found.');
                err.status = 401;
                //error
                return res.render("error.ejs", {
                    errors: 2
                });
            }
            //if authenticated give access 
            return;
        });

    } else {
        //redirect to log in
        return res.redirect("/login");
    }
};

// GET /logout
app.get('/logout', function (req, res, next) {
    if (req.session) {
        // delete session object
        req.session.destroy(function (err) {
            if (err) {
                return next(err);
            } else {
                return res.redirect('/');
            }
        });
    }
});
