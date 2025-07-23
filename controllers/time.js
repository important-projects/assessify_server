function timeConfig(req, res) {
    try {
        const utcDate = new Date()
        const watDate = new Date(utcDate.getTime() + 1 * 60 * 60 * 1000)

        const getOrdinalSuffix = day => {
            if (day > 3 && day < 21) return 'th'
            const suffixes = ['th', 'st', 'nd', 'rd']
            return suffixes[day % 10 > 3 ? 0 : day % 10]
        }

        const day = watDate.getDate()
        const month = watDate.toLocaleString('en-US', { month: 'long' })
        const year = watDate.getFullYear()

        const formattedDate = `${day}${getOrdinalSuffix(day)} ${month}, ${year}`

        console.log('Fetched date data:', formattedDate)
        res.json({ formattedDate })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Couldn't fetch date" })
    }
}

module.exports = timeConfig;