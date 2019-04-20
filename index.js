const express = require('express');
const mongoose = require('mongoose');
const ejs = require('ejs');
const Nexmo = require('nexmo');
const socketio = require('socket.io');
const bodyparser = require('body-parser');
const app = express();

const twilio = require('twilio');
const accountSid = "ACba993dfde5f92e0703d506ecefed240e";
const authToken = "d73961a7fd0eb595ad191009df3930d1";

const client = new twilio(accountSid, authToken);

app.use(bodyparser.urlencoded({ extended: false }));

let MsgSchema = new mongoose.Schema({
    phoneNumber: String,
    groupName: String,
    totalAdults: String,
    totalKids: String
});

let Message = mongoose.model('Message', MsgSchema);

mongoose.connect('mongodb+srv://Anirudh:abc12345@cluster0-qxok1.mongodb.net/test?retryWrites=true')
    .then(() =>
        console.log('mongo server running')
    );

app.get('/', (req, res) => {
    res.end();
})

app.post('/inbound', (req, res) => {
    let from = req.body.From;
    let to = req.body.To;
    let body = req.body.Body;

    Message.find({ phoneNumber: req.body.From }, function(err, message) {
        if (message.length !== 0) {
            if (!message[0].groupName && !message[0].totalAdults && !message[0].totalKids) {
                Message.findByIdAndUpdate(message[0]._id, { "$set": { "groupName": body } }, { "new": true, "upsert": true }, function() {
                    client.messages.create({
                        to: `${from}`,
                        from: `${to}`,
                        body: 'How many adults in your group?'
                    });
                    res.end();
                });
            } else if (!message[0].totalAdults && !message[0].totalKids) {
                Message.findByIdAndUpdate(message[0]._id, { "$set": { "totalAdults": body } }, { "new": true, "upsert": true }, function() {
                    client.messages.create({
                        to: `${from}`,
                        from: `${to}`,
                        body: 'How many kids are in your group?'
                    });
                    res.end();
                });
            } else if (!message[0].totalKids) {
                console.log(body);
                Message.findByIdAndUpdate(message[0]._id, { "$set": { "totalKids": body } }, { "new": true, "upsert": true }, function() {
                    client.messages.create({
                        to: `${from}`,
                        from: `${to}`,
                        body: 'Your spot has been reserved! Congratulations!'
                    });
                    res.end();
                });
            }
        } else {
            if (body == 'RSVP') {
                console.log('Message gets here');
                let newMsg = new Message();
                newMsg.phoneNumber = from;
                newMsg.save(function() {
                    client.messages.create({
                        to: `${from}`,
                        from: `${to}`,
                        body: 'What is the name of your group?'
                    });
                    res.end();
                });

            }
        }
        //console.log(message);

        res.end();
    });
});

app.listen(5000, function() {
    console.log('server running at port 5000');
});