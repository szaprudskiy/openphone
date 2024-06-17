import axios from 'axios'
import getAccessToken from './getAccessToken.js'

const createContactInZohoCRM = async (phone) => {
  try {
    const accessToken = await getAccessToken()
    const response = await axios.post(
      `${process.env.ZOHO_CRM_API_BASE_URL}/Contacts`,
      {
        data: [
          {
            Phone: phone,
            Last_Name: 'OpenPhone',
          },
        ],
      },
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (response.data.data && response.data.data.length > 0) {
      return response.data.data[0]
    } else {
      return null
    }
  } catch (error) {
    console.error('Error creating contact in Zoho CRM:', error)
    return null
  }
}

export default createContactInZohoCRM
