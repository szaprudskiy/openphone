import axios from 'axios'
import getAccessToken from './getAccessToken.js'

const updateContactWithRecording = async (contactId, recordingUrl) => {
  try {
    const accessToken = await getAccessToken()
    const response = await axios.get(
      `${process.env.ZOHO_CRM_API_BASE_URL}/Contacts/${contactId}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      }
    )

    let currentRecordings = response.data.data[0].Multi_Line_5 || ''

    const recordingsArray = currentRecordings
      .split('\n')
      .filter((msg) => msg.trim() !== '')
    const recordingCount = recordingsArray.length

    const numberedRecording = `${recordingCount + 1}. ${recordingUrl}`

    currentRecordings += `\n${numberedRecording}`

    await axios.put(
      `${process.env.ZOHO_CRM_API_BASE_URL}/Contacts`,
      {
        data: [
          {
            id: contactId,
            Multi_Line_5: currentRecordings,
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

    console.log('Запись успешно добавлена в контакт.')
  } catch (error) {
    console.error('Ошибка при добавлении записи в контакт:', error)
  }
}
export default updateContactWithRecording
