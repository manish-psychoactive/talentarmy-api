require('dotenv').config();
const axios = require('axios');

const apiToken = process.env.WEBFLOW_API_TOKEN;

const getHeaders = () => {
  return {
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "Accept-Version": '1.0.0',
      "Content-Type": 'application/json'
    }
  }
}

exports.webFlowRequest = async (url, method, data = null) => {
  let response;
  if (method == 'GET')
    response = await axios.get(url, getHeaders())
  else if (method == 'POST')
    response = await axios.post(url, data, getHeaders())
  if (response.status == 200) {
    return response.data;
  }
  return { status: 'error', message: 'There was an error in fetching data.' };
}
