const functions = require("firebase-functions");
const express = require("express");
const axios = require('axios');

const jobadderWebhookListen = express();

jobadderWebhookListen.post('', async (req, res) => {
  const eventData = req.body;
  const jobBoard = eventData['jobBoard']
  if (jobBoard['name'] == 'Talent Army') {
    const apiToken = process.env.JOBADDER_ACCESS_TOKEN;
    const adId = eventData['jobAd']['adId'];
    const boardId = jobBoard['boardId'];
    const response = await axios.get(`https://au2api.jobadder.com/v2/jobboards/${boardId}/ads/${adId}`, {
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": 'application/json'
      }
    })
    const adData = response.data;

    const data = {}
    const talentArmyData = adData['portal']['fields'];
    talentArmyData.forEach(field => {
      data[field['fieldName']] = field['value'];
      if (field.hasOwnProperty('fields')) {
        field['fields'].forEach(innerField => {
          data[innerField['fieldName']] = innerField['value'];
        })
      }
    });
    const category = data['Category'];
    const subCategory = data['Sub Category'];
    const location = data['Location'];
    const workType = data['Work Type'];
    const applyLink = adData['links']['ui']['applications'];

    const webflowData = {
      "slug": adId.toString(),
      "name": eventData['jobAd']['title'],
      "job-category": category,
      "job-subcategory": subCategory,
      "location": location,
      "work-type": workType,
      "summary": eventData['jobAd']['summary'],
      "description": eventData['jobAd']['description'],
      "bullet-points": eventData['jobAd']['bulletPoints'].join('<br/>'),
      "apply-link": applyLink,
      "contact": eventData['jobAd']['owner']['email'],
      "_archived": false,
      "_draft": false
    }

    const webResponse = await axios.post(`https://api.webflow.com/collections/${process.env.WEBFLOW_COLLECTION_ID}/items`, {fields: webflowData}, {
      headers: {
        "Authorization": `Bearer ${process.env.WEBFLOW_API_TOKEN}`,
        "Accept-Version": '1.0.0',
        "Content-Type": 'application/json'
      }
    })
    console.log(webResponse)
  }
  res.send("Jobad created in webflow");
});

exports.jobadderWebhookListen = functions.https.onRequest(jobadderWebhookListen);
