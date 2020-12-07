The objective of this assignment is to write a very simple client (employing Vue.js) interacting with a
server (implemented in Node.js) which in turn interacts with a Cloud-based Database (using AWS
DynamoDB) and an Object stored in the Object-store (using AWS S3)

Raw data concerning movies is stored in JSON format in an object store that I have set up at :

Region: EU(Ireland)
Bucket-Name:csu44000assignment220
Object Key (FileName):moviedata.json

There is also a copy in this bucket – for any account that cannot access the EU region
Region:US East (us-east-1)
Bucket-Name:csu44000assign2useast20
Object Key (Filename): moviedata.json

You should write a simple client in Vue.js which has 3 buttons:
1. Create Database
2. Query Database with two input boxes to allow a movie name and a year to be entered
3. Destroy Database

Clicking each of these buttons will invoke API primitives on your Cloud-based server and deal with
the responses.

‘Create’ should cause your Node.js server to make a table in a DynamoDB database – fetch the raw
data from the S3 object and upload it to the newly created database. You can use a small sub-set of
the fields including [title, release-date, rank]

‘Query’ should cause your Node.js server to find all the movies in a given year, that begin-with the
entered text string – and display them on the web-page

‘Destroy’ should cause the database table to be deleted. 
