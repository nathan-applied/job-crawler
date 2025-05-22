
const sendSlackNotification = async (jobs) => {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) return false;
    
    let messageLines = ['*🆕 New jobs posted!*'];

    for (let company of Object.keys(jobs)) {
        messageLines.push(`\r\n*${company}*`);
        for (let job of jobs[company]) {
            messageLines.push(`<${job.link}|${job.title}>`);
        }
    }

    const payload = {
        text: messageLines.join('\r\n')
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