const express = require('express');

const path = require('path');
const config = require('./config.js').config;

const app = express();
const MongoClient = require('mongodb').MongoClient;

let server_port = process.env.PORT || 1337;
let server_host = 'localhost';

if (!process.env.DATABASE_URI) {
    process.env.DATABASE_URI = `mongodb://admin:${config.mongoPass}@blablaviewertest-exjko.mongodb.net/test?retryWrites=true&w=majority`;
}

if (!process.env.DATABASE_URI) {
    process.env.DATABASE_NAME = 'test';
}

const uri = "mongodb+srv://admin:admin123@blablaviewertest-exjko.mongodb.net/test?retryWrites=true&w=majority";

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


app.use('/public', express.static(path.join(__dirname, '/public')));

app.get('/', function(req, res) {
    var result = 'Servidor BlaBlaViewer <br> Usa el cliente en blablaviewer.herokuapp.com'
    res.send(result);
});

app.get("/getJourneys", async(req, res, next) => {
    console.log(req.params);
    const client = new MongoClient(uri);
    await client.connect().then(async() => {
        const collection = client.db(process.env.DATABASE_NAME).collection("Journeys");
        await collection.find({ DIA: { $gte: new Date("2017-11-12"), $lte: new Date("2017-11-12") } }, { fields: { ORIGEN_C: 1, DESTINO_C: 1 } }).toArray().then((databaseResponse) => {
            console.log(databaseResponse);
            res.json(databaseResponse);
            client.close();
        });
    }).catch((err) => console.log(err));
});


app.get("/getProvincesOrigin", async(req, res, next) => {
    console.log(req.params);
    const client = new MongoClient(uri);
    await client.connect().then(async() => {
        const collection = client.db(process.env.DATABASE_NAME).collection("Journeys");
        await collection.distinct('ORIGEN_P').then((databaseResponse) => {
            res.json(databaseResponse);
            client.close();
        });
    }).catch((err) => console.log(err));
});

app.get("/getProvincesDestination", async(req, res, next) => {
    console.log(req.params);
    const client = new MongoClient(uri);
    await client.connect().then(async() => {
        const collection = client.db(process.env.DATABASE_NAME).collection("Journeys");
        await collection.distinct('DESTINO_P').then((databaseResponse) => {
            res.json(databaseResponse);
            client.close();
        });
    }).catch((err) => console.log(err));
});


app.listen(server_port, function() {
    console.log(`BlaBlaViewerServer escuchando en ${config.httpProtocol}://${server_host}:${server_port}`);
});