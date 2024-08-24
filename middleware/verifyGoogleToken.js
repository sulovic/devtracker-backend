const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


async function verifyGoogleToken(idToken) {
  try {
    const { payload } = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    return payload;
  } catch (error) {
    throw new Error("Invalid Google ID token");
  }
}

module.exports = verifyGoogleToken;
