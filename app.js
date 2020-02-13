const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const uniqueValidator = require('mongoose-unique-validator');
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const methodOverride = require("method-override");


const homeStartingContent = "Ovaj blog je zamišljen da bude kao dnevnik onoga kroz što prolazim dok radim kao nastavnica u školi, učim za promjenu profesije, nalazim prve poslove u novoj profesiji, pokušavam preživjeti šetnje sa svojom `psinom` i uz to gradim svoju-kućicu-svoju-slobodicu.";
const aboutContent = "Tko sam? 33-godišnja žena koja živi u Hrvatskoj. Bez riješenog stambenog pitanja, s poslom koji nije siguran. Imam udomljenog ženskog psa s kojim je svaka šetnja izazov. Na putu sam promjene profesije i zauvijek napuštam prosvjetu koja nastavnike tretira kao `državnog neprijatelja`.";
const contactContent = "Možete me kontaktirati na: ";
const korisnik = "";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
app.use(methodOverride("_method"));

app.use(session({
  secret: "",
  resave: true,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb+srv://@cluster0-wwrbr.mongodb.net/blog", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true
  },
  password: String,
  email: {
    type: String,
    unique: true
  }
});

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  date: {
    type: Date,
    default: Date.now
  },
  author: String,
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment"
  }]
});

