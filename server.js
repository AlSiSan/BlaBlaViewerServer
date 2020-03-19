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
    let mongoQuery = {}

    console.log(req.query);

    if (req.query.dateFrom && req.query.dateTo && req.query.dateFrom !== '' && req.query.dateTo !== '') {
        mongoQuery.DIA = {
            $gte: new Date(req.query.dateFrom),
            $lte: new Date(req.query.dateTo)
        }
    }

    if (req.query.provinceFrom && req.query.provinceFrom !== '') {
        mongoQuery.ORIGEN_P = req.query.provinceFrom
    }

    if (req.query.provinceTo && req.query.provinceTo !== '') {
        mongoQuery.DESTINO_P = req.query.provinceTo
    }

    if (req.query.countryFrom && req.query.countryFrom !== '') {
        mongoQuery.ORIGEN_S = req.query.countryFrom
    }

    if (req.query.countryTo && req.query.countryTo !== '') {
        mongoQuery.DESTINO_S = req.query.countryTo
    }


    const client = new MongoClient(uri);
    await client.connect().then(async() => {
        const collection = client.db(process.env.DATABASE_NAME).collection("Journeys");
        await collection.find(mongoQuery, { fields: { ORIGEN_C: 1, DESTINO_C: 1, ORIGEN_P: 1, DESTINO_P: 1 } })
            .toArray().then((databaseResponse) => {
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