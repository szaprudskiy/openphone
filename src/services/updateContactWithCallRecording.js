import axios from 'axios'

const updateContactWithRecording = async (contactId, recordingUrl) => {
  try {
    const response = await axios.get(
      `${process.env.ZOHO_CRM_API_BASE_URL}/Contacts/${contactId}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${process.env.TOKEN}`,
        },
      }
    )

    let currentRecordings = response.data.data[0].Multi_Line_5 || ''

    currentRecordings += `\n${recordingUrl}`

    await axios.put(
      apiUrl,
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
          Authorization: `Zoho-oauthtoken ${process.env.TOKEN}`,
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
