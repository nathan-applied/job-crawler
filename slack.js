
const sendSlackNotification = async (jobs) => {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL; // Best practice: store in env var

    let blocks = []
    for(let k of Object.keys(jobs)){
        let job_links = [];
        for (let jobj of jobs[k]) {
            job_links.push(`<${jobj.link}|${jobj.title}>*\n`)
        }
        blocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*New Jobs From ${k}*: \r\n${job_links.join('\r\n')}`
            }
        });
    }

    const payload = {
        text: `🆕 New jobs posted!`,
        blocks
    };

    console.log(payload)

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        console.error('Failed to send Slack message', await response.text());
    }
}

export default sendSlackNotification;