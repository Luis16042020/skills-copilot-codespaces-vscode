//Create web server
var express = require('express');
var app = express();
//Create a server
var server = require('http').createServer(app);
//Create a server for socket.io
var io = require('socket.io').listen(server);

//Create a connection to the database
var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'comments'
});
connection.connect();

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

//Get all the comments from the database
app.get('/comments', function (req, res) {
    connection.query('SELECT * FROM comments', function (err, rows, fields) {
        if (err) throw err;
        res.send(rows);
    });
});

//Add a comment to the database
app.get('/addcomment', function (req, res) {
    var comment = req.query.comment;
    var username = req.query.username;
    connection.query("INSERT INTO comments (comment, username) VALUES ('" + comment + "', '" + username + "')", function (err, rows, fields) {
        if (err) throw err;
        res.send('success');
    });
});

//Delete a comment from the database
app.get('/deletecomment', function (req, res) {
    var id = req.query.id;
    connection.query("DELETE FROM comments WHERE id = " + id, function (err, rows, fields) {
        if (err) throw err;
        res.send('success');
    });
});

//Create a new socket.io connection
io.sockets.on('connection', function (socket) {
    socket.on('addcomment', function (data) {
        //Add the comment to the database
        connection.query("INSERT INTO comments (comment, username) VALUES ('" + data.comment + "', '" + data.username + "')", function (err, rows, fields) {
            if (err) throw err;
            //Get the ID of the comment that was just added
            connection.query("SELECT LAST_INSERT_ID() as id", function (err, rows, fields) {
                if (err) throw err;
                data.id = rows[0].id;
                //Send the comment to all the clients
                io.sockets.emit('comment', data);
            });
        });
    });

    socket.on('deletecomment', function