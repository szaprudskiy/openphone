import zohoConfig from '../zohoConfig.js'
import refreshAccessToken from './refreshAccessToken.js'

const getAccessToken = async () => {
  if (!zohoConfig.accessToken || Date.now() >= zohoConfig.tokenExpiration) {
    console.log('Access token expired or not available, refreshing token...')
    return await refreshAccessToken()
  }
  return zohoConfig.accessToken
}

export default getAccessToken
