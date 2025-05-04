
const sendDiscordNotification = async (jobs) => {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return false;

    // Flatten job data into a single list of embeds
    const embeds = [];
    for (let company of Object.keys(jobs)) {
        for (let job of jobs[company]) {
            embeds.push({
                title: `${job.title} - ${company}`,
                url: job.link,
                color: 5814783
            });
        }
    }

    // Send in batches of 10 due to Discord's embed limit
    const BATCH_SIZE = 10;
    for (let i = 0; i < embeds.length; i += BATCH_SIZE) {
        const payload = {
            embeds: embeds.slice(i, i + BATCH_SIZE)
        };

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error('Failed to send Discord message', await response.text());
        }
    }
};

export default sendDiscordNotification;