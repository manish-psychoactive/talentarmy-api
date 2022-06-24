const express = require('express');
const axios = require('axios');
require('dotenv').config();

const { webFlowRequest } = require('./lib/webflow_request');

const app = express();
const PORT = 5005;

const JOBADDER_AUTHORIZE_URL = 'https://id.jobadder.com/connect/authorize';
const JOBADDER_TOKEN_URL = 'https://id.jobadder.com/connect/token'
const JOBADDER_API_URL = 'https://au2api.jobadder.com/v2/'
const REDIRECT_URI = 'http://localhost:5005/jobadder/redirect'

const getWebflow = async (url) => {
    const apiToken = process.env.WEBFLOW_API_TOKEN;
    let resp = await axios.get(url, {
        headers: {
            "Authorization": `Bearer ${apiToken}`,
            "Accept-Version": '1.0.0'
        }
    });
    return resp.data;
}

app.get('/', async (req, res)=>{
    const data = {
      "fields": {
        "name": "Quality Assurance",
        "slug": "quality-assurance",
        "company": "new test company",
        "posted": "2022-06-12T12:30:00Z",
        "_archived": false,
        "_draft": false
      }
    }
    const response = await webFlowRequest('https://api.webflow.com/collections/62a8abdb74ec473d80d3c526/items', 'POST', data)
    res.status(200);
    console.log('response', response);
    res.send(`New job created with id: ${response["_id"]}`);
});

app.get('/jobadder/authorize', async (req, res) => {
    const clientId = process.env.JOBADDER_CLIENT_ID;
    const scope = 'read write offline_access';
    res.redirect(JOBADDER_AUTHORIZE_URL +`?response_type=code&client_id=${clientId}&scope=${scope}&redirect_uri=${REDIRECT_URI}`)
});

app.get('/jobadder/redirect', async (req, res) => {
    const queryParams = req.query;
    console.log('queies', queryParams);
    if (Object.keys(queryParams).includes('code')) {
      // successful authorization
        const code = queryParams['code'];
        console.log('code', code)
        const params = {
            grant_type: 'authorization_code',
            code,
            redirect_uri: REDIRECT_URI,
            client_id: process.env.JOBADDER_CLIENT_ID,
            client_secret: process.env.JOBADDER_CLIENT_SECRET,
        };
        const headers = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
        const response = await axios.post(JOBADDER_TOKEN_URL, new URLSearchParams(params).toString(), headers);
        if (response.status_code == 400) {
            console.log('There was an error in fetching tokens')
        } else {
            console.log('token codes', response.data)
            res.send(JSON.stringify(response.data))
        }
    } else {
      // error
        console.log('Access Denied');
    }
});

app.get('/jobadder/refresh-tokens', async (req, res) => {
    console.log('token');
    const refreshToken = process.env.JOBADDER_REFRESH_TOKEN;

    const params = {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.JOBADDER_CLIENT_ID,
        client_secret: process.env.JOBADDER_CLIENT_SECRET,
    };
    const headers = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    const response = await axios.post(JOBADDER_TOKEN_URL, new URLSearchParams(params).toString(), headers);
    if (response.status_code == 400) {
        console.log('There was an error in fetching tokens')
    } else {
        console.log('token codes', response.data)
        res.send(JSON.stringify(response.data))
    }
});

app.get('/jobadder/webhooks', async (req, res) => {
    const headers = {
        headers: {
        "Authorization": `Bearer ${process.env.JOBADDER_ACCESS_TOKEN}`,
        "Content-Type": 'application/json'
        }
    }
    const response = await axios.get(`${JOBADDER_API_URL}/webhooks`, headers);
    console.log(response.data);
    res.send(response.data.links.self)
});


// add jobad_posted webhook
app.get('/jobadder/webhooks/add', async (req, res) => {
    const headers = {
        headers: {
        "Authorization": `Bearer ${process.env.JOBADDER_ACCESS_TOKEN}`,
        "Content-Type": 'application/json'
        }
    }
    const events = ['jobad_posted'];
    const returnUrl = 'https://localhost:5005/jobadder/webhooks/listen';
    const data = {
        name: 'Jobad posted webhook',
        events,
        url: returnUrl,
        status: 'Enabled'
    }
    const response = await axios.post(`${JOBADDER_API_URL}/webhooks`, data, headers);
    console.log(response);
});


app.listen(PORT, (error) =>{
    if(!error)
        console.log("Server is Successfully Running, and App is listening on port "+ PORT)
    else
        console.log("Error occurred, server can't start", error);
    }
);
