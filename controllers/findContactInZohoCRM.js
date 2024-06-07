import axios from 'axios'

const findContactInZohoCRM = async (phone) => {
  try {
    const response = await axios.get(
      `${process.env.ZOHO_CRM_API_BASE_URL}/Contacts/search?phone=${phone}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${process.env.TOKEN}`,
        },
      }
    )

    console.log('response', response.data.data[0].Phone)

    if (response.data.data && response.data.data.length > 0) {
      return response.data.data[0].Phone
    } else {
      return null
    }
  } catch (error) {
    console.error('Error finding contact in Zoho CRM:', error)
    return null
  }
}
export default findContactInZohoCRM