const commentSchema = new mongoose.Schema({
  content: String,
  date: {
    type: Date,
    default: Date.now
  },
  author: String,
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(uniqueValidator);

const User = new mongoose.model("User", userSchema);
const Post = new mongoose.model("Post", postSchema);
const Comment = new mongoose.model("Comment", commentSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", function (req, res) {

  if (req.session.passport === undefined) {

    var korisnik = "";

    Post.find({}).sort({
      date: -1
    }).exec(function (err, posts) {
      res.render("home1", {
        startingContent: homeStartingContent,
        posts: posts,
        korisnik: korisnik
      });
    });
  } else if (req.session.passport.user === "") {

    var korisnik = req.session.passport.user;

    Post.find({}).sort({
      date: -1
    }).exec(function (err, posts) {
      res.render("home2", {
        startingContent: homeStartingContent,
        posts: posts,
        korisnik: korisnik
      });
    });
  } else {

    var korisnik = req.session.passport.user;

    Post.find({}).sort({
      date: -1
    }).exec(function (err, posts) {
      res.render("home", {
        startingContent: homeStartingContent,
        posts: posts,
        korisnik: korisnik
      });
    });
  }
});

app.get("/about", function (req, res) {

  if (req.session.passport === undefined) {
    var korisnik = "";
    res.render("about1", {
      aboutContent: aboutContent,
      korisnik: korisnik
    });
  } else {
    var korisnik = req.session.passport.user;
    res.render("about", {
      aboutContent: aboutContent,
      korisnik: korisnik
    });
  }

});

app.get("/contact", function (req, res) {

  if (req.session.passport === undefined) {
    var korisnik = "";
    res.render("contact1", {
      contactContent: contactContent,
      korisnik: korisnik
    });
  } else {
    var korisnik = req.session.passport.user;
    res.render("contact", {
      contactContent: contactContent,
      korisnik: korisnik
    });
  }

});

app.get("/compose", function (req, res) {

  if (req.session.passport === undefined) {
    var korisnik = "";
    res.render("login", {
      korisnik: korisnik
    });
  } else {
    var korisnik = req.session.passport.user;
    res.render("compose", {
      korisnik: korisnik
    });
  }

});

app.post("/compose", function (req, res) {

  if (req.session.passport === undefined) {
    res.redirect("/login");
  } else {
    const post = new Post({
      title: req.body.postTitle,
      content: req.body.postBody,
      author: req.session.passport.user
    });

    post.save(function (err) {
      if (!err) {
        res.redirect("/");
      }
    });
  }

});

app.get("/posts/:postId", function (req, res) {
  const requestedPostId = req.params.postId;

  if (req.session.passport === undefined) {

    Post.findOne({
      _id: requestedPostId
    }).populate("comments").exec(function (err, post) {
      Comment.populate(post.comments, {
        path: "comments"
      }, function (err, comments) {
        post.comments = comments;
        for (i = 0; i < comments.length; i++) {}

        res.render("post1", {
          title: post.title,
          content: post.content,
          date: post.date.toDateString(),
          korisnik: korisnik,
          requestedPostId: requestedPostId,
          comments: comments
        });
      });
    });
  } else if (req.session.passport.user === "") {
    const korisnik = req.session.passport.user;
    Post.findOne({
      _id: requestedPostId
    }).populate("comments").exec(function (err, post) {
      Comment.populate(post.comments, {
        path: "comments"
      }, function (err, comments) {
        post.comments = comments;
        for (i = 0; i < comments.length; i++) {}

        res.render("post2", {
          title: post.title,
          content: post.content,
          date: post.date.toDateString(),
          korisnik: korisnik,
          requestedPostId: requestedPostId,
          comments: comments
        });
      });
    });
  } else {
    const korisnik = req.session.passport.user;
    Post.findOne({
      _id: requestedPostId
    }).populate("comments").exec(function (err, post) {
      Comment.populate(post.comments, {
        path: "comments"
      }, function (err, comments) {
        post.comments = comments;
        for (i = 0; i < comments.length; i++) {}

        res.render("post", {
          title: post.title,
          content: post.content,
          date: post.date.toDateString(),
          korisnik: korisnik,
          requestedPostId: requestedPostId,
          comments: comments
        });
      });
    });
  }
});


app.get("/posts/:postId/comment", function (req, res) {
  var korisnik = req.session.passport.user;
  const requestedPostId = req.params.postId;

  if (req.session.passport === undefined) {
    res.redirect("/login");
  } else {
    Post.findOne({
      _id: requestedPostId
    }, function (err, post) {
      var title = post.title;
      res.render("comment", {
        korisnik: korisnik,
        requestedPostId: requestedPostId,
        title: title
      });
    });
  }
});

app.post("/posts/:postId/comment", function (req, res) {
  const requestedPostId = req.params.postId;

  if (req.session.passport === undefined) {
    res.redirect("/login");
  } else {
    Post.findOne({
      _id: requestedPostId
    }, function (err, post) {
      const comment = new Comment({
        content: req.body.content,
        author: req.session.passport.user,
        post: requestedPostId
      });

      comment.save(function (err) {
        if (!err) {

          post.comments.unshift(comment);
          post.save();

          res.redirect("/posts/" + requestedPostId);
        }
      });
    });
  }
});

app.get("/posts/:postId/edit", function (req, res) {
  const requestedPostId = req.params.postId;
  var korisnik = req.session.passport.user;
  if (req.session.passport.user === "") {
    Post.findOne({
      _id: requestedPostId
    }, function (err, post) {
      const title = post.title;
      const content = post.content;
      res.render("compose2", {
        korisnik: korisnik,
        requestedPostId: requestedPostId,
        title: title,
        content: content
      });
    });

  } else {
    res.redirect("/login");
  }
});

app.put("/posts/:postId/edit", function (req, res) {
  const requestedPostId = req.params.postId;
  if (req.session.passport.user === "") {
    var korisnik = req.session.passport.user;
    Post.findOneAndUpdate({
      _id: requestedPostId
    }, {
      $set: {
        content: req.body.postBody,
        title: req.body.postTitle
      }
    }, {
      new: true
    }, function (err, comment) {
      if (!err) {
        console.log("Uspješno editiran post");
      }
      res.redirect("/posts/" + requestedPostId);
    });
  } else {
    res.redirect("/");
  }
});

app.get("/posts/:postId/delete", function (req, res) {
  const requestedPostId = req.params.postId;
  if (req.session.passport.user === "") {
    var korisnik = req.session.passport.user;
    Post.findById(requestedPostId, function (err, foundPost) {
      res.render("delete2", {
        korisnik: korisnik,
        requestedPostId: requestedPostId,
        post: foundPost
      });
    });
  } else {
    res.redirect("/");
  }
});

app.delete("/posts/:postId/delete", function (req, res) {
  const requestedPostId = req.params.postId;
  var korisnik = req.session.passport.user;
  Post.findOneAndDelete({
    _id: requestedPostId
  }, function (err, res) {
    if (!err) {
      console.log("Uspješno obrisan post");
    }
  });
  res.redirect("/");
});

app.get("/posts/:postId/comment/:commentId/:commentAuthor/edit", function (req, res) {
  const requestedPostId = req.params.postId;
  const requestedCommentId = req.params.commentId;
  const requestedCommentAuthor = req.params.commentAuthor;
  var korisnik = req.session.passport;

  if (req.session.passport.user === "") {
    var korisnik = req.session.passport.user;
    Comment.findById(requestedCommentId, function (err, foundComment) {

      res.render("edit", {
        korisnik: korisnik,
        requestedPostId: requestedPostId,
        requestedCommentId: requestedCommentId,
        requestedCommentAuthor: requestedCommentAuthor,
        comment: foundComment
      });
    });
  } else if (req.session.passport === undefined || req.session.passport.user != requestedCommentAuthor) {
    res.render("forbiden", {
      korisnik: korisnik,
      requestedPostId: requestedPostId,
      korisnikKomentara: requestedCommentAuthor
    });

  } else {
    var korisnik = req.session.passport.user;
    Comment.findById(requestedCommentId, function (err, foundComment) {

    });
  }
});

app.put("/posts/:postId/comment/:commentId/:commentAuthor/edit", function (req, res) {
  const requestedPostId = req.params.postId;
  const requestedCommentId = req.params.commentId;
  const requestedCommentAuthor = req.params.commentAuthor;
  var korisnik = req.session.passport;

  if (req.session.passport.user === "") {
    var korisnik = req.session.passport.user;
    Comment.findOneAndUpdate({
      _id: requestedCommentId
    }, {
      $set: {
        content: req.body.content
      }
    }, {
      new: true
    }, function (err, comment) {
      if (!err) {
        console.log("Uspješno editiran komentar");
      }
      res.redirect("/posts/" + requestedPostId);
    });
  } else if (req.session.passport === undefined || req.session.passport.user != requestedCommentAuthor) {
    var korisnik = req.session.passport.user;
    res.render("forbiden", {
      korisnik: korisnik,
      requestedPostId: requestedPostId,
      korisnikKomentara: requestedCommentAuthor
    });
  } else {
    var korisnik = req.session.passport.user;
    Comment.findOneAndUpdate({
      _id: requestedCommentId
    }, {
      $set: {
        content: req.body.content
      }
    }, {
      new: true
    }, function (err, comment) {
      if (!err) {
        console.log("Uspješno editiran komentar");
      }
      res.redirect("/posts/" + requestedPostId);
    });
  }
});

app.get("/posts/:postId/comment/:commentId/:commentAuthor/delete", function (req, res) {
  const requestedPostId = req.params.postId;
  const requestedCommentId = req.params.commentId;
  const requestedCommentAuthor = req.params.commentAuthor;
  var korisnik = req.session.passport;

  if (req.session.passport.user === "") {
    var korisnik = req.session.passport.user;
    Comment.findById(requestedCommentId, function (err, foundComment) {

      res.render("delete", {
        korisnik: korisnik,
        requestedPostId: requestedPostId,
        requestedCommentId: requestedCommentId,
        requestedCommentAuthor: requestedCommentAuthor,
        comment: foundComment
      });
    });
  } else if (req.session.passport === undefined || req.session.passport.user != requestedCommentAuthor) {
    res.render("forbiden", {
      korisnik: korisnik,
      requestedPostId: requestedPostId,
      korisnikKomentara: requestedCommentAuthor
    });
  } else {
    var korisnik = req.session.passport.user;
    Comment.findById(requestedCommentId, function (err, foundComment) {

      res.render("delete", {
        korisnik: korisnik,
        requestedPostId: requestedPostId,
        requestedCommentId: requestedCommentId,
        requestedCommentAuthor: requestedCommentAuthor,
        comment: foundComment
      });
    });
  }
});

app.delete("/posts/:postId/comment/:commentId/:commentAuthor/delete", function (req, res) {
  const requestedPostId = req.params.postId;
  const requestedCommentId = req.params.commentId;
  const requestedCommentAuthor = req.params.commentAuthor;
  var korisnik = req.session.passport;

  if (req.session.passport.user === "") {
    var korisnik = req.session.passport.user;
    Comment.findOneAndDelete({
      _id: requestedCommentId
    }, function (err, res) {
      if (!err) {
        console.log("Uspješno obrisan komentar");
      }
    });
    res.redirect("/posts/" + requestedPostId);
  } else if (req.session.passport === undefined || req.session.passport.user != requestedCommentAuthor) {
    res.render("forbiden", {
      korisnik: korisnik,
      requestedPostId: requestedPostId,
      korisnikKomentara: requestedCommentAuthor
    });
  } else {
    var korisnik = req.session.passport.user;
    Comment.findOneAndDelete({
      _id: requestedCommentId
    }, function (err, res) {
      if (!err) {
        console.log("Uspješno obrisan komentar");
      }
    });
    res.redirect("/posts/" + requestedPostId);
  }
});

app.get("/troskovi", function (req, res) {

  if (req.session.passport === undefined) {
    var korisnik = "";
    res.render("troskovi1", {
      korisnik: korisnik
    });
  } else {
    var korisnik = req.session.passport.user;
    res.render("troskovi2", {
      korisnik: korisnik
    });
  }

});

app.get("/foto", function (req, res) {

  if (req.session.passport === undefined) {
    var korisnik = "";
    res.render("foto1", {
      korisnik: korisnik
    });
  } else {
    var korisnik = req.session.passport.user;
    res.render("foto2", {
      korisnik: korisnik
    });
  }

});

app.get("/register", function (req, res) {
  res.render("register", {
    korisnik: korisnik
  });
});

app.post("/register", function (req, res) {

  const newUser = new User({
    username: req.body.username,
    email: req.body.email
  });

  User.register(newUser, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/");
      });
    }
  });
});

app.get("/login", function (req, res) {
  res.render("login", {
    korisnik: korisnik
  });
});

app.post("/login", function (req, res) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function (err) {
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      passport.authenticate("local")(req, res, function () {
        var korisnik = req.session.passport.user;

        res.redirect("/");
      });
    }
  });
});

app.get("/logout", function (req, res) {
  req.logout();
  req.session.destroy();
  res.redirect("/");
});


app.listen(process.env.PORT || 3000, function () {
  console.log("Server started.");
});