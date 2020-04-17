const express = require('express');

const path = require('path');
const config = require('./config.js').config;

const app = express();
const MongoClient = require('mongodb').MongoClient;

let server_port = process.env.PORT || 1337;
let server_host = 'localhost';


// If the ddbb name is not in the env, it is generated
if (!process.env.DATABASE_URI) {
    // process.env.DATABASE_NAME = 'test';
    process.env.DATABASE_NAME = 'blablachallenge';
}

// The mongodb uri
const uri = "mongodb+srv://admin:admin123@blablaviewertest-exjko.mongodb.net/blablachallenge?retryWrites=true&w=majority";

// In case it is needed for testing purposes in local
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Path for static files
app.use('/public', express.static(path.join(__dirname, '/public')));

// Main path, redirecting the user to the client
app.get('/', function(req, res) {
    var result = 'Servidor BlaBlaViewer <br> Usa el cliente en blablaviewer.herokuapp.com'
    res.send(result);
});

// Query geographic information according to the query params
app.get("/getJourneys", async(req, res, next) => {
    let mongoQuery = {}

    let dateFrom = new Date('2017-11-01')
    let dateTo = new Date('2017-11-01')
    let addMonths = 1;

    let minOccR = req.query.minOccR && req.query.minOccR !== '' ? parseFloat(req.query.minOccR) : 0;
    let maxOccR = req.query.maxOccR && req.query.maxOccR !== '' ? parseFloat(req.query.maxOccR) : 1;

    if (req.query.dateFrom && req.query.dateFrom !== '') {
        dateFrom = new Date(req.query.dateFrom);
        dateTo = new Date(req.query.dateFrom);
        if (req.query.monthsNum && req.query.monthsNum <= 3) {
            addMonths = parseInt(req.query.monthsNum);
        }
    }
    dateTo.setMonth(dateTo.getMonth() + addMonths); // suma un mes
    dateTo.setDate(dateTo.getDate() - 1); // resta un dia

    mongoQuery.DIA = {
        $gte: dateFrom,
        $lte: dateTo
    }

    mongoQuery.$expr = {
        $and: [{
                $gte: [{
                    $cond: [
                        { $eq: ['$ASIENTOS_OFERTADOS', 0] },
                        0,
                        { $divide: ['$ASIENTOS_CONFIRMADOS', '$ASIENTOS_OFERTADOS'] }
                    ]
                }, minOccR]
            },
            {
                $gte: [maxOccR, {
                    $cond: [
                        { $eq: ['$ASIENTOS_OFERTADOS', 0] },
                        0,
                        { $divide: ['$ASIENTOS_CONFIRMADOS', '$ASIENTOS_OFERTADOS'] }
                    ]
                }]
            }
        ]
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


    const client = new MongoClient(uri, { useUnifiedTopology: true });
    await client.connect().then(async() => {
        const collection = client.db(process.env.DATABASE_NAME).collection("Journeys");
        await collection.find(mongoQuery, { fields: { DIA: 1, ORIGEN_C: 1, DESTINO_C: 1, ORIGEN_P: 1, DESTINO_P: 1, IMP_KM: 1, VIAJES_CONFIRMADOS: 1 } })
            .toArray().then((databaseResponse) => {
                res.json(databaseResponse);
                client.close();
            });
    }).catch((err) => console.log(err));
});

// get the list of origin provinces
app.get("/getProvincesOrigin", async(req, res, next) => {
    const client = new MongoClient(uri);
    await client.connect().then(async() => {
        const collection = client.db(process.env.DATABASE_NAME).collection("Journeys");
        await collection.distinct('ORIGEN_P').then((databaseResponse) => {
            res.json(databaseResponse);
            client.close();
        });
    }).catch((err) => console.log(err));
});

// get the list of destination provinces
app.get("/getProvincesDestination", async(req, res, next) => {
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