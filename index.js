const fs = require('node:fs');
const superagent = require('superagent');

const TARGET_USER = 'thomaswmy';
const data = fs.existsSync('data.json') ? JSON.parse(fs.readFileSync('data.json').toString()) : [];
const cookie = JSON.parse(fs.readFileSync('secret.json'));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function downloadSubmission(submissionId, retry = 30) {
    if (fs.existsSync(`submissions/${submissionId}.json`) && fs.existsSync(`submissions/197421440.json`)) return;
    console.info(`Downloading submission ${submissionId}`);
    try {
        const { body: { currentData: { record } } } = await superagent.get(`https://www.luogu.com.cn/record/${submissionId}`)
            .query({ _contentOnly: true })
            .set('Cookie', cookie);
        record.user = record.user.name;
        if (record.sourceCode) {
            fs.writeFileSync(`submissions/${submissionId}.source`, record.sourceCode);
            record.sourceCode = null;
        }
        fs.writeFileSync(`submissions/${submissionId}.json`, JSON.stringify(record));
        await sleep(3000);
    }
    catch (err) {
        console.error(err);
        await sleep(3000);
        downloadSubmission(submissionId, retry - 1)
    }
}

async function main() {
    for (let page = 1; ; page++) {
        console.info(`page ${page}`);
        const { body } = await superagent.get('https://www.luogu.com.cn/record/list')
            .query({
                user: TARGET_USER,
                page,
                _contentOnly: true,
            })
            .set('Cookie', cookie);
        if (body.code !== 200) throw new Error('Status is not 200');
        const records = body.currentData.records.result;
        let newRecord = false, duplicate = false;
        for (const rdoc of records) {
            rdoc.user = rdoc.user.name;
            if (data.find((r) => r.id === rdoc.id)) duplicate = true;
            else newRecord = true, data.push(rdoc);
        }
        fs.writeFileSync('data.json', JSON.stringify(data.sort((x, y) => x.id - y.id), null, '  '));
        if (!newRecord || duplicate) break;
        await sleep(3000);
    }
    for (const rdoc of data) await downloadSubmission(rdoc.id);
}

main();
