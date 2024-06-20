import axios from 'axios'
import getAccessToken from './getAccessToken.js'

const findContactInZohoCRM = async (phone) => {
  try {
    const accessToken = await getAccessToken()
    const response = await axios.get(
      `https://www.zohoapis.com/crm/v2/Contacts/search?phone=${phone}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      }
    )

    if (response.data.data && response.data.data.length > 0) {
      return response.data.data[0]
    } else {
      return null
    }
  } catch (error) {
    console.error('Error finding contact in Zoho CRM:', error)
    return null
  }
}
export default findContactInZohoCRM
