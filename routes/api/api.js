const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const path = require('path');

const monk = require('monk');
const url = 'mongodb+srv://ravichandra:ravimongodb@cluster0-fti2i.mongodb.net/matrinomial?retryWrites=true&w=majority';
const db = monk(url);

const DIR = './upload';
const multer = require('multer');
let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, DIR)
    },
    filename: (req, file, cb) => {
        console.log('filename');
        console.log(path.extname(file.originalname));
        cb(null, file.fieldname + '-' + Date.now() + '.' + path.extname(file.originalname));
    }
})

let upload = multer({ storage: storage })

db.then(() => {
    console.log('connected correctly to db');
}).catch(err => {
    console.log('error connecting db', err);
})

function verifyToken(req,res,next){
    if(!req.headers.authorization){
        return res.status(401).send('unathorized request')
    }
    let token = req.headers.authorization.split(' ')[1];
    if(token == 'null'){
        return res.status(401).send('unauthorized request');
    }
    let payload = jwt.verify(token,'secretKey');
    if(!payload){
        return res.status(401).send('unauthorized request');
    }
    next()
}

router.get('/', (req, res) => {
    res.send('Hi from api');
});

//  User validating and login in
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const collection = db.get('users');

    collection.findOne({ email }).then((data) => {
        if (password === data.password) {
            console.log('successfull login');
            sess = req.session;
            sess.email = email;
            const payload = { subject: data._id };
            const token = jwt.sign(payload, 'secretKey');
            res.status(200).send({ token, email });
        } else {
            res.status(401).send('invalid password');
        }
    }).catch(e => {
        res.status(401).send('invalid user');
    });

});

async function insertinlogin(email,password){
    const collection = db.get('users');
    await collection.insert({email,password}).then((data) => {
        console.log(data)
    }).catch(err => {
        console.log(err)
    })
}

//  Registering user
router.post('/registration', (req, res) => {
    const collection = db.get('members');
    const userdetails = req.body;
    collection.insert(userdetails).then(data => {
        console.log('inserted in member collection');
        insertinlogin(data.email,data.password)
        res.status(200).send(data);
    }).catch(err => {
        console.log('error inserting in member collection')
        res.status(400).send(err);
    })
});

router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        console.log("your request does not have file");        
        return res.send({ success: 'false' })
    } else {        
        console.log(sess.email);
        console.log('your file has been recieved successfully');
        return res.send({ success: 'true' });
    }
});

router.put('/updateuser/:email', (req, res) => {
    console.log('updateuser');
    console.log(req.body);
    const email = req.params.email;
    const collection = db.get('members');
    collection.findOneAndUpdate({ email: email },{$set: req.body}).then(data => {
        res.status(200).send(data);
    }).catch(err => {
        res.status(400).send(err);
    });
    //res.send({email});
});

router.get('/member/:email', verifyToken, (req, res) => {
    const email = req.params.email;
    const collection = db.get('members');
    collection.findOne({ email: email }).then(data => {
        res.status(200).send(data);
    }).catch(err => {
        res.status(400).send(err);
    });
})

router.get('/member', (req, res) => {
    const email = req.params.email;
    const collection = db.get('members');
    collection.find({ }).then(data => {
        res.status(200).send(data);
    }).catch(err => {
        res.status(400).send(err);
    });
})

module.exports = router;