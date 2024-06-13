const formatPhoneNumber = (phone) => {
  const cleaned = ('' + phone).replace(/\D/g, '')
  const match = cleaned.match(/^(\d{1})(\d{3})(\d{3})(\d{4})$/)
  if (match) {
    const matched = `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}`
    console.log('matched', matched)
    return matched
  }
  return null
}

export default formatPhoneNumber
