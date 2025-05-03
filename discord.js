
const sendDiscordNotification = async (jobs) => {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL; // Best practice: store in env var

    let embeds = []
    for(let k of Object.keys(jobs)){
        let job_links = [];
        for (let jobj of jobs[k]) {
            embeds.push({
                title: `${jobj.title} - ${k}`,
                //description: "A new job listing is available in Los Angeles.",
                url: jobj.link,
                color: 5814783 // optional color code
            })
        }
    }

    const payload = {
        embeds
    };

    console.log(payload)

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        console.error('Failed to send Discord message', await response.text());
    }
}

export default sendDiscordNotification;