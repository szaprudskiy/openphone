import axios from 'axios'
import zohoConfig from '../zohoConfig.js'

const refreshAccessToken = async () => {
  try {
    const response = await axios.post(
      'https://accounts.zoho.com/oauth/v2/token',
      null,
      {
        params: {
          refresh_token: zohoConfig.refreshToken,
          client_id: zohoConfig.clientId,
          client_secret: zohoConfig.clientSecret,
          grant_type: 'refresh_token',
        },
      }
    )

    const { access_token, expires_in } = response.data

    zohoConfig.accessToken = access_token
    zohoConfig.tokenExpiration = Date.now() + expires_in * 1000

    console.log('access_token!', access_token)

    return access_token
  } catch (error) {
    console.error('Error refreshing access token:', error)
    throw error
  }
}

export default refreshAccessToken
