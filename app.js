/**
 * Require libraries/modules
 */

const express = require('express');
const bodyparser = require ('body-parser')
const pg = require('pg');
const pug = require('pug');
const session = require('express-session');
const Sequelize = require('sequelize');



const app = express()

const connectionDatabase = "postgres://jolanda:postgres@localhost/jolanda";


/**
 * Set configurations
 */

app.set('views', 'src/views');
app.set('view engine', 'pug');
app.use(express.static('css'));
app.use(express.static('img'));
app.use(express.static('js'));
app.use('/' , bodyparser());


/**
 * Sequelize
 */

var sequelize = new Sequelize('jolanda', 'jo', null, {
    host: 'localhost',
    dialect: 'postgres',
    define: {
        timestamps: false
    }
});

// Create user

const User = sequelize.define('user', {
  firstname: Sequelize.STRING,
  lastname: Sequelize.STRING,  
  email: Sequelize.STRING,
  password: Sequelize.STRING
});

sequelize.sync()
  .then(() => User.create({
    firstname: 'name',
    lastname: 'lastname',
    email: 'janedoe',
    password: 'password'
  }))
  .then(jane => {
    console.log(jane.get({
      plain: true
    }));
  });
/**
 * Set sessions
 */

app.use(session({
    secret: 'oh wow very secret much security',
    resave: true,
    saveUninitialized: false
}))


// Route index
app.get('/', (req, res) => {
	res.render('index')
})


// Route profile page
app.get('/profile', function (request, response) {
    var user = request.session.user;
    console.log(user)
    console.log("test " + user.firstName)
    if (user === undefined) {
        response.redirect('/?message=' + 
    encodeURIComponent("Please log in to view your profile."));
    } 
    else {
        console.log('user', user)
        response.render('profile', 
        {
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname
        });
    }
});


// Route inlog page
app.post('/login', function (request, response) {
    if(request.body.email.length === 0) {
        console.log()
        response.redirect('/?message=' + encodeURIComponent("Please fill out your email address."));
        return;
    }

    if(request.body.password.length === 0) {
        response.redirect('/?message=' + encodeURIComponent("Please fill out your password."));
        return;
    }

    console.log("test1")

    User.findOne({
        where: {
            email: request.body.email
        }
    }).then(function (user) {
        console.log("Teeeeeest: " + user)
        if (user !== null && request.body.password === user.password) {
            request.session.user = user;
            console.log("logged in")
            response.redirect('/profile');
        } else {
            response.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
        }
    }, function (error) {
        response.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
    });
});


//Route logout page
app.get('/logout', function (request, response) {
    request.session.destroy(function(error) {
        if(error) {
            throw error;
        }
        response.redirect('/?message=' + encodeURIComponent("Successfully logged out."));
    })
});

// // Route signup
// app.post('/signup', (req, res) => {
//     res.render('signup')
// })


app.post('/signup', function(req,res){
    var inputname = req.body.firstName;
    var inputname = req.body.lastName;
    var inputname = req.body.email;
    var inputpassword = req.body.password;
    console.log("I am receiving following user credentials: "+inputname+" "+inputpassword);
    // Creating a new user
    sequelize
        .sync({force: true})
        .then(function(){
            return User.create({
            fisrtName: inputname,
            lastName: inputname,
            email: inputemail,
            password: inputpassword 
            });
    }).then( () => {
        res.redirect('/?message=' + encodeURIComponent("Your user got successfully created. Log in below."));
    });
})

const server = app.listen(3000, function () {
  console.log('Server running at http://localhost:' + server.address().port)
})