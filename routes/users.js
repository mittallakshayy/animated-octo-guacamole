const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

// Register route
router.post('/register', (req, res) => {
    const { name, email, password, 'repeat-password': repeatPassword, terms } = req.body;

    // Validate input
    if (password !== repeatPassword) {
        return res.status(400).send('Passwords do not match');
    }

    // Check if user already exists
    User.findOne({ email }).then(user => {
        if (user) {
            return res.status(400).send('Email already exists');
        } else {
            const newUser = new User({
                name,
                email,
                password,
                terms_accepted: terms === 'on'
            });

            // Hash password
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if (err) throw err;
                    newUser.password = hash;

                    // Save user
                    newUser.save()
                        .then(user => res.send('User registered'))
                        .catch(err => console.log(err));
                });
            });
        }
    });
});

// Login route
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Find user by email
    User.findOne({ email }).then(user => {
        if (!user) {
            return res.status(400).send('Email not found');
        }

        // Check password
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) throw err;
            if (isMatch) {
                req.session.user = user;
                res.render("../public/profile.ejs",{user:user});
            } else {
                return res.status(400).send('Password incorrect');
            }
        });
    });
});

// Profile route
router.get('/profile', (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('Unauthorized');
    }

    res.send(`
        <h1>Welcome, ${req.session.user.name}</h1>
        <p>Email: ${req.session.user.email}</p>
        <a href="/users/logout">Logout</a>
    `);
});

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Could not log out.');
        }
        res.redirect('/');
    });
});

module.exports = router;
