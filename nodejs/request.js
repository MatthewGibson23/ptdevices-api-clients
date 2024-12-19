'use strict';

const createApplication = require('./');
const { AuthorizationCode } = require('simple-oauth2');
const axios = require('axios');

createApplication(({ app, callbackUrl, aToken }) => {

  //Configure the authorization code flow
  const client = new AuthorizationCode({
    client: {
      id: process.env.CLIENT_ID,
      secret: process.env.CLIENT_SECRET,
    },
    auth: {
      tokenHost: 'https://ptdevices.com',
      authorizeHost: 'https://ptdevices.com',
      tokenPath: '/oauth/token',
      authorizePath: '/oauth/authorize',
    },
    options: {
      authorizationMethod: 'header',
    },
  });

  // Authorization uri definition
  const authorizationUri = client.authorizeURL({
    redirect_uri: callbackUrl,
    scope: 'all',
    state: '3(#0/!~',
  });

  // Initial page redirecting to PTDevices for account authentication
  app.get('/auth', (req, res) => {
    console.log(authorizationUri);
    res.redirect(authorizationUri);
  });

  // Callback service parsing the authorization token and asking for the access token
  // NOTE: this callback URL must be provided to PTDevices in order for this to work properly.
  app.get('/callback', async (req, res) => {
    const { code } = req.query;
    const options = {
      code,
      redirect_uri: callbackUrl,
    };

    try {
      const accessToken = await client.getToken(options);

      console.log('The resulting token: ', accessToken.token);

      aToken = accessToken.token;
      const msg = "<h3>Token retrieved!</h1><p>" + accessToken.token.access_token + "</p><a href='/act'>Get account info</a>";
      res.send(msg);
    } catch (error) {
      console.error('Access Token Error', error.message);
      return res.status(500).json('Authentication failed');
    }
  });

  //Make a resource request for your account information returned in JSON format
  //All resource information is at ptdevices.com/api/documentation
  app.get('/act',(req,res) => {
    let config = {
      headers: {
        "Authorization": "Bearer "+aToken.access_token
      }
    }
    axios.get('https://ptdevices.com/v1/account',config)
    .then(response => {
      res.status(200).json(response.data);
    })
    .catch(error => {
      console.log(error);
      res.status(500);
    });
  });

  //App starts here.
  app.get('/', (req, res) => {
    res.send('Hello there!<br><a href="/auth">Start authentication with PTDevices</a>');
  });
});