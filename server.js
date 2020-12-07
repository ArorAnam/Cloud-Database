/*
    Author: Naman Arora
    Date: 29/11/2020
*/
const express = require('express');
const app = express();
const port = 5001;
const path = require("path");
let publicPath = path.resolve(__dirname, "public");
app.use(express.static(publicPath));
const fetch = require("node-fetch");

app.listen(port, () => console.log(`App listening on port ${port}!`));

app.get('/create', createDatabase);
app.get('/query/:year/:name', queryDatabase);
app.get('/destroy', destroyDatabase);

// Send html as default
app.get('/', (req, res) => {
    res.sendFile('index.html', {root: __dirname})
})

// _______________________________Create Database _______________________________
/*
This will make a table in a DynamoDB database on the cloud.
the it will fetch the raw data from the S3 object.
And finally upload it to the newly created database.
*/
function createDatabase(req, res) {
    // Set up AWS and DynamoDB
    var AWS = require("aws-sdk");
    AWS.config.update({region: "us-east-1"});
    var dynamodb = new AWS.DynamoDB();

    // Specify movie parameters for the table
    var params = {
        TableName : "Movies",
        KeySchema: [       
            { AttributeName: "year", KeyType: "HASH"},  // Partition key
            { AttributeName: "title", KeyType: "RANGE" }  // Sort key
        ],
        AttributeDefinitions: [       
            { AttributeName: "year", AttributeType: "N" },
            { AttributeName: "title", AttributeType: "S" }
        ],
        ProvisionedThroughput: {       
            ReadCapacityUnits: 5, 
            WriteCapacityUnits: 5
        }
    };

    // Create the table
    dynamodb.createTable(params, function(err, data) {
        if (err) {
            console.error("Error in creating table. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("Table creation successful. Table description JSON:", JSON.stringify(data, null, 2));
        }
    });

    // Fetch movie data from the S3 object
    // Have a 5 second delay
    let p = new Promise((res) => {
        setTimeout(() => {
            // Fetch S3 data
            const s3 = new AWS.S3();
            let objectData = null;
            var getParams = {
                // provided in the assignment description
                Bucket: 'csu44000assign2useast20',
                Key: 'moviedata.json'
            }

            s3.getObject(getParams, function(err, data) {
                if (err) {
                    return err;
                }

                objectData = data.Body.toString('utf-8');
                var jsonData = JSON.parse(objectData);
                var docClient = new AWS.DynamoDB.DocumentClient();
                
                // Now add data to database
                console.log("Please wait.....Ipmporting movies to DynamoDB");
                jsonData.forEach(function(movie) {
                    var params = {
                        TableName: "Movies",
                        Item: {
                            "year":  movie.year,
                            "title": movie.title,
                            "info":  movie.info
                        }
                    };

                    docClient.put(params, function(err, data) {
                        if (err) {
                            console.error("Unable to add movie", movie.title, ". Error JSON:", JSON.stringify(err, null, 2));
                        } else {
                            console.log("Item added successfully: ", movie.title);
                        }
                    });
                });
            });
        }, 5000);
    });

    console.log("All records sucessfully received !!!");
}

// ________________________________Query Database_________________________________
/*
Here we find all the movies in a given year.
that begin with the entered text string.
There are two input boxes to allow a movie name and a year to be entered.
Also display them on the webpage.
*/
function queryDatabase(req, res) {
    // get the year & movie
    let userYear = req.params.year;
    let userMovie = req.params.name;
    
    console.log("-QUERYING-");
    console.log("-YEAR: " + userYear + "-");
    console.log("-MOVIE: " + userMovie + "-");
    
    var AWS = require("aws-sdk");
    AWS.config.update({region: "us-east-1"});
    var docClient = new AWS.DynamoDB.DocumentClient();

    // set the query parameters
    var params = {
        TableName : "Movies",
        ProjectionExpression:"#yr, title",
        KeyConditionExpression: "#yr = :yyyy and begins_with ( title, :letter1 )",
        ExpressionAttributeNames:{
            "#yr": "year"
        },
        ExpressionAttributeValues: {
            ":yyyy": parseInt(userYear),
            ":letter1": userMovie
        }
    };

    // make object for return
    var jsonStr = '{"list":[]}';
    var jsonObj = JSON.parse(jsonStr);

    // Do the query
    docClient.query(params, function(err, data) {
        if (err) {
            console.log("Query unsuccessful. Error:", JSON.stringify(err, null, 2));
        } else {
            console.log("Query succeeded.");
            data.Items.forEach(function(item) {
                // Push the movie to the JSON array
                jsonObj['list'].push({"movieName":JSON.stringify(item.title)});
                console.log(" -", item.year + ": " + item.title);
            });
        }
        // Lastly return the list of movies
        res.json(jsonObj);
    });
}

// _________________________________Destroy Database________________________________
/*
Delete the database table.
*/
function destroyDatabase(req, res) {
    var AWS = require("aws-sdk");
    AWS.config.update({region: "us-east-1"});
    var dynamodb = new AWS.DynamoDB();

    var params = {
        TableName : "Movies"
    };

    dynamodb.deleteTable(params, function(err, data) {
        if (err) {
            console.error("Unable to delete table. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("Deleted the table. Table description JSON:", JSON.stringify(data, null, 2));
        }
    });
}