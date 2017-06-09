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
// app.use(express.session({secret: 'gaatjsformakebettersecurity'}));


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

// Create models

const User = sequelize.define('user', {
  firstname: Sequelize.STRING,
  lastname: Sequelize.STRING,  
  email: Sequelize.STRING,
  password: Sequelize.STRING
});

const Message = sequelize.define('message', {
    title: Sequelize.STRING,
    body: Sequelize.STRING
});

const Comment = sequelize.define('comment', {
    body: Sequelize.STRING,
    messageId: Sequelize.INTEGER
});

Message.belongsTo(User)
User.hasMany(Message)
Message.hasMany(Comment)

sequelize.sync({force: true})
  .then(() => User.create({
    firstname: 'name',
    lastname: 'lastname',
    email: 'janedoe@gmail.com',
    password: 'password'
  }))
  .then(jane => {
    console.log(jane.get({
      plain: true
    }))
  })
  .then(() => Message.create({
    title: 'title',
    body: 'message'
  }))
  .then(message => {
    console.log(message.get({
      plain: true
    }));
  })
  .catch( e => console.log(e));


  
/**
 * Configure sessions
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
    console.log("test " + user.firstname)
    if (user === undefined) {
        response.redirect('/?message=' + 
    encodeURIComponent("Please log in to view your profile."));
    } 
    else {
        console.log('user', user)

        Message.findAll({
            where: {
                userId: user.id
            },
            include: [{
                model: Comment,
            }]
        })
        .then( blogPosts => { 
            console.log(blogPosts);
         //Promis

         Comment.findAll({
            where: {
                messageId: blogPosts.id
            }

         }).then(comments => {
                response.render('profile', 
            {   
                message: blogPosts,
                comments: comments,
                email: user.email,
                firstname: user.firstname,
                lastname: user.lastname,
            })

         } )
            
        })
        
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


app.post('/signup', function(req,res){
    var inputname = req.body.firstname;
    var inputlastname = req.body.lastname;
    var inputemail = req.body.email;
    var inputpassword = req.body.password;
    console.log("I am receiving following user credentials: "+inputname+" "+inputpassword+" "+inputname+" "+inputlastname);
    // Creating a new user
    User.create({
        firstname: inputname,
        lastname: inputlastname,
        email: inputemail,
        password: inputpassword 
    })
    .then( () => {
        res.redirect('/?message=' + encodeURIComponent("Your user got successfully created. Log in below."));
    });
})

//route 2 post Tweet page
app.get('/messages', (req, res) => { // handle post page request
    res.render('messages')
});

// Route create message
app.post('/create', function(req, res){

    const inputtitle = req.body.title;
    const textareamessage = req.body.message;
    console.log('req.session', req.session)
    Message.create({
        title: inputtitle,
        body: textareamessage,
        userId: req.session.user.id
    })
    .then( () => {
        // const id = req.body.id;
        // console.log("IDENTIFIER ALERT "+id);
        req.session.content = {
            title: req.body.title,
            Message: req.body.message
        }
        res.redirect('/profile?message=' + encodeURIComponent("You created successfully a post")); // title: message.title, message: message.message
    });
})

//route Comment
app.post('/comment', (req, res) => { // handle post page request
    const textareacomment = req.body.comment;
    const messageIdentifier = req.body.message_id
    const user = req.session.user;

    console.log("Message Identifier should be"+ messageIdentifier);
    console.log('Test textareacomment '+ textareacomment)

    Comment.create({
        body: textareacomment,
        messageId: messageIdentifier
    })

    res.redirect('/profile?message=' + encodeURIComponent("You created successfully a post")); // title: message.title, message: message.message

});



const server = app.listen(3000, function () {
  console.log('Server running at http://localhost:' + server.address().port)
})